import "./DonutChart.css";

// segments: [{ value, color }], value는 0~100 퍼센트 합계 기준
export default function DonutChart({ segments, centerLabel, centerValue }) {
  let acc = 0;
  const stops = segments
    .map((seg) => {
      const start = acc;
      acc += seg.value;
      return `${seg.color} ${start}% ${acc}%`;
    })
    .join(", ");

  return (
    <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
      <div className="donut__hole">
        <span className="donut__value">{centerValue}</span>
        <span className="donut__label">{centerLabel}</span>
      </div>
    </div>
  );
}
