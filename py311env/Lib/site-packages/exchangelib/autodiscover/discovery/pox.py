import logging
import time

from ...configuration import Configuration
from ...errors import AutoDiscoverFailed, RedirectError, TransportError, UnauthorizedError
from ...protocol import Protocol
from ...transport import AUTH_TYPE_MAP, DEFAULT_HEADERS, GSSAPI, NOAUTH, get_auth_method_from_response
from ...util import (
    CONNECTION_ERRORS,
    TLS_ERRORS,
    DummyResponse,
    ParseError,
    _back_off_if_needed,
    get_redirect_url,
    post_ratelimited,
)
from ..cache import autodiscover_cache
from ..properties import Autodiscover
from ..protocol import AutodiscoverProtocol
from .base import BaseAutodiscovery

log = logging.getLogger(__name__)


def discover(email, credentials=None, auth_type=None, retry_policy=None):
    ad_response, protocol = PoxAutodiscovery(email=email, credentials=credentials).discover()
    protocol.config.auth_typ = auth_type
    protocol.config.retry_policy = retry_policy
    return ad_response, protocol


class PoxAutodiscovery(BaseAutodiscovery):
    URL_PATH = "Autodiscover/Autodiscover.xml"

    def _build_response(self, ad_response):
        if not ad_response.autodiscover_smtp_address:
            # Autodiscover does not always return an email address. In that case, the requesting email should be used
            ad_response.user.autodiscover_smtp_address = self.email

        protocol = Protocol(
            config=Configuration(
                service_endpoint=ad_response.protocol.ews_url,
                credentials=self.credentials,
                version=ad_response.version,
                auth_type=ad_response.protocol.auth_type,
            )
        )
        return ad_response, protocol

    def _quick(self, protocol):
        try:
            r = self._get_authenticated_response(protocol=protocol)
        except TransportError as e:
            raise AutoDiscoverFailed(f"Response error: {e}")
        if r.status_code == 200:
            try:
                ad = Autodiscover.from_bytes(bytes_content=r.content)
            except ParseError as e:
                raise AutoDiscoverFailed(f"Invalid response: {e}")
            else:
                return self._step_5(ad=ad)
        raise AutoDiscoverFailed(f"Invalid response code: {r.status_code}")

    def _get_unauthenticated_response(self, url, method="post"):
        """Get auth type by tasting headers from the server. Do POST requests be default. HEAD is too error-prone, and
        some servers are set up to redirect to OWA on all requests except POST to the autodiscover endpoint.

        :param url:
        :param method:  (Default value = 'post')
        :return:
        """
        # We are connecting to untrusted servers here, so take necessary precautions.
        self._ensure_valid_hostname(url)

        kwargs = dict(
            url=url, headers=DEFAULT_HEADERS.copy(), allow_redirects=False, timeout=AutodiscoverProtocol.TIMEOUT
        )
        if method == "post":
            kwargs["data"] = Autodiscover.payload(email=self.email)
        retry = 0
        t_start = time.monotonic()
        while True:
            _back_off_if_needed(self.INITIAL_RETRY_POLICY.back_off_until)
            log.debug("Trying to get response from %s", url)
            with AutodiscoverProtocol.raw_session(url) as s:
                try:
                    r = getattr(s, method)(**kwargs)
                    r.close()  # Release memory
                    break
                except TLS_ERRORS as e:
                    # Don't retry on TLS errors. They will most likely be persistent.
                    raise TransportError(str(e))
                except CONNECTION_ERRORS as e:
                    r = DummyResponse(url=url, request_headers=kwargs["headers"])
                    total_wait = time.monotonic() - t_start
                    if self.INITIAL_RETRY_POLICY.may_retry_on_error(response=r, wait=total_wait):
                        log.debug("Connection error on URL %s (retry %s, error: %s). Cool down", url, retry, e)
                        # Don't respect the 'Retry-After' header. We don't know if this is a useful endpoint, and we
                        # want autodiscover to be reasonably fast.
                        self.INITIAL_RETRY_POLICY.back_off(self.RETRY_WAIT)
                        retry += 1
                        continue
                    log.debug("Connection error on URL %s: %s", url, e)
                    raise TransportError(str(e))
        try:
            auth_type = get_auth_method_from_response(response=r)
        except UnauthorizedError:
            # Failed to guess the auth type
            auth_type = NOAUTH
        if r.status_code in (301, 302) and "location" in r.headers:
            # Make the redirect URL absolute
            try:
                r.headers["location"] = get_redirect_url(r)
            except TransportError:
                del r.headers["location"]
        return auth_type, r

    def _get_authenticated_response(self, protocol):
        """Get a response by using the credentials provided. We guess the auth type along the way.

        :param protocol:
        :return:
        """
        # Redo the request with the correct auth
        data = Autodiscover.payload(email=self.email)
        headers = DEFAULT_HEADERS.copy()
        session = protocol.get_session()
        if GSSAPI in AUTH_TYPE_MAP and isinstance(session.auth, AUTH_TYPE_MAP[GSSAPI]):
            # https://docs.microsoft.com/en-us/exchange/client-developer/web-service-reference/pox-autodiscover-request-for-exchange
            headers["X-ClientCanHandle"] = "Negotiate"
        try:
            r, session = post_ratelimited(
                protocol=protocol,
                session=session,
                url=protocol.service_endpoint,
                headers=headers,
                data=data,
            )
            protocol.release_session(session)
        except UnauthorizedError as e:
            # It's entirely possible for the endpoint to ask for login. We should continue if login fails because this
            # isn't necessarily the right endpoint to use.
            raise TransportError(str(e))
        except RedirectError as e:
            r = DummyResponse(url=protocol.service_endpoint, headers={"location": e.url}, status_code=302)
        return r

    def _attempt_response(self, url):
        """Return an (is_valid_response, response) tuple.

        :param url:
        :return:
        """
        self._urls_visited.append(url.lower())
        log.debug("Attempting to get a valid response from %s", url)
        try:
            auth_type, r = self._get_unauthenticated_response(url=url)
            ad_protocol = AutodiscoverProtocol(
                config=Configuration(
                    service_endpoint=url,
                    credentials=self.credentials,
                    auth_type=auth_type,
                    retry_policy=self.INITIAL_RETRY_POLICY,
                )
            )
            if auth_type != NOAUTH:
                r = self._get_authenticated_response(protocol=ad_protocol)
        except TransportError as e:
            log.debug("Failed to get a response: %s", e)
            return False, None
        if r.status_code in (301, 302) and "location" in r.headers:
            redirect_url = get_redirect_url(r)
            if self._redirect_url_is_valid(url=redirect_url):
                # The protocol does not specify this explicitly, but by looking at how testconnectivity.microsoft.com
                # works, it seems that we should follow this URL now and try to get a valid response.
                return self._attempt_response(url=redirect_url)
        if r.status_code == 200:
            try:
                ad = Autodiscover.from_bytes(bytes_content=r.content)
            except ParseError as e:
                log.debug("Invalid response: %s", e)
            else:
                # We got a valid response. Unless this is a URL redirect response, we cache the result
                if ad.response is None or not ad.response.redirect_url:
                    cache_key = self._cache_key
                    log.debug("Adding cache entry for key %s: %s", cache_key, ad_protocol.service_endpoint)
                    autodiscover_cache[cache_key] = ad_protocol
                return True, ad
        return False, None
