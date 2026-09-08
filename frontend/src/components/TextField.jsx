import { useState } from "react";
import "./TextField.css";

export default function TextField({ label, error, success, type = "text", rightSlot, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <div className="text-field">
      {label && <label className="text-field__label">{label}</label>}
      <div className={`text-field__box${error ? " text-field__box--error" : ""}${success ? " text-field__box--success" : ""}`}>
        <input className="text-field__input" type={resolvedType} {...props} />
        {isPassword && (
          <button
            type="button"
            className="text-field__eye"
            aria-label="비밀번호 표시 전환"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        )}
        {!isPassword && rightSlot}
      </div>
      {error && <p className="text-field__error">{error}</p>}
    </div>
  );
}
