import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeFoodStatus, listFoods } from "../api/foods";
import Badge from "../components/Badge";
import Button from "../components/Button";
import ConfirmModal from "../components/ConfirmModal";
import FAB from "../components/FAB";
import { TabScreen } from "../components/layout/Screen";
import { CATEGORIES, CATEGORY_EMOJI, SORT_OPTIONS } from "../config/constants";
import { useToast } from "../context/ToastContext";
import "./FoodListPage.css";

const CATEGORY_FILTERS = ["전체", ...CATEGORIES];

// images/와이어프레임/7_목록.jpg
export default function FoodListPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("expiry_asc");
  const [discardTarget, setDiscardTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(load, 200); // 검색어 실시간 필터링 디바운스
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, sort]);

  async function load() {
    const res = await listFoods({ q: q || undefined, category: category === "전체" ? undefined : category, sort });
    setItems(res.items);
    setTotalCount(res.total_count);
  }

  async function handleRescue(foodId) {
    try {
      await changeFoodStatus(foodId, "구조");
      setItems((prev) => prev.filter((f) => f.food_id !== foodId));
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDiscard() {
    try {
      await changeFoodStatus(discardTarget.food_id, "폐기");
      setItems((prev) => prev.filter((f) => f.food_id !== discardTarget.food_id));
    } catch (err) {
      showToast(err.message);
    } finally {
      setDiscardTarget(null);
    }
  }

  return (
    <TabScreen title="냉장고 목록">
      <input
        className="food-list__search"
        placeholder="음식명을 검색해보세요 (예: 상추, 우유, 토마토)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="food-list__filters">
        {CATEGORY_FILTERS.map((c) => (
          <button
            key={c}
            className={"pill" + (category === c ? " pill--active" : "")}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="food-list__meta">
        <span>총 {totalCount}개의 음식이 있어요</span>
        <select className="food-list__sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="food-list__items">
        {items.map((food) => (
          <div className="food-list__card" key={food.food_id}>
            <div className="food-list__card-top" onClick={() => navigate(`/foods/${food.food_id}`)}>
              <span className="food-list__icon">{CATEGORY_EMOJI[food.category]}</span>
              <div className="food-list__info">
                <span className="food-list__name">{food.name}</span>
                <span className="food-list__sub">
                  {food.storage_location} · {food.category} · {food.quantity}개
                </span>
              </div>
              <Badge dDay={food.d_day} badge={food.badge} />
            </div>
            <div className="food-list__actions">
              <Button variant="secondary" fullWidth={false} onClick={() => navigate(`/foods/${food.food_id}/edit`)}>
                수정하기
              </Button>
              <Button variant="success" fullWidth={false} onClick={() => handleRescue(food.food_id)}>
                먹었어요
              </Button>
              <Button variant="danger" fullWidth={false} onClick={() => setDiscardTarget(food)}>
                폐기
              </Button>
            </div>
          </div>
        ))}
      </div>

      <FAB />

      <ConfirmModal
        open={!!discardTarget}
        title="이 음식을 폐기 처리할까요?"
        description={discardTarget ? `${discardTarget.name}을(를) 폐기 처리하면 되돌릴 수 없어요.` : ""}
        confirmLabel="폐기했어요"
        onCancel={() => setDiscardTarget(null)}
        onConfirm={handleDiscard}
      />
    </TabScreen>
  );
}
