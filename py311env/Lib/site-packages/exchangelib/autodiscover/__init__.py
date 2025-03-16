from .cache import AutodiscoverCache, autodiscover_cache
from .discovery.pox import PoxAutodiscovery as Autodiscovery
from .discovery.pox import discover
from .protocol import AutodiscoverProtocol


def close_connections():
    with autodiscover_cache:
        autodiscover_cache.close()


def clear_cache():
    with autodiscover_cache:
        autodiscover_cache.clear()


__all__ = [
    "AutodiscoverCache",
    "AutodiscoverProtocol",
    "Autodiscovery",
    "discover",
    "autodiscover_cache",
    "close_connections",
    "clear_cache",
]
