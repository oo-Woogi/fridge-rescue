"""API명세서.md 1.3절 공통 에러 응답 포맷을 강제하는 예외 처리.

성공 응답: {"success": true, "data": {...}}
실패 응답: {"success": false, "error": {"code": "STRING_CODE", "message": "..."}}
"""

from rest_framework import exceptions as drf_exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class AppError(drf_exceptions.APIException):
    """도메인 에러 코드를 명시적으로 지정하는 커스텀 예외.

    사용 예: raise AppError("FOOD_NOT_FOUND", "존재하지 않는 식품입니다.", status.HTTP_404_NOT_FOUND)
    """

    def __init__(self, code, message, status_code=400):
        self.code = code
        self.status_code = status_code
        super().__init__(detail=message)


# 튜플 순서대로 isinstance 검사(구체적인 예외를 먼저 배치). rest_framework_simplejwt의
# AuthenticationFailed/InvalidToken 등은 DRF 예외의 서브클래스이므로 정확한 타입 매칭(dict)이
# 아닌 isinstance 매칭을 사용해야 한다.
_DEFAULT_CODE_BY_EXCEPTION = (
    (drf_exceptions.NotAuthenticated, "UNAUTHORIZED"),
    (drf_exceptions.AuthenticationFailed, "UNAUTHORIZED"),
    (drf_exceptions.PermissionDenied, "FORBIDDEN"),
    (drf_exceptions.NotFound, "NOT_FOUND"),
    (drf_exceptions.MethodNotAllowed, "METHOD_NOT_ALLOWED"),
    (drf_exceptions.ParseError, "VALIDATION_ERROR"),
    (drf_exceptions.NotAcceptable, "NOT_IMPLEMENTED"),
    (drf_exceptions.ValidationError, "VALIDATION_ERROR"),
)


def _default_code_for(exc):
    for exc_type, code in _DEFAULT_CODE_BY_EXCEPTION:
        if isinstance(exc, exc_type):
            return code
    return "VALIDATION_ERROR"


def _flatten_message(detail):
    if isinstance(detail, (list, tuple)) and detail:
        return _flatten_message(detail[0])
    if isinstance(detail, dict) and detail:
        # simplejwt류 예외는 {"detail": "...", "code": "..."} 형태이므로 그대로 풀어낸다.
        if "detail" in detail:
            return _flatten_message(detail["detail"])
        first_key = next(iter(detail))
        return f"{first_key}: {_flatten_message(detail[first_key])}"
    return str(detail)


def api_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "서버 내부 오류가 발생했습니다.",
                },
            },
            status=500,
        )

    if isinstance(exc, AppError):
        code = exc.code
        message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    else:
        code = _default_code_for(exc)
        message = _flatten_message(exc.detail) if hasattr(exc, "detail") else str(exc)

    response.data = {"success": False, "error": {"code": code, "message": message}}
    return response
