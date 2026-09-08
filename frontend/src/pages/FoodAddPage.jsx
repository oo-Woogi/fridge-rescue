import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFood } from "../api/foods";
import Button from "../components/Button";
import PillGroup from "../components/PillGroup";
import Stepper from "../components/Stepper";
import TextField from "../components/TextField";
import { BackScreen } from "../components/layout/Screen";
import { CATEGORIES, MEMO_MAX_LENGTH, PRE_SUBMIT_CHECKS, STORAGE_LOCATIONS } from "../config/constants";
import "./FoodFormPage.css";

const todayStr = () => new Date().toISOString().slice(0, 10);

// images/와이어프레임/4_음식등록.jpg
// 하단 탭바 없음(back 헤더만) — 와이어프레임 확인 결과 및 사용자 확인(2026-09-08)에 따름.
export default function FoodAddPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quantity, setQuantity] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState(todayStr());
  const [expiryDate, setExpiryDate] = useState("");
  const [storageLocation, setStorageLocation] = useState(STORAGE_LOCATIONS[0]);
  const [memo, setMemo] = useState("");
  const [checks, setChecks] = useState([false, false, false]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 등록 전 체크 항목 3개는 사용자 확인(2026-09-08)에 따라 모두 체크해야 등록 가능
  const allChecked = checks.every(Boolean);
  const canSubmit = name.trim().length > 0 && !!expiryDate && allChecked && !submitting;

  function toggleCheck(i) {
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const food = await createFood({
        name: name.trim(),
        category,
        quantity,
        purchase_date: purchaseDate,
        expiry_date: expiryDate,
        storage_location: storageLocation,
        memo: memo.trim() || undefined,
      });
      navigate(`/foods/${food.food_id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BackScreen title="음식 등록">
      <form className="food-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label">음식명 *</label>
          <TextField placeholder="예: 상추, 토마토, 두부 등" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label">카테고리 *</label>
          <PillGroup options={CATEGORIES} value={category} onChange={setCategory} />
        </div>

        <div className="field">
          <label className="field-label">수량</label>
          <Stepper value={quantity} onChange={setQuantity} />
        </div>

        <div className="field">
          <label className="field-label">구매일</label>
          <input type="date" className="date-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label">유통기한 *</label>
          <input type="date" className="date-input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label">보관 위치</label>
          <PillGroup options={STORAGE_LOCATIONS} value={storageLocation} onChange={setStorageLocation} />
        </div>

        <div className="field">
          <label className="field-label">메모 (선택)</label>
          <textarea
            className="textarea"
            placeholder="예: 샐러드용으로 구매했어요"
            value={memo}
            maxLength={MEMO_MAX_LENGTH}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="check-list">
          <p className="check-list__title">등록 전 체크 항목</p>
          {PRE_SUBMIT_CHECKS.map((label, i) => (
            <label className="check-list__item" key={label}>
              <input type="checkbox" checked={checks[i]} onChange={() => toggleCheck(i)} />
              {label}
            </label>
          ))}
        </div>

        {error && <p className="food-form__error">{error}</p>}

        <div className="fixed-bottom-bar">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "등록 중…" : "등록하기 →"}
          </Button>
        </div>
      </form>
    </BackScreen>
  );
}
