import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import mascotMain from "../assets/character/main.png";
import Button from "../components/Button";
import TextField from "../components/TextField";
import { BRAND } from "../config/copy";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// images/와이어프레임/0_로그인.jpg
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const canSubmit = emailValid && password.length > 0 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password, remember_me: rememberMe });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.code === "INVALID_CREDENTIALS" ? err.message : "네트워크 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__brand">
        <span className="login-page__leaf">🍃</span>
        <div>
          <div className="login-page__brand-ko">{BRAND.nameKo}</div>
          <div className="login-page__brand-en">{BRAND.nameEn}</div>
        </div>
      </div>

      <div className="login-page__hero">
        <div className="login-page__bubble">
          {BRAND.slogan.split("\n").map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <img className="login-page__mascot" src={mascotMain} alt="냉장고 마스코트" />
      </div>

      <h1 className="login-page__title">로그인</h1>
      <p className="login-page__subtitle">
        냉장고 속 음식을 똑똑하게 관리하고
        <br />
        음식물 쓰레기를 줄여보세요.
      </p>

      <form className="login-page__card" onSubmit={handleSubmit}>
        <TextField
          type="email"
          placeholder="이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <TextField
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="login-page__error">{error}</p>}

        <label className="login-page__remember">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          로그인 상태 유지
        </label>

        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "로그인 중…" : "로그인하기 →"}
        </Button>

        <p className="login-page__signup-link">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </form>

      <div className="login-page__footer">
        <div>
          <div className="login-page__footer-title">냉장고 속 작은 변화가</div>
          <div className="login-page__footer-subtitle">더 나은 지구를 만듭니다</div>
        </div>
      </div>
    </div>
  );
}
