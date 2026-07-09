import sys
from loguru import logger

def setup_logging() -> None:
    """Configure Loguru to log structured, colorized logs to stdout."""
    logger.remove()
    logger.add(
        sys.stdout,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO",
    )

# Initialize logging configuration
setup_logging()
