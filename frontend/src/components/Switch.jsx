import "./Switch.css";

export default function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={"switch" + (checked ? " switch--on" : "")}
      onClick={() => onChange(!checked)}
    >
      <span className="switch__knob" />
    </button>
  );
}
