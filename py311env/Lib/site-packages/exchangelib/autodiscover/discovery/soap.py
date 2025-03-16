import logging

from ...configuration import Configuration
from ...errors import AutoDiscoverFailed, RedirectError, TransportError
from ...protocol import Protocol
from ...transport import get_unauthenticated_autodiscover_response
from ...util import CONNECTION_ERRORS
from ..cache import autodiscover_cache
from ..protocol import AutodiscoverProtocol
from .base import BaseAutodiscovery

log = logging.getLogger(__name__)


def discover(email, credentials=None, auth_type=None, retry_policy=None):
    ad_response, protocol = SoapAutodiscovery(email=email, credentials=credentials).discover()
    protocol.config.auth_typ = auth_type
    protocol.config.retry_policy = retry_policy
    return ad_response, protocol


class SoapAutodiscovery(BaseAutodiscovery):
    URL_PATH = "autodiscover/autodiscover.svc"

    def _build_response(self, ad_response):
        if not ad_response.autodiscover_smtp_address:
            # Autodiscover does not always return an email address. In that case, the requesting email should be used
            ad_response.autodiscover_smtp_address = self.email

        protocol = Protocol(
            config=Configuration(
                service_endpoint=ad_response.ews_url,
                credentials=self.credentials,
                version=ad_response.version,
                # TODO: Detect EWS service auth type somehow
            )
        )
        return ad_response, protocol

    def _quick(self, protocol):
        try:
            user_response = protocol.get_user_settings(user=self.email)
        except TransportError as e:
            raise AutoDiscoverFailed(f"Response error: {e}")
        return self._step_5(ad=user_response)

    def _get_unauthenticated_response(self, url, method="post"):
        """Get response from server using the given HTTP method

        :param url:
        :return:
        """
        # We are connecting to untrusted servers here, so take necessary precautions.
        self._ensure_valid_hostname(url)

        protocol = AutodiscoverProtocol(
            config=Configuration(
                service_endpoint=url,
                retry_policy=self.INITIAL_RETRY_POLICY,
            )
        )
        return None, get_unauthenticated_autodiscover_response(protocol=protocol, method=method)

    def _attempt_response(self, url):
        """Return an (is_valid_response, response) tuple.

        :param url:
        :return:
        """
        self._urls_visited.append(url.lower())
        log.debug("Attempting to get a valid response from %s", url)

        try:
            self._ensure_valid_hostname(url)
        except TransportError:
            return False, None

        protocol = AutodiscoverProtocol(
            config=Configuration(
                service_endpoint=url,
                credentials=self.credentials,
                retry_policy=self.INITIAL_RETRY_POLICY,
            )
        )
        try:
            user_response = protocol.get_user_settings(user=self.email)
        except RedirectError as e:
            if self._redirect_url_is_valid(url=e.url):
                # The protocol does not specify this explicitly, but by looking at how testconnectivity.microsoft.com
                # works, it seems that we should follow this URL now and try to get a valid response.
                return self._attempt_response(url=e.url)
            log.debug("Invalid redirect URL: %s", e.url)
            return False, None
        except TransportError as e:
            log.debug("Failed to get a response: %s", e)
            return False, None
        except CONNECTION_ERRORS as e:
            log.debug("Failed to get a response: %s", e)
            return False, None

        # We got a valid response. Unless this is a URL redirect response, we cache the result
        if not user_response.redirect_url:
            cache_key = self._cache_key
            log.debug("Adding cache entry for key %s: %s", cache_key, protocol.service_endpoint)
            autodiscover_cache[cache_key] = protocol
        return True, user_response
