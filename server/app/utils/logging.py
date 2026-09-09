import logging
import sys

FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
TIMESTAMP = "%Y-%m-%d %H:%M:%S"


def configure_logging(app):
    """Send application logs to stdout at a level the platform will actually show."""
    level = getattr(logging, app.config.get("LOG_LEVEL", "INFO"), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(FORMAT, TIMESTAMP))

    app.logger.handlers.clear()
    app.logger.addHandler(handler)
    app.logger.setLevel(level)
    app.logger.propagate = False

    logging.getLogger("werkzeug").setLevel(max(level, logging.WARNING))
    app.logger.info("Logging at %s", logging.getLevelName(level))
