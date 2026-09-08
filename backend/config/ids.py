import uuid


def generate_id(prefix: str) -> str:
    """DB설계서.md 1.1절: VARCHAR(30) 공개 식별자(예: usr_01h..., food_01h...) 채번.

    ULID 대신 uuid4 hex를 사용한 축약형(하이픈 없음)으로, 접두사 포함 30자 이내를 보장한다.
    (정렬 가능한 ULID 채번 방식은 "권장" 사항이며 확정 스펙이 아니므로 구현 시 자유롭게 정함)
    """
    return f"{prefix}_{uuid.uuid4().hex[:24]}"
