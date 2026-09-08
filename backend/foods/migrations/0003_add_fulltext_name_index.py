# DB설계서.md 3.2절: ft_foods_name (name) FULLTEXT KEY WITH PARSER ngram
# (한글 자모 분리 이슈 회피용 ngram 파서 권장) — Django ORM이 지원하지 않아 RunSQL로 추가.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('foods', '0002_alter_food_quantity_alter_food_status_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE foods ADD FULLTEXT INDEX ft_foods_name (name) WITH PARSER ngram;",
            reverse_sql="ALTER TABLE foods DROP INDEX ft_foods_name;",
        ),
    ]
