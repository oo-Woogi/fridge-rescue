# 냉장고 구조대 (Fridge Rescue) — API 명세서

- **문서 버전**: v1.0
- **작성일**: 2026-09-08
- **작성 기준**: UI 목업 14종 + 기능명세서 최종본(v3.0)

> 본 문서는 기능명세서 최종본의 화면별 동작과 데이터 모델을 기준으로 백엔드 개발에 필요한 REST API 스펙을 정의한다.

---

## 목차

1. [문서 개요](#1-문서-개요)
2. [인증 API](#2-인증-api)
3. [사용자(계정) API](#3-사용자계정-api)
4. [식품(Food) API](#4-식품food-api)
5. [알림 API](#5-알림-api)
6. [통계 API](#6-통계-api)
7. [보관 꿀팁 API](#7-보관-꿀팁-api)
8. [문의/FAQ API](#8-문의faq-api)
9. [레시피 추천 API (후순위)](#9-레시피-추천-api-후순위)
10. [데이터 모델 요약](#10-데이터-모델-요약)
11. [부록 — 화면별 API 호출 매핑표](#11-부록--화면별-api-호출-매핑표)

---

## 1. 문서 개요

### 1.1 목적 및 범위

본 문서는 "냉장고 구조대(Fridge Rescue)" 기능명세서 최종본(v3.0)과 UI 목업 14종을 근거로, 프론트엔드-백엔드 간 계약(contract)이 되는 REST API를 정의한다. 인증, 식품 CRUD 및 상태 처리, 알림, 통계, 보관 꿀팁, 문의(FAQ) 영역을 포함하며, AI 레시피 추천은 기능명세서 정책에 따라 미구현(placeholder) 상태로 정의한다.

> 본 문서의 엔드포인트 경로·필드명은 설계 제안이며, 실제 구현 시 팀 컨벤션에 맞게 조정될 수 있다. 단, 요청/응답에 포함되어야 하는 데이터 항목과 비즈니스 규칙은 기능명세서 최종본과 반드시 일치해야 한다.

### 1.2 공통 사항

| 항목 | 내용 |
|---|---|
| Base URL | `https://api.fridge-rescue.app/v1` (예시, 실제 도메인은 인프라 확정 후 결정) |
| 통신 방식 | HTTPS + JSON (`Content-Type: application/json; charset=utf-8`) |
| 인증 방식 | JWT 기반 Bearer 토큰. 로그인/회원가입 응답으로 발급, 이후 요청 헤더에 `Authorization: Bearer {token}` 포함 |
| 날짜/시간 형식 | 날짜는 `YYYY-MM-DD` (예: 2026-09-08), 일시는 ISO 8601 UTC (예: `2026-09-08T00:00:00Z`). 알림 발송 시각(오전 8시)은 한국시간(KST, UTC+9) 기준 |
| 문자 인코딩 | UTF-8 |
| 응답 공통 포맷(성공) | `{ "success": true, "data": { ... } }` |
| 응답 공통 포맷(실패) | `{ "success": false, "error": { "code": "STRING_CODE", "message": "사람이 읽을 수 있는 메시지" } }` |

**인증 헤더 예시**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 로그인 화면 "로그인 상태 유지" 체크 시 refresh token의 만료 기간을 길게 발급하는 것으로 처리한다(기능명세서 2.1절).

### 1.3 공통 에러 응답

**HTTP 상태 코드**

| 코드 | 의미 | 사용 예 |
|---|---|---|
| 200 | OK | 조회/수정 성공 |
| 201 | Created | 신규 리소스 생성 성공(회원가입, 식품 등록 등) |
| 204 | No Content | 삭제/로그아웃 등 반환 바디가 없는 성공 |
| 400 | Bad Request | 요청 형식 오류(필수 파라미터 누락 등) |
| 401 | Unauthorized | 인증 실패(토큰 없음/만료/불일치) |
| 403 | Forbidden | 본인 소유가 아닌 리소스 접근 시도 |
| 404 | Not Found | 존재하지 않는 리소스 조회 |
| 409 | Conflict | 이메일 중복, 이미 처리된 식품 재처리 시도 등 |
| 422 | Unprocessable Entity | 값은 존재하나 검증 규칙 위반(비밀번호 정책 미충족 등) |
| 501 | Not Implemented | AI 레시피 추천 등 아직 연동되지 않은 기능 호출 시 |
| 500 | Internal Server Error | 서버 내부 오류 |

**공통 에러 코드**

| 에러 코드 | 설명 |
|---|---|
| `VALIDATION_ERROR` | 요청 필드 누락 또는 형식 오류 |
| `UNAUTHORIZED` | 인증되지 않은 요청 |
| `FORBIDDEN` | 권한 없는 리소스 접근 |
| `INVALID_CREDENTIALS` | 이메일 또는 비밀번호 불일치(로그인 실패) |
| `EMAIL_ALREADY_EXISTS` | 이미 가입된 이메일로 회원가입 시도 |
| `CURRENT_PASSWORD_REQUIRED` | 비밀번호 변경 시 현재 비밀번호 미입력 |
| `CURRENT_PASSWORD_MISMATCH` | 현재 비밀번호 불일치 |
| `PASSWORD_POLICY_VIOLATION` | 영문+숫자 포함 8자 이상 규칙 미충족 |
| `PASSWORD_CONFIRM_MISMATCH` | 새 비밀번호와 확인값 불일치 |
| `FOOD_NOT_FOUND` | 존재하지 않거나 본인 소유가 아닌 식품 |
| `FOOD_ALREADY_RESOLVED` | 이미 "구조" 또는 "폐기" 처리된 식품에 대한 재처리 시도 |
| `NOT_IMPLEMENTED` | AI 레시피 추천 등 아직 제공되지 않는 기능 |
| `INTERNAL_SERVER_ERROR` | 서버 내부 오류 |

**에러 응답 예시**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}
```

### 1.4 화면 ↔ API 매핑 개요

상세 매핑표는 [11장 부록](#11-부록--화면별-api-호출-매핑표)에서 제공하며, 아래는 화면 단위 핵심 흐름 요약이다.

| 화면 | 주요 호출 API |
|---|---|
| 로그인 / 회원가입 | `POST /auth/login`, `POST /auth/signup` |
| 홈 | `GET /foods`(임박 조회), `GET /stats?period=week` |
| 음식 등록 / 수정 | `POST /foods`, `PATCH /foods/{id}` |
| 음식 상세조회 | `GET /foods/{id}`, `GET /storage-tips/random`, `PATCH /foods/{id}/status` |
| 목록 | `GET /foods`(검색·필터·정렬) |
| 통계 | `GET /stats?period=today\|week\|month` |
| 알림 | `GET /notifications`, `GET/PATCH /notification-settings` |
| 설정 · 계정 설정 | `GET /users/me`, `PATCH /users/me` |
| 설정 · 전체 데이터 삭제 | `DELETE /foods` |
| 설정 · 문의/FAQ | `GET /faqs` |

---

## 2. 인증 API

### 2.1 회원가입

| `POST` | `/auth/signup` | 신규 계정 생성 (SCR-SIGNUP) |
|---|---|---|

약관 동의 절차 없이 4개 필드(닉네임/이메일/비밀번호/비밀번호 확인) 검증만으로 가입이 완료된다(기능명세서 2.2절).

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `nickname` | string | Y | 1자 이상, 중복 불가 |
| `email` | string | Y | 이메일 형식, 중복 불가 |
| `password` | string | Y | 영문+숫자 포함 8자 이상 |
| `password_confirm` | string | Y | `password`와 일치해야 함 |

**요청 예시**

```http
POST /auth/signup
{
  "nickname": "구조대장냉장고",
  "email": "user@example.com",
  "password": "abcd1234",
  "password_confirm": "abcd1234"
}
```

**응답 예시 (201 Created)**

```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "usr_01h...",
      "nickname": "구조대장냉장고",
      "email": "user@example.com",
      "created_at": "2026-09-08T01:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**에러 케이스**

| 상태 코드 | 에러 코드 | 상황 |
|---|---|---|
| 422 | `VALIDATION_ERROR` | 필수 필드 누락, 닉네임/이메일 형식 오류 |
| 422 | `PASSWORD_POLICY_VIOLATION` | 비밀번호가 영문+숫자 포함 8자 이상 규칙 미충족 |
| 422 | `PASSWORD_CONFIRM_MISMATCH` | password와 password_confirm 불일치 |
| 409 | `EMAIL_ALREADY_EXISTS` | 이미 가입된 이메일 |

---

### 2.2 로그인

| `POST` | `/auth/login` | 이메일/비밀번호 인증 (SCR-LOGIN) |
|---|---|---|

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `email` | string | Y | 가입한 이메일 |
| `password` | string | Y | 비밀번호 |
| `remember_me` | boolean | N | true인 경우 장기 세션(토큰) 발급, 기본값 false |

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "usr_01h...",
      "nickname": "구조대장냉장고",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 1209600
  }
}
```

**에러 케이스**

| 상태 코드 | 에러 코드 | 상황 |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호 불일치 |
| 422 | `VALIDATION_ERROR` | 이메일 형식 오류 등 입력값 자체가 유효하지 않음 |

---

### 2.3 로그아웃

| `POST` | `/auth/logout` | 현재 세션 종료 |
|---|---|---|

인증 필요. 서버에서 refresh token을 폐기(또는 블랙리스트 등록)하고 204를 반환한다. 클라이언트는 응답 후 저장된 토큰을 삭제하고 로그인 화면으로 이동한다.

**응답**

```
204 No Content
```

---

## 3. 사용자(계정) API

### 3.1 내 정보 조회

| `GET` | `/users/me` | 현재 로그인한 사용자 정보 (SCR-SETTINGS) |
|---|---|---|

인증 필요. 설정 화면의 "닉네임 수정" 메뉴에 노출되는 현재 닉네임 값을 조회할 때 사용한다.

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "user_id": "usr_01h...",
    "nickname": "구조대장냉장고",
    "email": "user@example.com",
    "created_at": "2026-09-01T00:00:00Z",
    "updated_at": "2026-09-07T09:12:00Z"
  }
}
```

---

### 3.2 닉네임 · 비밀번호 변경

| `PATCH` | `/users/me` | 계정 설정 저장 (SCR-SETTINGS-PROFILE) |
|---|---|---|

닉네임 변경과 비밀번호 변경을 하나의 엔드포인트로 처리한다(기능명세서 2.11절). 비밀번호 관련 3개 필드가 모두 비어 있으면 비밀번호는 변경하지 않고 닉네임만 갱신한다(4.2절 열린 이슈 — 서버 정책 확정 후 최종 반영).

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `nickname` | string | N | 변경할 닉네임. 미포함 시 기존 값 유지 |
| `current_password` | string | 조건부 | 비밀번호 변경 시 필수. 본인 확인용 |
| `new_password` | string | 조건부 | 영문+숫자 포함 8자 이상. current_password와 함께 제공되어야 함 |
| `new_password_confirm` | string | 조건부 | new_password와 일치해야 함 |

**요청 예시 — 닉네임만 변경**

```http
PATCH /users/me
{
  "nickname": "새구조대장"
}
```

**요청 예시 — 비밀번호 변경 포함**

```http
PATCH /users/me
{
  "nickname": "새구조대장",
  "current_password": "abcd1234",
  "new_password": "newpass99",
  "new_password_confirm": "newpass99"
}
```

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "user_id": "usr_01h...",
    "nickname": "새구조대장",
    "email": "user@example.com",
    "updated_at": "2026-09-08T02:00:00Z"
  }
}
```

**에러 케이스**

| 상태 코드 | 에러 코드 | 상황 |
|---|---|---|
| 400 | `CURRENT_PASSWORD_REQUIRED` | new_password는 있는데 current_password가 없는 경우 |
| 401 | `CURRENT_PASSWORD_MISMATCH` | 현재 비밀번호가 일치하지 않음 |
| 422 | `PASSWORD_POLICY_VIOLATION` | 새 비밀번호가 정책 미충족 |
| 422 | `PASSWORD_CONFIRM_MISMATCH` | 새 비밀번호와 확인값 불일치 |

---

## 4. 식품(Food) API

### 4.1 식품 등록

| `POST` | `/foods` | 신규 식품 등록 (SCR-FOOD-ADD) |
|---|---|---|

단일 화면 등록으로, 등록 즉시 처리되며 별도 확인 단계가 없다(기능명세서 2.4절).

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `name` | string | Y | 음식명, 1자 이상 |
| `category` | enum | Y | 유제품 \| 채소 \| 과일 \| 육류 \| 기타 |
| `quantity` | integer | N | 기본값 1, 최소 1 |
| `purchase_date` | date | N | 기본값 오늘 |
| `expiry_date` | date | Y | 유통기한 |
| `storage_location` | enum | N | 냉장 \| 냉동 \| 실온, 기본값 냉장 |
| `memo` | string | N | 최대 100자 권장 |

**요청 예시**

```http
POST /foods
{
  "name": "상추",
  "category": "채소",
  "quantity": 1,
  "purchase_date": "2026-09-05",
  "expiry_date": "2026-09-08",
  "storage_location": "냉장",
  "memo": "샐러드용으로 구매했어요"
}
```

**응답 예시 (201 Created)**

```json
{
  "success": true,
  "data": {
    "food_id": "food_01h...",
    "name": "상추",
    "category": "채소",
    "quantity": 1,
    "purchase_date": "2026-09-05",
    "expiry_date": "2026-09-08",
    "storage_location": "냉장",
    "memo": "샐러드용으로 구매했어요",
    "status": "보관중",
    "d_day": -1,
    "badge": "유통기한경과",
    "created_at": "2026-09-08T01:00:00Z"
  }
}
```

> `d_day`, `badge`는 응답 시 서버가 3.3절 규칙에 따라 계산하여 내려주는 파생 값이며, 별도 저장 필드가 아니다.

---

### 4.2 식품 목록 조회

| `GET` | `/foods` | 검색 · 필터 · 정렬된 목록 (SCR-FOOD-LIST, 홈의 임박 카드 포함) |
|---|---|---|

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `q` | string | N | 음식명 부분일치 검색 |
| `category` | enum | N | 유제품 \| 채소 \| 과일 \| 육류 \| 기타. 미지정 시 전체 |
| `storage_location` | enum | N | 냉장 \| 냉동 \| 실온 |
| `status` | enum | N | 보관중 \| 구조 \| 폐기. 미지정 시 보관중만 반환(목록/홈 기본 동작) |
| `sort` | enum | N | `expiry_asc`(기본, 유통기한 임박순) \| `created_desc`(최근 등록순) \| `name_asc`(이름순) |
| `limit` | integer | N | 홈 화면의 "오늘 구조해야 할 음식"처럼 개수 제한이 필요할 때 사용 |

**요청 예시**

```
GET /foods?q=상추&category=채소&sort=expiry_asc
```

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "total_count": 5,
    "items": [
      {
        "food_id": "food_01h...",
        "name": "우유",
        "category": "유제품",
        "quantity": 1,
        "storage_location": "냉장",
        "expiry_date": "2026-09-08",
        "status": "보관중",
        "d_day": 0,
        "badge": "D-0"
      },
      {
        "food_id": "food_02h...",
        "name": "상추",
        "category": "채소",
        "quantity": 1,
        "storage_location": "냉장",
        "expiry_date": "2026-09-07",
        "status": "보관중",
        "d_day": -1,
        "badge": "유통기한경과"
      }
    ]
  }
}
```

> 홈 화면의 "오늘 구조해야 할 음식"은 `status=보관중 & d_day ≤ 1` 조건으로 프런트에서 필터링하거나, `sort=expiry_asc&limit=N` 조합으로 조회 후 클라이언트에서 `d_day ≤ 1`인 항목만 노출한다.

---

### 4.3 식품 상세 조회

| `GET` | `/foods/{food_id}` | 식품 상세 정보 (SCR-FOOD-DETAIL) |
|---|---|---|

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "food_id": "food_02h...",
    "name": "상추",
    "category": "채소",
    "quantity": 1,
    "purchase_date": "2026-09-05",
    "expiry_date": "2026-09-08",
    "storage_location": "냉장",
    "memo": null,
    "status": "보관중",
    "d_day": -1,
    "badge": "유통기한경과",
    "created_at": "2026-09-05T09:00:00Z",
    "updated_at": "2026-09-05T09:00:00Z",
    "resolved_at": null
  }
}
```

> 보관 꿀팁 문구는 이 응답에 포함하지 않고 `GET /storage-tips/random`을 별도 호출하여 화면 진입마다 새로 노출한다(7.1절).

**에러 케이스**

| 상태 코드 | 에러 코드 | 상황 |
|---|---|---|
| 404 | `FOOD_NOT_FOUND` | 존재하지 않거나 본인 소유가 아닌 food_id |

---

### 4.4 식품 수정

| `PATCH` | `/foods/{food_id}` | 식품 정보 수정 (SCR-FOOD-EDIT) |
|---|---|---|

수정 가능한 필드는 등록과 동일하다. 부분 업데이트(PATCH)를 지원하며, 요청에 포함된 필드만 갱신한다.

**요청 예시**

```http
PATCH /foods/food_02h...
{
  "quantity": 2,
  "expiry_date": "2026-09-10"
}
```

**응답**

200 OK, 갱신된 식품 전체 객체를 4.3절과 동일한 형태로 반환한다.

---

### 4.5 식품 상태 변경 (구조 / 폐기)

| `PATCH` | `/foods/{food_id}/status` | "먹었어요" / "폐기했어요" 처리 |
|---|---|---|

보관중 상태의 식품만 처리 가능하다. 처리 시 `resolved_at`이 기록되고 통계에 즉시 반영된다(기능명세서 3.4절).

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `status` | enum | Y | "구조"(먹었어요) 또는 "폐기"(폐기했어요) |

**요청 예시**

```http
PATCH /foods/food_02h.../status
{
  "status": "구조"
}
```

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "food_id": "food_02h...",
    "status": "구조",
    "resolved_at": "2026-09-08T03:10:00Z"
  }
}
```

**에러 케이스**

| 상태 코드 | 에러 코드 | 상황 |
|---|---|---|
| 404 | `FOOD_NOT_FOUND` | 존재하지 않거나 본인 소유가 아닌 식품 |
| 409 | `FOOD_ALREADY_RESOLVED` | 이미 구조/폐기 처리된 식품에 대한 재처리 시도 |
| 422 | `VALIDATION_ERROR` | status 값이 "구조"/"폐기"가 아닌 경우 |

---

### 4.6 식품 개별 삭제

| `DELETE` | `/foods/{food_id}` | 식품 1건 영구 삭제 |
|---|---|---|

> 현재 목업 화면에는 개별 삭제를 위한 명시적 버튼이 없으나(수정/먹었어요/폐기만 노출), 데이터 모델상 개별 삭제 가능성이 언급되어 있어 예비 엔드포인트로 정의한다(기능명세서 3.4절). 실제 노출 여부는 기획 확정 후 결정한다.

**응답**

```
204 No Content
```

---

### 4.7 전체 식품 데이터 삭제

| `DELETE` | `/foods` | 등록된 모든 식품 데이터 삭제 (SCR-SETTINGS-DELETE) |
|---|---|---|

삭제 확인 모달에서 "삭제하기" 클릭 시 호출한다. 계정 정보와 통계 이력은 삭제하지 않고, 음식(Food) 데이터만 전체 삭제한다(기능명세서 4.4절).

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `confirm` | boolean | Y | 반드시 true여야 삭제가 수행됨(오조작 방지용 이중 확인) |

**요청 예시**

```http
DELETE /foods
{
  "confirm": true
}
```

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "deleted_count": 5
  }
}
```

---

### 4.8 샘플 데이터 생성

| `POST` | `/foods/sample` | 데모/온보딩용 더미 식품 일괄 생성 (SCR-SETTINGS) |
|---|---|---|

**응답 예시 (201 Created)**

```json
{
  "success": true,
  "data": {
    "created_count": 5,
    "items": [ { "food_id": "food_09h...", "name": "우유", "...": "..." } ]
  }
}
```

---

## 5. 알림 API

### 5.1 알림 목록 조회

| `GET` | `/notifications` | 오늘 만료 / 3일 이내 임박 / 이미 지난 음식 (SCR-NOTI) |
|---|---|---|

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `q` | string | N | 음식명 검색 |
| `filter` | enum | N | `all`(기본) \| `today` \| `within_3_days` \| `expired` |

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "today_expiring": [
      { "food_id": "food_01h...", "name": "우유", "d_day": 0, "badge": "D-0" }
    ],
    "within_3_days": [
      { "food_id": "food_03h...", "name": "두부", "d_day": 2, "badge": "D-2" }
    ],
    "expired": []
  }
}
```

---

### 5.2 알림 설정 조회

| `GET` | `/notification-settings` | D-1 / D-3 알림 on-off 상태 |
|---|---|---|

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "d1_enabled": true,
    "d3_enabled": true,
    "notify_time": "08:00",
    "timezone": "Asia/Seoul"
  }
}
```

> `notify_time`과 `timezone`은 고정값으로, 수정 API(PATCH)의 요청 필드에 포함되지 않는다(기능명세서 2.9절 — 발송 시각은 KST 08:00 고정).

---

### 5.3 알림 설정 변경

| `PATCH` | `/notification-settings` | D-1 / D-3 토글 변경 |
|---|---|---|

**요청 예시**

```http
PATCH /notification-settings
{
  "d1_enabled": true,
  "d3_enabled": false
}
```

**응답**

200 OK, 변경된 설정 전체 객체를 5.2절과 동일한 형태로 반환한다.

---

## 6. 통계 API

### 6.1 통계 조회

| `GET` | `/stats` | 기간별 구조/폐기 통계 (SCR-STATS) |
|---|---|---|

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `period` | enum | Y | `today` \| `week` \| `month` |

**요청 예시**

```
GET /stats?period=today
```

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "period": "today",
    "rescued_count": 2,
    "rescued_delta": 3,
    "discarded_count": 1,
    "discarded_delta": -4,
    "rescue_rate": 67,
    "rescue_rate_delta": 12,
    "upcoming_count": 3,
    "upcoming_delta": -2,
    "category_breakdown": [
      { "category": "채소", "rescued_count": 2 },
      { "category": "유제품", "rescued_count": 0 },
      { "category": "과일", "rescued_count": 0 },
      { "category": "육류", "rescued_count": 0 },
      { "category": "기타", "rescued_count": 0 }
    ],
    "status_ratio": {
      "total_count": 8,
      "normal_pct": 25,
      "upcoming_pct": 38,
      "discarded_pct": 37
    },
    "recent_activities": [
      {
        "food_id": "food_10h...",
        "name": "상추",
        "action": "구조",
        "acted_at": "2026-09-08T02:00:00Z"
      },
      {
        "food_id": "food_11h...",
        "name": "사과",
        "action": "폐기",
        "acted_at": "2026-09-07T20:00:00Z"
      }
    ]
  }
}
```

> `recent_activities`는 최대 5건까지만 반환한다(기능명세서 2.8절). `rescue_rate`는 구조 수 ÷ (구조 수 + 폐기 수) × 100이며 분모가 0이면 0을 반환한다(3장 지표 산정 로직).

---

## 7. 보관 꿀팁 API

### 7.1 랜덤 보관 꿀팁 조회

| `GET` | `/storage-tips/random` | 10개 문구 풀 중 1개 무작위 반환 (SCR-FOOD-DETAIL) |
|---|---|---|

카테고리와 무관하게 동일한 10개 문구 풀을 사용하며, 호출할 때마다 서버에서 무작위로 1개를 선택해 반환한다(기능명세서 3.5절).

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "tip_id": 5,
    "message": "채소는 신문지나 키친타월로 감싸 습기를 조절하면 더 오래갑니다."
  }
}
```

> 직전 노출 문구의 연속 재노출 방지 여부는 열린 이슈이다(기능명세서 4.2절). 정책이 확정되면 요청에 `exclude_tip_id` 같은 파라미터를 추가하는 방식으로 확장할 수 있다.

---

## 8. 문의/FAQ API

### 8.1 FAQ 목록 조회

| `GET` | `/faqs` | 자주 묻는 질문 목록 (SCR-FAQ) |
|---|---|---|

인증 불필요(비로그인 상태에서도 조회 가능하도록 설계 권장). `answer`가 아직 작성되지 않은 문항은 `null`로 반환한다(기능명세서 2.13절 — 5~12번 문항 답변 미작성).

**응답 예시 (200 OK)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "faq_id": 1,
        "question": "등록한 음식의 유통기한 알림은 언제 오나요?",
        "answer": "매일 오전 8시(KST)에 조건을 만족하는 식품에 대해 앱 푸시가 발송됩니다."
      },
      {
        "faq_id": 5,
        "question": "바코드를 찍으면 음식 정보가 자동으로 입력되나요?",
        "answer": null
      }
    ],
    "contact_email": "team@fridge-rescue.app"
  }
}
```

---

## 9. 레시피 추천 API (후순위)

### 9.1 레시피 추천 요청

| `POST` | `/recipes/recommend` | AI 레시피 추천 (미구현, placeholder) |
|---|---|---|

기능명세서 4.3절 정책에 따라 UI(버튼)는 제공하되 실제 추천 로직은 연동하지 않는다. 클라이언트는 이 엔드포인트를 호출하는 대신 "준비 중인 기능이에요" 토스트를 직접 노출하는 것을 권장하며, 서버 연동을 유지하고 싶은 경우 아래와 같이 501을 반환한다.

**응답 예시 (501 Not Implemented)**

```json
{
  "success": false,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "준비 중인 기능이에요."
  }
}
```

> 후순위 로드맵에서 실연동이 확정되면, 요청 바디에 `food_id` 또는 재료 목록을 받아 외부 레시피 API/AI 모델과 연동하는 방식으로 확장한다(기능명세서 5장 백로그 참조).

---

## 10. 데이터 모델 요약

아래 엔티티는 기능명세서 최종본 3장의 정의를 API 관점에서 재정리한 것이다. 상세 비즈니스 로직은 기능명세서를 우선 참조한다.

### 10.1 User

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` | string | 사용자 고유 식별자 |
| `email` | string | 로그인 아이디, 중복 불가 |
| `nickname` | string | 닉네임 |
| `password_hash` | string | 비밀번호 해시값 (API 응답에는 포함하지 않음) |
| `created_at` / `updated_at` | datetime | 가입/최종 수정 일시 |

### 10.2 Food

| 필드 | 타입 | 설명 |
|---|---|---|
| `food_id` | string | 식품 고유 식별자 |
| `user_id` | string | 소유 사용자 |
| `name` | string | 음식명 |
| `category` | enum | 유제품/채소/과일/육류/기타 |
| `quantity` | integer | 수량, 기본값 1 |
| `purchase_date` | date | 구매일 |
| `expiry_date` | date | 유통기한 |
| `storage_location` | enum | 냉장/냉동/실온 |
| `memo` | string | 메모 |
| `status` | enum | 보관중/구조/폐기 |
| `d_day` | integer (파생) | 응답 시 서버가 계산하여 반환, 저장하지 않음 |
| `badge` | string (파생) | D-N 또는 "유통기한경과", 응답 시 계산 |
| `created_at` / `updated_at` / `resolved_at` | datetime | 등록/수정/처리 일시 |

### 10.3 NotificationSetting

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` | string | 사용자 식별자 |
| `d1_enabled` | boolean | D-1 알림 수신 여부, 기본값 true |
| `d3_enabled` | boolean | D-3 알림 수신 여부, 기본값 true |
| `notify_time` | string (고정값) | "08:00", 수정 불가 |

---

## 11. 부록 — 화면별 API 호출 매핑표

| 화면 ID | 화면명 | 호출 API |
|---|---|---|
| SCR-LOGIN | 로그인 | `POST /auth/login` |
| SCR-SIGNUP | 회원가입 | `POST /auth/signup` |
| SCR-HOME | 홈 | `GET /foods?status=보관중&sort=expiry_asc`, `GET /stats?period=week`, `GET /notifications`(뱃지 카운트용, 선택) |
| SCR-FOOD-ADD | 음식 등록 | `POST /foods` |
| SCR-FOOD-DETAIL | 음식 상세조회 | `GET /foods/{id}`, `GET /storage-tips/random`, `PATCH /foods/{id}/status` |
| SCR-FOOD-EDIT | 음식 수정 | `GET /foods/{id}`(프리필), `PATCH /foods/{id}` |
| SCR-FOOD-LIST | 목록 | `GET /foods`(검색/필터/정렬), `PATCH /foods/{id}/status`, `PATCH /foods/{id}` |
| SCR-STATS | 통계 | `GET /stats?period=today\|week\|month` |
| SCR-NOTI | 알림 | `GET /notifications`, `GET /notification-settings`, `PATCH /notification-settings` |
| SCR-SETTINGS | 설정 | `GET /users/me`, `POST /foods/sample` |
| SCR-SETTINGS-PROFILE | 설정 · 계정 설정 | `GET /users/me`, `PATCH /users/me` |
| SCR-SETTINGS-DELETE | 설정 · 전체 데이터 삭제 | `DELETE /foods` |
| SCR-FAQ | 설정 · 문의/FAQ | `GET /faqs` |

> 로그아웃(`POST /auth/logout`)은 설정 화면 하단 "로그아웃" 버튼에서, 별도 화면 이동 없이 호출된다.
