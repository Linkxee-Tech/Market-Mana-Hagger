import logging
import json
from datetime import datetime

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "severity": record.levelname,
            "message": record.getMessage(),
            "time": datetime.utcnow().isoformat() + "Z",
            "component": record.name,
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logging():
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root.addHandler(handler)
    # Silence noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
