import "./PillGroup.css";

export default function PillGroup({ options, value, onChange }) {
  return (
    <div className="pill-group">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          className={"pill" + (value === opt ? " pill--active" : "")}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
