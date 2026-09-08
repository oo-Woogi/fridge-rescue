import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listFoods } from "../api/foods";
import { fetchStats } from "../api/stats";
import mascotMain from "../assets/character/main.png";
import Badge from "../components/Badge";
import FAB from "../components/FAB";
import { TabScreen } from "../components/layout/Screen";
import { CATEGORY_EMOJI } from "../config/constants";
import { useToast } from "../context/ToastContext";
import "./HomePage.css";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

// "9월 8일" / "화" 형태로 접속 시점의 오늘 날짜를 계산한다(하드코딩 아님).
function todayDisplay() {
  const now = new Date();
  return {
    monthDay: `${now.getMonth() + 1}월 ${now.getDate()}일`,
    weekday: WEEKDAY_KO[now.getDay()],
  };
}

// images/와이어프레임/3_홈.jpg
export default function HomePage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [urgentFoods, setUrgentFoods] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [weekStats, setWeekStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [foodsRes, statsRes] = await Promise.all([
        listFoods({ sort: "expiry_asc" }),
        fetchStats("week"),
      ]);
      setTotalCount(foodsRes.total_count);
      setUrgentFoods(foodsRes.items.filter((f) => f.d_day <= 1 && f.d_day >= 0));
      setWeekStats(statsRes);
    } finally {
      setLoading(false);
    }
  }

  const { monthDay, weekday } = todayDisplay();

  const summaryCards = [
    { label: "전체 음식", value: totalCount },
    { label: "임박 음식", value: weekStats?.upcoming_count ?? 0, accent: true },
    { label: "이번 주 구조", value: weekStats?.rescued_count ?? 0 },
    { label: "이번 주 폐기", value: weekStats?.discarded_count ?? 0 },
  ];

  return (
    <TabScreen>
      <section className="home-hero">
        <div className="home-hero__intro">
          <span className="home-date-chip">
            <span className="home-date-chip__icon" aria-hidden="true">📅</span>
            {monthDay} <span className="home-date-chip__weekday">({weekday})</span>
          </span>
          <h1 className="home-hero__heading">
            오늘도 냉장고를
            <br />
            <span className="home-hero__heading-accent">구조</span>해볼까요?
          </h1>
          <p className="home-hero__tagline">
            냉장고 속 음식이
            <br />
            우리를 기다리고 있어요
          </p>
        </div>
        <div className="home-hero__mascot-wrap">
          <div className="home-hero__bubble">오늘도 화이팅!</div>
          <img className="home-hero__mascot" src={mascotMain} alt="냉장고 마스코트" />
        </div>
      </section>

      <section>
        <h2 className="home-section-title">오늘 구조해야 할 음식</h2>
        {!loading && urgentFoods.length === 0 && (
          <p className="home-empty">지금은 급하게 구조할 음식이 없어요. 훌륭해요!</p>
        )}
        <div className="home-urgent-scroll">
          {urgentFoods.map((food) => (
            <button key={food.food_id} className="home-urgent-card" onClick={() => navigate(`/foods/${food.food_id}`)}>
              <span className="home-urgent-card__emoji">{CATEGORY_EMOJI[food.category]}</span>
              <span className="home-urgent-card__name">{food.name}</span>
              <Badge dDay={food.d_day} badge={food.badge} showDangerSuffix />
              <span className="home-urgent-card__meta">
                {food.storage_location} · {food.category}
              </span>
            </button>
          ))}
        </div>
      </section>

      <button
        className="home-recipe-banner"
        onClick={() => showToast("준비 중인 기능이에요")}
      >
        <span className="home-recipe-banner__icon">🔍</span>
        <span className="home-recipe-banner__text">
          <strong>임박 음식으로 레시피 추천받기</strong>
          <span>AI가 재료에 맞는 요리를 추천해드려요</span>
        </span>
        <span>→</span>
      </button>

      <section>
        <h2 className="home-section-title">이번 주 요약</h2>
        <div className="home-summary-grid">
          {summaryCards.map((card) => (
            <div className="home-summary-card" key={card.label}>
              <span className="home-summary-card__label">{card.label}</span>
              <span className={"home-summary-card__value" + (card.accent ? " home-summary-card__value--accent" : "")}>
                {card.value}
                <span className="home-summary-card__unit">개</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="home-footer-banner">
        <div className="home-footer-banner__title">냉장고 속 작은 실천이</div>
        <div className="home-footer-banner__subtitle">더 큰 지구를 만듭니다</div>
      </div>

      <FAB />
    </TabScreen>
  );
}
