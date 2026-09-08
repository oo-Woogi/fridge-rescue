import "./MobileFrame.css";

/**
 * 모든 화면을 감싸는 최상위 컨테이너.
 * CLAUDE.md: 아이폰 14 Pro / 15 뷰포트(393x852) 기준 레이아웃, 데스크톱 폭 대응 아님.
 * 데스크톱 등 더 넓은 화면에서는 393px 폭으로 가운데 정렬한다.
 */
export default function MobileFrame({ children }) {
  return (
    <div className="mobile-frame">
      <div className="mobile-frame__screen">{children}</div>
    </div>
  );
}
