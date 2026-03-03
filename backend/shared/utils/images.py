from __future__ import annotations

import base64

MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}


def decode_data_url(data_url: str, max_bytes: int = MAX_IMAGE_BYTES) -> tuple[bytes, str]:
    if not data_url:
        raise ValueError("Screenshot payload is empty")

    mime_type = "image/png"
    payload = data_url

    if data_url.startswith("data:"):
        header, _, payload = data_url.partition(",")
        if ";base64" not in header:
            raise ValueError("Screenshot data URL must be base64-encoded")

        mime_type = header[5:].split(";")[0].lower() or "image/png"

    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Unsupported screenshot MIME type: {mime_type}")

    try:
        image_bytes = base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise ValueError("Invalid base64 screenshot payload") from exc

    if len(image_bytes) == 0:
        raise ValueError("Screenshot payload decoded to empty bytes")

    if len(image_bytes) > max_bytes:
        raise ValueError("Screenshot payload exceeds 5MB limit")

    return image_bytes, mime_type
