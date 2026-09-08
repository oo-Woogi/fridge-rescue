"""시스템.png: Firebase(FCM/APNs) Push 발송 래퍼.

FIREBASE_CREDENTIALS_PATH가 설정/존재하지 않으면(로컬 개발 등) 실제 전송 없이
로그만 남기고 조용히 스킵한다 — 서비스 계정 키가 없는 환경에서도 나머지 기능이
정상 동작하도록 하기 위함.
"""

import logging
import os

from django.conf import settings

logger = logging.getLogger(__name__)

_app = None
_initialized = False


def _get_app():
    global _app, _initialized
    if _initialized:
        return _app

    _initialized = True
    path = settings.FIREBASE_CREDENTIALS_PATH
    if not path or not os.path.exists(path):
        logger.warning("FIREBASE_CREDENTIALS_PATH가 설정되지 않아 Push 발송을 건너뜁니다: %s", path)
        return None

    import firebase_admin
    from firebase_admin import credentials

    cred = credentials.Certificate(path)
    _app = firebase_admin.initialize_app(cred)
    return _app


def send_push(tokens, title, body, data=None):
    """tokens(list[str])에 FCM 멀티캐스트 푸시를 전송한다. 실패해도 예외를 올리지 않는다."""
    if not tokens:
        return

    app = _get_app()
    if app is None:
        logger.info("[push:skip] title=%s body=%s tokens=%d건", title, body, len(tokens))
        return

    from firebase_admin import messaging

    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body),
        data=data or {},
        tokens=tokens,
    )
    try:
        messaging.send_multicast(message, app=app)
    except Exception:
        logger.exception("FCM Push 발송 실패")
