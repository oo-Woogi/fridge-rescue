# DB설계서.md 6장 시드 데이터 (storage_tips 10개, faqs 12개) 그대로 적재.

from django.db import migrations

STORAGE_TIPS = [
    "냉장실 안쪽이 문쪽보다 온도가 낮으니 상하기 쉬운 음식은 안쪽 깊숙이 넣으세요.",
    "문쪽 선반은 온도 변화가 크니 유통기한이 긴 소스·음료만 두세요.",
    "익힌 음식은 위 칸, 생고기·생선은 맨 아래 칸에 보관해 교차오염을 막으세요.",
    "뜨거운 음식은 반드시 식힌 뒤 넣어야 내부 온도 상승과 결로를 막을 수 있어요.",
    "채소는 신문지나 키친타월로 감싸 습기를 조절하면 더 오래갑니다.",
    "냉장고는 60~70%만 채워야 찬 공기가 잘 순환해 골고루 시원해져요.",
    "남은 음식은 밀폐용기에 담고 날짜를 적어두면 낭비를 줄일 수 있어요.",
    "냉장실 적정 온도는 3~4℃, 냉동실은 -18℃ 이하로 유지하세요.",
    "양파·감자·마늘은 냉장 대신 서늘하고 통풍 잘 되는 곳에 상온 보관하세요.",
    "바나나·토마토 등 냉장에 약한 과일은 실온에 두어야 맛과 식감이 유지됩니다.",
]

FAQS = [
    ("등록한 음식의 유통기한 알림은 언제 오나요?", "매일 오전 8시(KST)에 조건을 만족하는 식품에 대해 앱 푸시가 발송됩니다.", 1),
    ("같은 음식을 여러 개 보관할 때 각각 따로 등록해야 하나요?", "수량 항목에 개수를 입력하면 하나의 등록으로 여러 개를 관리할 수 있습니다.", 2),
    ("냉장/냉동/실온을 구분해서 보관 위치를 관리할 수 있나요?", "등록 시 보관 위치를 선택하면 위치별로 필터링해 조회할 수 있습니다.", 3),
    ("유통기한이 지난 음식은 자동으로 삭제되나요?", "자동 삭제되지 않고 유통기한경과 상태로 표시되며, 삭제는 직접 하셔야 합니다.", 4),
    ("바코드를 찍으면 음식 정보가 자동으로 입력되나요?", None, 5),
    ("로그인 없이도 앱을 사용할 수 있나요?", None, 6),
    ("다른 기기에서도 같은 냉장고 데이터를 볼 수 있나요?", None, 7),
    ("AI 레시피 추천은 어떤 재료를 기준으로 추천되나요?", None, 8),
    ("음식 카테고리를 직접 추가할 수 있나요?", None, 9),
    ("알림을 받는 기준일(D-1, D-3)을 바꿀 수 있나요?", None, 10),
    ("전체 데이터를 삭제하면 복구할 수 있나요?", None, 11),
    ("냉장고 구조대는 무료로 이용할 수 있나요?", None, 12),
]


def seed(apps, schema_editor):
    StorageTip = apps.get_model("content", "StorageTip")
    FAQ = apps.get_model("content", "FAQ")
    for message in STORAGE_TIPS:
        StorageTip.objects.create(message=message)
    for question, answer, sort_order in FAQS:
        FAQ.objects.create(question=question, answer=answer, sort_order=sort_order)


def unseed(apps, schema_editor):
    apps.get_model("content", "StorageTip").objects.all().delete()
    apps.get_model("content", "FAQ").objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed, reverse_code=unseed),
    ]
