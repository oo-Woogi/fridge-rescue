import hashlib

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class SessionTokenAuthentication(JWTAuthentication):
    """API명세서.md에는 access/refresh 이원화 없이 로그인 응답의 단일 token만 존재한다.

    발급된 토큰의 해시를 accounts.RefreshToken(DB설계서 3.5 refresh_tokens) 테이블에 저장해두고,
    매 요청마다 폐기(로그아웃) 여부를 함께 검사해 "로그아웃 시 토큰 폐기" 요구사항을 만족시킨다.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        from accounts.models import RefreshToken

        token_hash = hashlib.sha256(raw_token).hexdigest()
        if not RefreshToken.objects.filter(token_hash=token_hash, revoked_at__isnull=True).exists():
            raise AuthenticationFailed("로그아웃되었거나 유효하지 않은 토큰입니다.", code="token_not_valid")

        return user, validated_token
