import { useEffect, useState } from "react";
import { fetchStats } from "../api/stats";
import mascotData from "../assets/character/data.png";
import iconRescued from "../assets/ui/pool/2.png";
import iconDiscarded from "../assets/ui/pool/3.png";
import iconRescueRate from "../assets/ui/pool/4.png";
import iconUpcoming from "../assets/ui/pool/6.png";
import DonutChart from "../components/DonutChart";
import { TabScreen } from "../components/layout/Screen";
import { CATEGORY_CHART_COLOR, STATUS_RATIO_COLOR } from "../config/chartColors";
import { STATS_PERIODS } from "../config/constants";
import "./StatsPage.css";

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

const ACTION_LABEL = { 구조: "구조했어요", 폐기: "폐기했어요" };
const ACTION_EMOJI = { 구조: "🥗", 폐기: "🗑" };

// images/와이어프레임/8_통계.jpg
export default function StatsPage() {
  const [period, setPeriod] = useState("today");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats(period).then(setStats);
  }, [period]);

  const cards = stats
    ? [
        { label: "구조한 음식 수", value: stats.rescued_count, delta: stats.rescued_delta, icon: iconRescued, tone: "success" },
        { label: "폐기한 음식 수", value: stats.discarded_count, delta: stats.discarded_delta, icon: iconDiscarded, tone: "danger" },
        { label: "구조율", value: `${stats.rescue_rate}%`, delta: stats.rescue_rate_delta, icon: iconRescueRate, tone: "warning", isRate: true },
        { label: "임박 음식 수", value: stats.upcoming_count, delta: stats.upcoming_delta, icon: iconUpcoming, tone: "info" },
      ]
    : [];

  const maxCategoryCount = stats ? Math.max(1, ...stats.category_breakdown.map((c) => c.rescued_count)) : 1;

  return (
    <TabScreen>
      <section className="stats-hero">
        <div>
          <h1 className="stats-hero__title">통계</h1>
          <p className="stats-hero__subtitle">
            작은 실천이 더 좋은 지구를 만듭니다.
            <br />
            지금까지의 변화를 확인해보세요!
          </p>
        </div>
        <div className="stats-hero__mascot-wrap">
          <div className="stats-hero__bubble">
            좋은 습관이
            <br />
            좋은 지구를 만들어요
          </div>
          <img className="stats-hero__mascot" src={mascotData} alt="통계 마스코트" />
        </div>
      </section>

      <div className="stats-period-tabs">
        {STATS_PERIODS.map((p) => (
          <button
            key={p.value}
            className={"stats-period-tab" + (period === p.value ? " stats-period-tab--active" : "")}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {stats && (
        <>
          <div className="stats-card-grid">
            {cards.map((card) => (
              <div className={`stats-card stats-card--${card.tone}`} key={card.label}>
                <img className="stats-card__icon" src={card.icon} alt="" />
                <span className="stats-card__label">{card.label}</span>
                <span className="stats-card__value">{card.value}{!card.isRate && "개"}</span>
                <span className={"stats-card__delta" + (card.delta < 0 ? " stats-card__delta--down" : "")}>
                  {card.delta >= 0 ? "▲" : "▼"} {card.delta >= 0 ? "+" : ""}
                  {card.delta}
                  {card.isRate ? "%p" : ""}
                </span>
              </div>
            ))}
          </div>

          <section className="stats-panel">
            <h2 className="stats-panel__title">📶 카테고리별 구조 현황</h2>
            <div className="stats-bar-chart">
              {stats.category_breakdown.map((c) => (
                <div className="stats-bar" key={c.category}>
                  <span className="stats-bar__count">{c.rescued_count}</span>
                  <div className="stats-bar__track">
                    <div
                      className="stats-bar__fill"
                      style={{
                        height: `${(c.rescued_count / maxCategoryCount) * 100}%`,
                        background: CATEGORY_CHART_COLOR[c.category],
                      }}
                    />
                  </div>
                  <span className="stats-bar__label">{c.category}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="stats-panel">
            <h2 className="stats-panel__title">◔ 상태 비중</h2>
            <DonutChart
              centerValue={stats.status_ratio.total_count}
              centerLabel="총 개수"
              segments={[
                { value: stats.status_ratio.normal_pct, color: STATUS_RATIO_COLOR.normal },
                { value: stats.status_ratio.upcoming_pct, color: STATUS_RATIO_COLOR.upcoming },
                { value: stats.status_ratio.discarded_pct, color: STATUS_RATIO_COLOR.discarded },
              ]}
            />
            <div className="stats-legend">
              <span><i style={{ background: STATUS_RATIO_COLOR.normal }} /> 정상 {stats.status_ratio.normal_pct}%</span>
              <span><i style={{ background: STATUS_RATIO_COLOR.upcoming }} /> 임박 {stats.status_ratio.upcoming_pct}%</span>
              <span><i style={{ background: STATUS_RATIO_COLOR.discarded }} /> 폐기 {stats.status_ratio.discarded_pct}%</span>
            </div>
          </section>

          <section className="stats-panel">
            <h2 className="stats-panel__title">🕐 최근 요약</h2>
            <div className="stats-recent-list">
              {stats.recent_activities.length === 0 && <p className="stats-empty">아직 처리 이력이 없어요.</p>}
              {stats.recent_activities.map((a, i) => (
                <div className="stats-recent-item" key={`${a.food_id}-${i}`}>
                  <span className="stats-recent-item__emoji">{ACTION_EMOJI[a.action]}</span>
                  <span className="stats-recent-item__name">{a.name}</span>
                  <span className={`stats-recent-item__badge stats-recent-item__badge--${a.action === "구조" ? "success" : "danger"}`}>
                    {ACTION_LABEL[a.action]}
                  </span>
                  <span className="stats-recent-item__time">{relativeTime(a.acted_at)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </TabScreen>
  );
}
