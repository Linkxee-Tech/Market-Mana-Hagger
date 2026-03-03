import json
import re
from typing import Any


JSON_FENCE_PATTERN = re.compile(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", re.DOTALL)


def extract_json_payload(text: str) -> Any:
    if not text:
        raise ValueError("Empty Gemini response")

    fenced = JSON_FENCE_PATTERN.search(text)
    if fenced:
        return json.loads(fenced.group(1))

    start = min([idx for idx in [text.find("{"), text.find("[")] if idx != -1], default=-1)
    if start == -1:
        raise ValueError("No JSON object found in text")

    candidate = text[start:].strip()

    for end in range(len(candidate), 0, -1):
        chunk = candidate[:end]
        try:
            return json.loads(chunk)
        except json.JSONDecodeError:
            continue

    raise ValueError("Unable to parse JSON from Gemini response")
