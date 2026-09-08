import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchRandomTip } from "../api/content";
import { changeFoodStatus, getFood } from "../api/foods";
import mascotRecipe from "../assets/character/recipe.png";
import Badge from "../components/Badge";
import Button from "../components/Button";
import ConfirmModal from "../components/ConfirmModal";
import { BackScreen } from "../components/layout/Screen";
import { CATEGORY_EMOJI, FOOD_STATUS } from "../config/constants";
import { useToast } from "../context/ToastContext";
import "./FoodDetailPage.css";

const STATUS_CHIP_LABEL = {
  [FOOD_STATUS.KEEPING]: "보관 중",
  [FOOD_STATUS.RESCUED]: "구조 완료",
  [FOOD_STATUS.DISCARDED]: "폐기 완료",
};

// images/와이어프레임/5_음식상세조회.jpg
export default function FoodDetailPage() {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [food, setFood] = useState(null);
  const [tip, setTip] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getFood(foodId).then(setFood);
    fetchRandomTip().then((t) => setTip(t.message));
  }, [foodId]);

  if (!food) return null;

  const dDayText = food.d_day < 0 ? `유통기한이 ${Math.abs(food.d_day)}일 지났어요` : `유통기한까지 ${food.d_day}일 남았어요`;
  const canResolve = food.status === FOOD_STATUS.KEEPING;

  async function handleRescue() {
    setBusy(true);
    try {
      await changeFoodStatus(food.food_id, FOOD_STATUS.RESCUED);
      navigate(-1);
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDiscard() {
    setBusy(true);
    try {
      await changeFoodStatus(food.food_id, FOOD_STATUS.DISCARDED);
      navigate(-1);
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
      setConfirmDiscard(false);
    }
  }

  // API명세서.md 9.1절 권장사항: 서버 호출 없이 클라이언트에서 바로 안내 토스트만 노출한다.
  function handleRecipeClick() {
    showToast("준비 중인 기능이에요");
  }

  return (
    <BackScreen title={food.name} right={<img className="food-detail__header-mascot" src={mascotRecipe} alt="" />}>
      <div className="food-detail__summary">
        <span className="food-detail__emoji">{CATEGORY_EMOJI[food.category]}</span>
        <h2 className="food-detail__name">{food.name}</h2>
        <Badge dDay={food.d_day} badge={food.badge} showDangerSuffix />
        <p className="food-detail__ddaytext">{dDayText}</p>
        <span className="food-detail__status-chip">{STATUS_CHIP_LABEL[food.status]}</span>
      </div>

      <dl className="food-detail__list">
        <div className="food-detail__row">
          <dt>카테고리</dt>
          <dd>
            {CATEGORY_EMOJI[food.category]} {food.category}
          </dd>
        </div>
        <div className="food-detail__row">
          <dt>수량</dt>
          <dd>{food.quantity}개</dd>
        </div>
        <div className="food-detail__row">
          <dt>구매일</dt>
          <dd>{food.purchase_date}</dd>
        </div>
        <div className="food-detail__row">
          <dt>유통기한</dt>
          <dd>{food.expiry_date}</dd>
        </div>
        <div className="food-detail__row">
          <dt>보관위치</dt>
          <dd>{food.storage_location}</dd>
        </div>
        <div className="food-detail__row">
          <dt>메모</dt>
          <dd>{food.memo || "—"}</dd>
        </div>
      </dl>

      <Button variant="success" onClick={handleRecipeClick}>
        🔍 이 재료로 레시피 추천받기
      </Button>

      {tip && (
        <div className="food-detail__tip">
          <p className="food-detail__tip-title">💡 보관 꿀팁!</p>
          <p className="food-detail__tip-body">{tip}</p>
        </div>
      )}

      {canResolve && (
        <div className="food-detail__actions">
          <Button variant="secondary" fullWidth={false} onClick={() => navigate(`/foods/${food.food_id}/edit`)}>
            수정
          </Button>
          <Button variant="success" fullWidth={false} disabled={busy} onClick={handleRescue}>
            먹었어요
          </Button>
          <Button variant="danger" fullWidth={false} disabled={busy} onClick={() => setConfirmDiscard(true)}>
            폐기했어요
          </Button>
        </div>
      )}

      <ConfirmModal
        open={confirmDiscard}
        title="이 음식을 폐기 처리할까요?"
        description={`${food.name}을(를) 폐기 처리하면 되돌릴 수 없어요.`}
        confirmLabel="폐기했어요"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={handleDiscard}
      />
    </BackScreen>
  );
}
