# 냉장고 구조대 (Fridge Rescue) — 데이터베이스 설계서

- **문서 버전**: v1.0
- **작성일**: 2026-09-08
- **DBMS**: MySQL 8.0+
- **작성 기준**: UI 목업 14종 + 기능명세서 최종본(v3.0) + API 명세서(v1.0)

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [ERD (Entity Relationship Diagram)](#2-erd-entity-relationship-diagram)
3. [테이블 설계](#3-테이블-설계)
4. [파생 값 처리 (D-day / 뱃지)](#4-파생-값-처리-d-day--뱃지)
5. [인덱스 설계 요약](#5-인덱스-설계-요약)
6. [시드(초기) 데이터](#6-시드초기-데이터)
7. [데이터 삭제 정책과 스키마 매핑](#7-데이터-삭제-정책과-스키마-매핑)
8. [API ↔ 테이블 매핑표](#8-api--테이블-매핑표)
9. [부록 — 전체 DDL 스크립트](#9-부록--전체-ddl-스크립트)

---

## 1. 문서 개요

### 1.1 목적 및 범위

본 문서는 "냉장고 구조대(Fridge Rescue)" 기능명세서 최종본(v3.0)과 API 명세서(v1.0)를 기준으로, MySQL 8.0 이상에서 운용할 데이터베이스 스키마를 정의한다. 테이블 구조, 관계, 인덱스, 파생 값 처리 방식, 시드 데이터, 삭제 정책을 포함한다.

| 항목 | 내용 |
|---|---|
| DBMS | MySQL 8.0 이상 (CHECK 제약, 윈도우 함수, utf8mb4 기본 collation 등 8.0 기능 사용을 전제) |
| 스토리지 엔진 | InnoDB (트랜잭션, 외래 키 제약 지원 필요) |
| 문자셋 / Collation | utf8mb4 / utf8mb4_0900_ai_ci (한글, 이모지 포함 다국어 지원 및 대소문자 비구분 정렬) |
| 시간대 정책 | 모든 datetime 컬럼은 UTC로 저장. 표시/비교 시 애플리케이션 레이어에서 KST(Asia/Seoul, UTC+9)로 변환. 알림 발송 스케줄러만 KST 08:00 기준으로 동작 |
| 식별자(PK) 정책 | API 명세서의 공개 ID 형식(예: `usr_01h...`, `food_01h...`)과 1:1 대응하는 VARCHAR(30) 문자열을 기본 키로 사용 (ULID/UUID 등 정렬 가능한 문자열 ID 채번 권장) |

### 1.2 설계 원칙

- 기능명세서·API 명세서에서 정의한 필드/enum 값과 스키마를 1:1로 맞추어, 문서 간 불일치가 없도록 한다.
- D-day, 뱃지("유통기한경과" 등)처럼 "오늘 날짜" 기준으로 매번 달라지는 값은 컬럼으로 저장하지 않고 조회 시점에 계산한다([4장](#4-파생-값-처리-d-day--뱃지) 참조).
- 통계·최근 요약에 필요한 이력은 food 원본 레코드와 분리된 별도 로그 테이블에 스냅샷으로 남겨, "전체 데이터 삭제" 이후에도 과거 통계가 깨지지 않도록 한다([7장](#7-데이터-삭제-정책과-스키마-매핑) 참조).
- 카테고리/보관위치/상태처럼 값의 종류가 고정되고 적은 필드는 ENUM을 사용해 저장 공간과 검증 비용을 줄인다(현재 카테고리 직접 추가 기능 없음, FAQ 9번).
- 비밀번호는 원문을 저장하지 않고 해시(bcrypt/argon2 등)만 저장한다.

---

## 2. ERD (Entity Relationship Diagram)

아래 다이어그램은 7개 테이블 간의 관계를 나타낸다. 굵은 선은 필수 관계(1:N, 1:1), 점선은 참조는 하되 원본 삭제 시에도 유지되는 스냅샷 성격의 관계를 의미한다.

![ERD](./assets/erd.png)

Mermaid 형식(이미지가 보이지 않는 뷰어용 대체 표현):

```mermaid
erDiagram
    users ||--o{ foods : "1:N"
    users ||--o{ food_activity_logs : "1:N"
    users ||--|| notification_settings : "1:1"
    users ||--o{ refresh_tokens : "1:N"
    foods |o--o{ food_activity_logs : "0:N (스냅샷, FK nullable)"

    users {
        varchar(30) user_id PK
        varchar(255) email UK
        varchar(50) nickname
        varchar(255) password_hash
        datetime created_at
        datetime updated_at
    }
    foods {
        varchar(30) food_id PK
        varchar(30) user_id FK
        varchar(100) name
        enum category
        int quantity
        date purchase_date
        date expiry_date
        enum storage_location
        varchar(200) memo
        enum status
        datetime created_at
        datetime updated_at
        datetime resolved_at
    }
    food_activity_logs {
        bigint log_id PK
        varchar(30) user_id FK
        varchar(30) food_id FK
        varchar(100) food_name
        enum category
        enum action
        datetime acted_at
    }
    notification_settings {
        varchar(30) user_id PK_FK
        boolean d1_enabled
        boolean d3_enabled
        time notify_time
        varchar(50) timezone
    }
    refresh_tokens {
        bigint token_id PK
        varchar(30) user_id FK
        varchar(255) token_hash
        datetime expires_at
        datetime revoked_at
    }
    storage_tips {
        int tip_id PK
        varchar(200) message
        boolean is_active
    }
    faqs {
        int faq_id PK
        varchar(255) question
        text answer
        int sort_order
    }
```

### 관계 요약

| 관계 | 설명 |
|---|---|
| users 1 : N foods | 한 사용자가 여러 식품을 등록. 사용자 삭제 시 CASCADE |
| users 1 : N food_activity_logs | 한 사용자의 구조/폐기 이력 다건. 사용자 삭제 시 CASCADE |
| users 1 : 1 notification_settings | 사용자당 알림 설정 1건, user_id를 그대로 PK로 사용 |
| users 1 : N refresh_tokens | 로그인 세션(리프레시 토큰) 다건 발급 가능(다중 기기 로그인 대비) |
| foods 0 : N food_activity_logs | 식품 1건에 대해 "구조" 또는 "폐기" 이력이 남을 수 있음. food_id는 NULL 허용(원본 식품이 전체 삭제되어도 로그는 스냅샷으로 유지) |
| storage_tips, faqs | 사용자와 무관한 전역 참조 테이블(반정적 콘텐츠) |

---

## 3. 테이블 설계

### 3.1 users (사용자)

기능명세서 3.1절 User 엔티티에 대응. 회원가입/로그인/계정 설정 API(2~3장)에서 사용한다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| user_id | VARCHAR(30) | N | - | PK. 애플리케이션에서 발급하는 공개 식별자(예: usr_01HXYZ...) |
| email | VARCHAR(255) | N | - | 로그인 아이디. UNIQUE |
| nickname | VARCHAR(50) | N | - | 닉네임 |
| password_hash | VARCHAR(255) | N | - | 비밀번호 해시값(bcrypt 등). 평문 저장 금지 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 가입 일시(UTC) |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 최종 수정 일시(UTC), ON UPDATE 자동 갱신 |

**인덱스 / 제약**
- PRIMARY KEY (user_id)
- UNIQUE KEY uk_users_email (email)

**DDL**

```sql
CREATE TABLE users (
  user_id       VARCHAR(30)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  nickname      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                             ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

### 3.2 foods (식품)

기능명세서 3.2절 Food 엔티티, API 명세서 4장 식품 API에 대응하는 핵심 테이블이다. 현재 보관 중인 식품과 이미 구조/폐기 처리된 식품을 함께 관리하며(status 컬럼), 개별/전체 삭제 시 실제로 행이 제거된다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| food_id | VARCHAR(30) | N | - | PK (예: food_01HXYZ...) |
| user_id | VARCHAR(30) | N | - | FK → users.user_id |
| name | VARCHAR(100) | N | - | 음식명 |
| category | ENUM('유제품','채소','과일','육류','기타') | N | - | 카테고리(고정 5종) |
| quantity | INT UNSIGNED | N | 1 | 수량. CHECK (quantity >= 1) |
| purchase_date | DATE | N | - | 구매일. 애플리케이션에서 등록 당일을 기본값으로 채워 전달 |
| expiry_date | DATE | N | - | 유통기한 |
| storage_location | ENUM('냉장','냉동','실온') | N | '냉장' | 보관 위치 |
| memo | VARCHAR(200) | Y | NULL | 메모 |
| status | ENUM('보관중','구조','폐기') | N | '보관중' | 처리 상태 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 등록 일시(UTC) |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 최종 수정 일시(UTC) |
| resolved_at | DATETIME(3) | Y | NULL | 구조/폐기 처리 일시(UTC), 보관중이면 NULL |

**인덱스 / 제약**
- PRIMARY KEY (food_id)
- KEY idx_foods_user_status_expiry (user_id, status, expiry_date) — 목록/홈/알림 화면의 "보관중 + 유통기한 임박순" 조회 최적화
- FULLTEXT KEY ft_foods_name (name) WITH PARSER ngram — 음식명 부분일치 검색(한글 자모 분리 이슈 회피용 ngram 파서 권장)
- FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE — 사용자 탈퇴 시 식품도 함께 삭제
- CHECK (quantity >= 1)

**DDL**

```sql
CREATE TABLE foods (
  food_id           VARCHAR(30)  NOT NULL,
  user_id           VARCHAR(30)  NOT NULL,
  name              VARCHAR(100) NOT NULL,
  category          ENUM('유제품','채소','과일','육류','기타') NOT NULL,
  quantity          INT UNSIGNED NOT NULL DEFAULT 1,
  purchase_date     DATE NOT NULL,
  expiry_date       DATE NOT NULL,
  storage_location  ENUM('냉장','냉동','실온') NOT NULL DEFAULT '냉장',
  memo              VARCHAR(200) NULL,
  status            ENUM('보관중','구조','폐기') NOT NULL DEFAULT '보관중',
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  resolved_at       DATETIME(3) NULL,
  PRIMARY KEY (food_id),
  KEY idx_foods_user_status_expiry (user_id, status, expiry_date),
  FULLTEXT KEY ft_foods_name (name) WITH PARSER ngram,
  CONSTRAINT fk_foods_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_foods_quantity CHECK (quantity >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

> d_day, badge(예: "D-1", "유통기한경과")는 저장하지 않는다. 4장 참조.

---

### 3.3 food_activity_logs (식품 처리 이력)

통계(API 6장), 알림 화면 대신 홈/통계의 "최근 요약"에 필요한 이력을 남기는 append-only 로그 테이블이다. foods.status 변경(`PATCH /foods/{id}/status`) 시점에 스냅샷을 함께 INSERT한다. foods 행이 이후 개별/전체 삭제되어도 이 로그는 유지되어 과거 통계 집계가 영향을 받지 않는다([7장](#7-데이터-삭제-정책과-스키마-매핑) 참조).

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| log_id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK |
| user_id | VARCHAR(30) | N | - | FK → users.user_id |
| food_id | VARCHAR(30) | Y | NULL | FK → foods.food_id, ON DELETE SET NULL (원본이 삭제되어도 로그는 유지) |
| food_name | VARCHAR(100) | N | - | 처리 시점의 음식명 스냅샷 |
| category | ENUM('유제품','채소','과일','육류','기타') | N | - | 처리 시점의 카테고리 스냅샷 |
| action | ENUM('구조','폐기') | N | - | 처리 결과 |
| acted_at | DATETIME(3) | N | - | 처리(구조/폐기) 일시(UTC) = foods.resolved_at과 동일 값 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 로그 적재 일시 |

**인덱스 / 제약**
- PRIMARY KEY (log_id)
- KEY idx_logs_user_acted (user_id, acted_at) — 기간별 통계 집계 및 "최근 요약" 최신순 조회
- KEY idx_logs_user_action_acted (user_id, action, acted_at) — 구조/폐기 건수 및 카테고리별 집계
- FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
- FOREIGN KEY (food_id) REFERENCES foods(food_id) ON DELETE SET NULL

**DDL**

```sql
CREATE TABLE food_activity_logs (
  log_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     VARCHAR(30) NOT NULL,
  food_id     VARCHAR(30) NULL,
  food_name   VARCHAR(100) NOT NULL,
  category    ENUM('유제품','채소','과일','육류','기타') NOT NULL,
  action      ENUM('구조','폐기') NOT NULL,
  acted_at    DATETIME(3) NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (log_id),
  KEY idx_logs_user_acted (user_id, acted_at),
  KEY idx_logs_user_action_acted (user_id, action, acted_at),
  CONSTRAINT fk_logs_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_logs_food
    FOREIGN KEY (food_id) REFERENCES foods(food_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

### 3.4 notification_settings (알림 설정)

기능명세서 3.6절 NotificationSetting 엔티티, API 명세서 5.2~5.3절에 대응. 사용자당 정확히 1행만 존재하며, user_id를 그대로 PK로 사용해 1:1 관계를 강제한다. 회원가입 시 기본값으로 1행을 함께 생성한다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| user_id | VARCHAR(30) | N | - | PK, FK → users.user_id |
| d1_enabled | TINYINT(1) | N | 1 | D-1 알림 수신 여부 |
| d3_enabled | TINYINT(1) | N | 1 | D-3 알림 수신 여부 |
| notify_time | TIME | N | '08:00:00' | 발송 시각. 고정값이며 API로 수정 불가(애플리케이션 레벨에서 강제) |
| timezone | VARCHAR(50) | N | 'Asia/Seoul' | 발송 기준 시간대. 고정값 |
| updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 최종 수정 일시 |

**DDL**

```sql
CREATE TABLE notification_settings (
  user_id      VARCHAR(30) NOT NULL,
  d1_enabled   TINYINT(1)  NOT NULL DEFAULT 1,
  d3_enabled   TINYINT(1)  NOT NULL DEFAULT 1,
  notify_time  TIME        NOT NULL DEFAULT '08:00:00',
  timezone     VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
  updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                           ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

### 3.5 refresh_tokens (인증 토큰)

API 명세서 2.3절 로그아웃(리프레시 토큰 폐기) 및 "로그인 상태 유지" 옵션을 지원하기 위한 테이블이다. 원문 토큰이 아닌 해시값만 저장한다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| token_id | BIGINT UNSIGNED | N | AUTO_INCREMENT | PK |
| user_id | VARCHAR(30) | N | - | FK → users.user_id |
| token_hash | VARCHAR(255) | N | - | 리프레시 토큰 해시값(SHA-256 등). UNIQUE |
| expires_at | DATETIME(3) | N | - | 만료 일시. remember_me=true면 장기간으로 발급 |
| revoked_at | DATETIME(3) | Y | NULL | 로그아웃 등으로 폐기된 시각 |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 발급 일시 |

**DDL**

```sql
CREATE TABLE refresh_tokens (
  token_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     VARCHAR(30)  NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  DATETIME(3)  NOT NULL,
  revoked_at  DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_id),
  UNIQUE KEY uk_refresh_token_hash (token_hash),
  KEY idx_refresh_user (user_id),
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

### 3.6 storage_tips (보관 꿀팁)

기능명세서 3.5절, API 명세서 7.1절에 대응. 사용자와 무관한 전역 참조 테이블로, 음식 상세조회 화면 진입 시 `ORDER BY RAND() LIMIT 1`(또는 애플리케이션 레벨 랜덤 선택)로 1건을 반환한다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| tip_id | INT UNSIGNED | N | AUTO_INCREMENT | PK |
| message | VARCHAR(200) | N | - | 꿀팁 문구 |
| is_active | TINYINT(1) | N | 1 | 노출 여부(운영 중 특정 문구 비활성화 가능) |
| created_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 등록 일시 |

**DDL**

```sql
CREATE TABLE storage_tips (
  tip_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  message     VARCHAR(200) NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (tip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

> 중복 방지(직전 노출 문구 재노출 금지) 정책이 확정되면, 클라이언트가 마지막으로 받은 tip_id를 요청 파라미터로 넘겨 `WHERE tip_id != :last_id` 조건을 추가하는 방식으로 확장한다(기능명세서 4.2절 열린 이슈).

---

### 3.7 faqs (문의/FAQ)

기능명세서 2.13절, API 명세서 8.1절에 대응. answer가 아직 작성되지 않은 문항은 NULL로 저장한다.

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| faq_id | INT UNSIGNED | N | AUTO_INCREMENT | PK |
| question | VARCHAR(255) | N | - | 질문 |
| answer | TEXT | Y | NULL | 답변. 미작성 시 NULL |
| sort_order | INT UNSIGNED | N | 0 | 노출 순서 |
| created_at / updated_at | DATETIME(3) | N | CURRENT_TIMESTAMP(3) | 등록/수정 일시 |

**DDL**

```sql
CREATE TABLE faqs (
  faq_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  question    VARCHAR(255) NOT NULL,
  answer      TEXT NULL,
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                          ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (faq_id),
  KEY idx_faqs_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## 4. 파생 값 처리 (D-day / 뱃지)

API 명세서 4.1~4.3절의 `d_day`, `badge`는 "오늘 날짜"에 따라 매 조회 시 값이 달라지므로 foods 테이블에 컬럼으로 저장하지 않는다. MySQL 8.0의 생성 컬럼(Generated Column)은 `CURDATE()`/`NOW()`처럼 비결정적(non-deterministic) 함수를 허용하지 않으므로, 아래와 같이 조회용 VIEW 또는 애플리케이션 쿼리에서 직접 계산한다.

### 4.1 조회용 VIEW 예시

```sql
CREATE VIEW v_foods_with_status AS
SELECT
  f.food_id,
  f.user_id,
  f.name,
  f.category,
  f.quantity,
  f.purchase_date,
  f.expiry_date,
  f.storage_location,
  f.memo,
  f.status,
  DATEDIFF(f.expiry_date, CURDATE()) AS d_day,
  CASE
    WHEN DATEDIFF(f.expiry_date, CURDATE()) < 0 THEN '유통기한경과'
    ELSE CONCAT('D-', DATEDIFF(f.expiry_date, CURDATE()))
  END AS badge,
  f.created_at,
  f.updated_at,
  f.resolved_at
FROM foods f;
```

> 애플리케이션(백엔드)에서 동일한 로직을 ORM/쿼리 레벨로 구현해도 무방하다. VIEW는 임시 점검·직접 쿼리 시 편의를 위한 보조 수단이다.

### 4.2 뱃지 산정 기준 (기능명세서 3.3절)

| 조건 | 뱃지 |
|---|---|
| d_day ≤ 1 (즉 D-1, D-0) | D-0 / D-1 · 위험해요(프론트에서 문구 부가) |
| 2 ≤ d_day ≤ 3 | D-2 / D-3 |
| d_day ≥ 4 | D-N |
| d_day < 0 | 유통기한경과 (고정 문구, status는 자동 변경되지 않음) |

---

## 5. 인덱스 설계 요약

주요 조회 패턴(API 명세서 4.2절 목록 조회, 5.1절 알림, 6.1절 통계)을 기준으로 설계한 인덱스이다.

| 테이블 | 인덱스 | 용도 |
|---|---|---|
| foods | idx_foods_user_status_expiry (user_id, status, expiry_date) | GET /foods 기본 조회(보관중 + 유통기한 임박순), 홈 화면 임박 카드, 알림 화면(오늘 만료/3일 이내 임박) 조회 |
| foods | ft_foods_name (name) FULLTEXT | GET /foods?q= 음식명 검색 |
| food_activity_logs | idx_logs_user_acted (user_id, acted_at) | GET /stats 기간별 집계, 최근 요약 최신순 정렬 |
| food_activity_logs | idx_logs_user_action_acted (user_id, action, acted_at) | 구조 수/폐기 수 개별 집계, 카테고리별 구조 현황 |
| refresh_tokens | uk_refresh_token_hash (token_hash) | 토큰 검증 시 단건 조회 |
| users | uk_users_email (email) | 로그인 시 이메일로 단건 조회, 회원가입 시 중복 검사 |

> 식품 등록/보유 개수가 사용자당 많지 않은 서비스 특성상(개인 냉장고 재고 수준), 별도의 파티셔닝은 필요하지 않다. 사용자 수가 크게 증가할 경우 food_activity_logs에 한해 월별 파티셔닝(acted_at 기준)을 고려할 수 있다.

---

## 6. 시드(초기) 데이터

storage_tips, faqs 테이블은 서비스 오픈 전 아래 내용으로 초기 적재한다.

### 6.1 storage_tips 시드 (기능명세서 3.5절 10개 문구)

```sql
INSERT INTO storage_tips (message) VALUES
('냉장실 안쪽이 문쪽보다 온도가 낮으니 상하기 쉬운 음식은 안쪽 깊숙이 넣으세요.'),
('문쪽 선반은 온도 변화가 크니 유통기한이 긴 소스·음료만 두세요.'),
('익힌 음식은 위 칸, 생고기·생선은 맨 아래 칸에 보관해 교차오염을 막으세요.'),
('뜨거운 음식은 반드시 식힌 뒤 넣어야 내부 온도 상승과 결로를 막을 수 있어요.'),
('채소는 신문지나 키친타월로 감싸 습기를 조절하면 더 오래갑니다.'),
('냉장고는 60~70%만 채워야 찬 공기가 잘 순환해 골고루 시원해져요.'),
('남은 음식은 밀폐용기에 담고 날짜를 적어두면 낭비를 줄일 수 있어요.'),
('냉장실 적정 온도는 3~4℃, 냉동실은 -18℃ 이하로 유지하세요.'),
('양파·감자·마늘은 냉장 대신 서늘하고 통풍 잘 되는 곳에 상온 보관하세요.'),
('바나나·토마토 등 냉장에 약한 과일은 실온에 두어야 맛과 식감이 유지됩니다.');
```

### 6.2 faqs 시드 (기능명세서 2.13절 12문항)

```sql
INSERT INTO faqs (question, answer, sort_order) VALUES
('등록한 음식의 유통기한 알림은 언제 오나요?',
 '매일 오전 8시(KST)에 조건을 만족하는 식품에 대해 앱 푸시가 발송됩니다.', 1),
('같은 음식을 여러 개 보관할 때 각각 따로 등록해야 하나요?',
 '수량 항목에 개수를 입력하면 하나의 등록으로 여러 개를 관리할 수 있습니다.', 2),
('냉장/냉동/실온을 구분해서 보관 위치를 관리할 수 있나요?',
 '등록 시 보관 위치를 선택하면 위치별로 필터링해 조회할 수 있습니다.', 3),
('유통기한이 지난 음식은 자동으로 삭제되나요?',
 '자동 삭제되지 않고 유통기한경과 상태로 표시되며, 삭제는 직접 하셔야 합니다.', 4),
('바코드를 찍으면 음식 정보가 자동으로 입력되나요?', NULL, 5),
('로그인 없이도 앱을 사용할 수 있나요?', NULL, 6),
('다른 기기에서도 같은 냉장고 데이터를 볼 수 있나요?', NULL, 7),
('AI 레시피 추천은 어떤 재료를 기준으로 추천되나요?', NULL, 8),
('음식 카테고리를 직접 추가할 수 있나요?', NULL, 9),
('알림을 받는 기준일(D-1, D-3)을 바꿀 수 있나요?', NULL, 10),
('전체 데이터를 삭제하면 복구할 수 있나요?', NULL, 11),
('냉장고 구조대는 무료로 이용할 수 있나요?', NULL, 12);
```

### 6.3 신규 가입 시 기본 행 생성

회원가입 API(`POST /auth/signup`) 처리 트랜잭션 내에서, users INSERT와 함께 notification_settings 기본값 1행을 함께 생성한다.

```sql
INSERT INTO notification_settings (user_id) VALUES (:new_user_id);
-- d1_enabled, d3_enabled, notify_time, timezone은 컬럼 기본값(1, 1, '08:00:00',
-- 'Asia/Seoul')이 자동 적용됨
```

---

## 7. 데이터 삭제 정책과 스키마 매핑

기능명세서 4.4절 데이터 삭제 정책("등록된 음식 데이터 전체 삭제, 계정 정보·통계 이력은 유지")을 스키마 레벨에서 아래와 같이 구현한다.

### 7.1 설정 · 전체 데이터 삭제 (DELETE /foods)

- foods 테이블에서 해당 user_id에 속한 행을 전부 DELETE 한다.
- food_activity_logs는 foods.food_id를 ON DELETE SET NULL로 참조하므로, 원본 삭제 후에도 로그 행 자체는 삭제되지 않고 food_id만 NULL로 남는다. food_name/category는 스냅샷 컬럼이라 그대로 유지되어 과거 통계 조회에 영향이 없다.
- users, notification_settings, refresh_tokens는 이 작업의 영향을 받지 않는다.

```sql
START TRANSACTION;
DELETE FROM foods WHERE user_id = :user_id;
COMMIT;
-- food_activity_logs.food_id는 FK ON DELETE SET NULL 규칙에 따라 자동으로 NULL 처리됨
```

### 7.2 회원 탈퇴(참고, 현재 화면에는 없음)

현재 목업/기능명세서에는 "회원 탈퇴" 화면이 없으나, 향후 추가될 경우를 대비해 users 삭제 시 CASCADE 정책을 다음과 같이 정의해 두었다.

| 자식 테이블 | 삭제 정책 | 설명 |
|---|---|---|
| foods | ON DELETE CASCADE | 탈퇴 시 보유 식품 데이터 전체 삭제 |
| food_activity_logs | ON DELETE CASCADE | 탈퇴 시 이력도 함께 삭제(개인정보 보호 관점) |
| notification_settings | ON DELETE CASCADE | 탈퇴 시 설정 삭제 |
| refresh_tokens | ON DELETE CASCADE | 탈퇴 시 모든 세션 무효화 |

> 회원 탈퇴 기능이 정식으로 기획되면, 법적 보관 의무(전자상거래법 등)가 있는 항목이 있는지 별도 검토가 필요하다.

---

## 8. API ↔ 테이블 매핑표

| API 엔드포인트 | 주요 테이블 |
|---|---|
| POST /auth/signup | INSERT users, INSERT notification_settings |
| POST /auth/login | SELECT users (email), INSERT refresh_tokens |
| POST /auth/logout | UPDATE refresh_tokens (revoked_at) |
| GET /users/me | SELECT users |
| PATCH /users/me | UPDATE users (nickname, password_hash) |
| POST /foods | INSERT foods |
| GET /foods | SELECT foods (+ v_foods_with_status) |
| GET /foods/{id} | SELECT foods (+ v_foods_with_status) |
| PATCH /foods/{id} | UPDATE foods |
| PATCH /foods/{id}/status | UPDATE foods (status, resolved_at), INSERT food_activity_logs |
| DELETE /foods/{id} | DELETE foods (단건) |
| DELETE /foods | DELETE foods (user_id 전체) |
| POST /foods/sample | INSERT foods (다건) |
| GET /notifications | SELECT foods (+ v_foods_with_status, status/기간 필터) |
| GET /notification-settings | SELECT notification_settings |
| PATCH /notification-settings | UPDATE notification_settings |
| GET /stats | SELECT foods (임박 수), SELECT food_activity_logs (집계) |
| GET /storage-tips/random | SELECT storage_tips (RAND() 1건) |
| GET /faqs | SELECT faqs |
| POST /recipes/recommend | 해당 없음 (미구현 placeholder) |

---

## 9. 부록 — 전체 DDL 스크립트

아래 순서대로 실행하면 전체 스키마가 생성된다(외래 키 참조 순서를 고려한 생성 순서).

```sql
-- 1) users
CREATE TABLE users (
  user_id       VARCHAR(30)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  nickname      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                             ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2) foods
CREATE TABLE foods (
  food_id           VARCHAR(30)  NOT NULL,
  user_id           VARCHAR(30)  NOT NULL,
  name              VARCHAR(100) NOT NULL,
  category          ENUM('유제품','채소','과일','육류','기타') NOT NULL,
  quantity          INT UNSIGNED NOT NULL DEFAULT 1,
  purchase_date     DATE NOT NULL,
  expiry_date       DATE NOT NULL,
  storage_location  ENUM('냉장','냉동','실온') NOT NULL DEFAULT '냉장',
  memo              VARCHAR(200) NULL,
  status            ENUM('보관중','구조','폐기') NOT NULL DEFAULT '보관중',
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  resolved_at       DATETIME(3) NULL,
  PRIMARY KEY (food_id),
  KEY idx_foods_user_status_expiry (user_id, status, expiry_date),
  FULLTEXT KEY ft_foods_name (name) WITH PARSER ngram,
  CONSTRAINT fk_foods_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT chk_foods_quantity CHECK (quantity >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3) food_activity_logs
CREATE TABLE food_activity_logs (
  log_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     VARCHAR(30) NOT NULL,
  food_id     VARCHAR(30) NULL,
  food_name   VARCHAR(100) NOT NULL,
  category    ENUM('유제품','채소','과일','육류','기타') NOT NULL,
  action      ENUM('구조','폐기') NOT NULL,
  acted_at    DATETIME(3) NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (log_id),
  KEY idx_logs_user_acted (user_id, acted_at),
  KEY idx_logs_user_action_acted (user_id, action, acted_at),
  CONSTRAINT fk_logs_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_logs_food
    FOREIGN KEY (food_id) REFERENCES foods(food_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4) notification_settings
CREATE TABLE notification_settings (
  user_id      VARCHAR(30) NOT NULL,
  d1_enabled   TINYINT(1)  NOT NULL DEFAULT 1,
  d3_enabled   TINYINT(1)  NOT NULL DEFAULT 1,
  notify_time  TIME        NOT NULL DEFAULT '08:00:00',
  timezone     VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
  updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                           ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5) refresh_tokens
CREATE TABLE refresh_tokens (
  token_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     VARCHAR(30)  NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  DATETIME(3)  NOT NULL,
  revoked_at  DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_id),
  UNIQUE KEY uk_refresh_token_hash (token_hash),
  KEY idx_refresh_user (user_id),
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6) storage_tips
CREATE TABLE storage_tips (
  tip_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  message     VARCHAR(200) NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (tip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7) faqs
CREATE TABLE faqs (
  faq_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  question    VARCHAR(255) NOT NULL,
  answer      TEXT NULL,
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                          ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (faq_id),
  KEY idx_faqs_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8) 조회용 VIEW
CREATE VIEW v_foods_with_status AS
SELECT
  f.food_id, f.user_id, f.name, f.category, f.quantity,
  f.purchase_date, f.expiry_date, f.storage_location, f.memo, f.status,
  DATEDIFF(f.expiry_date, CURDATE()) AS d_day,
  CASE WHEN DATEDIFF(f.expiry_date, CURDATE()) < 0 THEN '유통기한경과'
       ELSE CONCAT('D-', DATEDIFF(f.expiry_date, CURDATE())) END AS badge,
  f.created_at, f.updated_at, f.resolved_at
FROM foods f;
```
