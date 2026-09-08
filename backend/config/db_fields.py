from django.db import models


class MySQLEnumField(models.CharField):
    """DB설계서.md의 ENUM(...) 컬럼과 실제 DDL이 1:1로 일치하도록 하는 CharField.

    Django의 기본 CharField(choices=...)는 VARCHAR 컬럼을 생성하지만,
    DB설계서는 명시적으로 MySQL ENUM 타입 컬럼을 지정하므로 db_type을 오버라이드한다.
    """

    def db_type(self, connection):
        values = ", ".join(f"'{choice}'" for choice, _ in self.choices)
        return f"ENUM({values})"


class UnsignedIntField(models.IntegerField):
    """MySQL INT UNSIGNED 컬럼. PositiveIntegerField는 Django가 CHECK(>=0)을 자동으로
    추가로 붙여 DB설계서가 명시한 단일 CHECK(quantity >= 1)와 어긋나므로 직접 정의한다."""

    def db_type(self, connection):
        return "integer unsigned"


class UnsignedAutoField(models.AutoField):
    """DB설계서의 'INT UNSIGNED ... AUTO_INCREMENT' PK와 맞추기 위한 필드."""

    def db_type(self, connection):
        return "integer unsigned AUTO_INCREMENT"


class UnsignedBigAutoField(models.BigAutoField):
    """DB설계서의 'BIGINT UNSIGNED ... AUTO_INCREMENT' PK와 맞추기 위한 필드."""

    def db_type(self, connection):
        return "bigint unsigned AUTO_INCREMENT"
