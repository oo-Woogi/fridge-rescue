import { useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import { LogoHeader, TitleHeader } from "./Header";
import "./Screen.css";

/** 하단 탭바가 있는 화면(홈/음식등록/목록/통계/설정) 공용 셸. */
export function TabScreen({ children, title, contentClassName = "" }) {
  const navigate = useNavigate();
  return (
    <>
      <LogoHeader title={title} onBellClick={() => navigate("/notifications")} />
      <main className={`screen__content ${contentClassName}`}>{children}</main>
      <BottomNav />
    </>
  );
}

/**
 * back 버튼 헤더 + 하단 탭바(활성 탭 없음)를 함께 쓰는 화면.
 * 기능명세서_최종본.md 2.9절: 알림 화면은 back 헤더이면서도 하단 탭바가 노출된다(활성 탭 없음).
 */
export function BackWithTabsScreen({ title, children, contentClassName = "" }) {
  return (
    <>
      <TitleHeader title={title} />
      <main className={`screen__content ${contentClassName}`}>{children}</main>
      <BottomNav />
    </>
  );
}

/** back 버튼 헤더만 있는 화면(회원가입/상세/수정/계정설정/문의 등) 공용 셸. */
export function BackScreen({ title, right, onBack, children, contentClassName = "" }) {
  return (
    <>
      <TitleHeader title={title} right={right} onBack={onBack} />
      <main className={`screen__content ${contentClassName}`}>{children}</main>
    </>
  );
}
