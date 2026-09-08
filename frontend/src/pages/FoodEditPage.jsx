import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFood, updateFood } from "../api/foods";
import Button from "../components/Button";
import PillGroup from "../components/PillGroup";
import Stepper from "../components/Stepper";
import TextField from "../components/TextField";
import { BackScreen } from "../components/layout/Screen";
import { CATEGORIES, MEMO_MAX_LENGTH, STORAGE_LOCATIONS } from "../config/constants";
import "./FoodFormPage.css";

// images/와이어프레임/6_음식수정.jpg
export default function FoodEditPage() {
  const { foodId } = useParams();
  const navigate = useNavigate();

  const [original, setOriginal] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getFood(foodId).then((food) => {
      setOriginal(food);
      setName(food.name);
      setCategory(food.category);
      setQuantity(food.quantity);
      setPurchaseDate(food.purchase_date);
      setExpiryDate(food.expiry_date);
      setStorageLocation(food.storage_location);
      setMemo(food.memo || "");
    });
  }, [foodId]);

  if (!original) return null;

  const canSubmit = name.trim().length > 0 && !!expiryDate && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await updateFood(foodId, {
        name: name.trim(),
        category,
        quantity,
        purchase_date: purchaseDate,
        expiry_date: expiryDate,
        storage_location: storageLocation,
        memo: memo.trim() || null,
      });
      navigate(`/foods/${foodId}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BackScreen title="음식 수정">
      <form className="food-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label">음식명 *</label>
          <TextField value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label">카테고리 *</label>
          <PillGroup options={CATEGORIES} value={category} onChange={setCategory} />
        </div>

        <div className="field">
          <label className="field-label">수량</label>
          <Stepper value={quantity} onChange={setQuantity} />
          <p className="food-form__prev-value">이전: {original.quantity}개</p>
        </div>

        <div className="field">
          <label className="field-label">구매일</label>
          <input type="date" className="date-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label">유통기한 *</label>
          <input type="date" className="date-input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          <p className="food-form__prev-value">이전: {original.expiry_date}</p>
        </div>

        <div className="field">
          <label className="field-label">보관 위치</label>
          <PillGroup options={STORAGE_LOCATIONS} value={storageLocation} onChange={setStorageLocation} />
        </div>

        <div className="field">
          <label className="field-label">메모 (선택)</label>
          <textarea
            className="textarea"
            value={memo}
            maxLength={MEMO_MAX_LENGTH}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        {error && <p className="food-form__error">{error}</p>}

        <div className="fixed-bottom-bar">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "저장 중…" : "저장하기 →"}
          </Button>
        </div>
      </form>
    </BackScreen>
  );
}
