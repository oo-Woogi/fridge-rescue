import { useNavigate } from "react-router-dom";
import { BRAND } from "../../config/copy";
import "./Header.css";

/**
 * 기능명세서_최종본.md 1.6.2절:
 * - 홈/목록/통계: 로고 + 알림 종 아이콘(우측), 클릭 시 알림 화면 이동
 * - 그 외 서브 화면: back 버튼 + 타이틀
 */
export function LogoHeader({ onBellClick, title }) {
  return (
    <header className="header">
      <div className="header__logo">
        <span className="header__logo-leaf">🍃</span>
        {title ? (
          <span className="header__page-title">{title}</span>
        ) : (
          <div>
            <div className="header__logo-ko">{BRAND.nameKo}</div>
            <div className="header__logo-en">{BRAND.nameEn}</div>
          </div>
        )}
      </div>
      <button className="header__bell" aria-label="알림" onClick={onBellClick}>
        🔔
      </button>
    </header>
  );
}

export function TitleHeader({ title, right = null, onBack }) {
  const navigate = useNavigate();
  return (
    <header className="header">
      <button className="header__back" aria-label="뒤로가기" onClick={onBack || (() => navigate(-1))}>
        ←
      </button>
      <h1 className="header__title">{title}</h1>
      <div className="header__right">{right}</div>
    </header>
  );
}
