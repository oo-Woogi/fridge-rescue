import "./Badge.css";

// 기능명세서_최종본.md 3.3절 상태 산정 로직을 그대로 따른다.
function toneFor(dDay) {
  if (dDay < 0) return "expired";
  if (dDay <= 1) return "danger";
  if (dDay <= 3) return "warning";
  return "success";
}

export default function Badge({ dDay, badge, showDangerSuffix = false }) {
  const tone = toneFor(dDay);
  const label = tone === "danger" && showDangerSuffix ? `${badge} · 위험해요` : badge;
  return <span className={`badge badge--${tone}`}>{label}</span>;
}
