import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificationSettings, listNotifications, updateNotificationSettings } from "../api/notifications";
import mascotNotice from "../assets/character/notice.png";
import Badge from "../components/Badge";
import { BackWithTabsScreen } from "../components/layout/Screen";
import Switch from "../components/Switch";
import { CATEGORY_EMOJI, NOTIFICATION_FILTERS } from "../config/constants";
import "./NotificationsPage.css";

// images/와이어프레임/9_알림.jpg
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState({ today_expiring: [], within_3_days: [], expired: [] });
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getNotificationSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  async function load() {
    const res = await listNotifications({ q: q || undefined, filter });
    setData(res);
  }

  async function toggleSetting(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await updateNotificationSettings({ [key]: next[key] });
  }

  function renderGroup(title, dotClass, list) {
    if (list.length === 0) return null;
    return (
      <section className="noti-group">
        <h2 className="noti-group__title">
          <span className={`noti-group__dot noti-group__dot--${dotClass}`} /> {title} ({list.length})
        </h2>
        <div className="noti-group__items">
          {list.map((food) => (
            <button key={food.food_id} className="noti-item" onClick={() => navigate(`/foods/${food.food_id}`)}>
              <span className="noti-item__icon">{CATEGORY_EMOJI[food.category]}</span>
              <span className="noti-item__body">
                <span className="noti-item__name">{food.name}</span>
                <span className="noti-item__desc">유통기한이 {food.badge} 남았어요</span>
              </span>
              <Badge dDay={food.d_day} badge={food.badge} />
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <BackWithTabsScreen title="알림">
      <div className="noti-hero">
        <div>
          <h1 className="noti-hero__title">알림</h1>
          <p className="noti-hero__subtitle">
            놓치기 쉬운 유통기한,
            <br />
            제가 미리 알려드릴게요
          </p>
        </div>
        <div className="noti-hero__mascot-wrap">
          <div className="noti-hero__bubble">잊지 않게 알려줄게요!</div>
          <img className="noti-hero__mascot" src={mascotNotice} alt="알림 마스코트" />
        </div>
      </div>

      <input
        className="food-list__search"
        placeholder="음식 이름으로 검색해보세요"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="food-list__filters">
        {NOTIFICATION_FILTERS.map((f) => (
          <button
            key={f.value}
            className={"pill" + (filter === f.value ? " pill--active" : "")}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {renderGroup("오늘 만료", "danger", data.today_expiring)}
      {renderGroup("3일 이내 임박", "warning", data.within_3_days)}
      {renderGroup("이미 지난 음식", "expired", data.expired)}

      {settings && (
        <section className="noti-settings">
          <h2 className="noti-settings__title">알림 기준 설정</h2>
          <div className="noti-settings__row">
            <span>
              <strong>D-1 알림</strong> 전일 오전 알림 받기
            </span>
            <Switch checked={settings.d1_enabled} onChange={() => toggleSetting("d1_enabled")} />
          </div>
          <div className="noti-settings__row">
            <span>
              <strong>D-3 알림</strong> 3일 전 미리 알림 받기
            </span>
            <Switch checked={settings.d3_enabled} onChange={() => toggleSetting("d3_enabled")} />
          </div>
        </section>
      )}
    </BackWithTabsScreen>
  );
}
