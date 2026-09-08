import "./Stepper.css";

export default function Stepper({ value, onChange, min = 1 }) {
  return (
    <div className="stepper">
      <button type="button" className="stepper__btn" onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <span className="stepper__value">{value}</span>
      <button type="button" className="stepper__btn" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
