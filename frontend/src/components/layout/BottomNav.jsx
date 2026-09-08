import { NavLink } from "react-router-dom";
import homeIcon from "../../assets/ui/icon/home_icon.png";
import addIcon from "../../assets/ui/icon/add_icon.png";
import listIcon from "../../assets/ui/icon/list_icon.png";
import statIcon from "../../assets/ui/icon/pool_icon.png";
import settingIcon from "../../assets/ui/icon/setting_icon.png";
import "./BottomNav.css";

// 기능명세서_최종본.md 1.6.1절: 5개 탭 (홈/음식 등록/목록 보기/통계/설정), 아이콘은 images/ui/icon/*
const TABS = [
  { to: "/home", label: "홈", icon: homeIcon },
  { to: "/foods/new", label: "음식 등록", icon: addIcon },
  { to: "/foods", label: "목록 보기", icon: listIcon },
  { to: "/stats", label: "통계", icon: statIcon },
  { to: "/settings", label: "설정", icon: settingIcon },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => "bottom-nav__item" + (isActive ? " bottom-nav__item--active" : "")}
        >
          <span className="bottom-nav__icon" style={{ WebkitMaskImage: `url(${tab.icon})`, maskImage: `url(${tab.icon})` }} />
          <span className="bottom-nav__label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
