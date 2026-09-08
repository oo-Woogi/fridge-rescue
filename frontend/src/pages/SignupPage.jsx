import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import mascotHealth from "../assets/character/health.png";
import Button from "../components/Button";
import TextField from "../components/TextField";
import { BackScreen } from "../components/layout/Screen";
import { useAuth } from "../context/AuthContext";
import "./SignupPage.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// images/와이어프레임/1_회원가입.jpg
export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nicknameValid = nickname.trim().length > 0;
  const emailValid = EMAIL_RE.test(email);
  const passwordValid = PASSWORD_RE.test(password);
  const confirmValid = passwordConfirm.length > 0 && passwordConfirm === password;
  const canSubmit = nicknameValid && emailValid && passwordValid && confirmValid && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await signup({ nickname, email, password, password_confirm: passwordConfirm });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BackScreen title="회원가입">
      <div className="signup-page__hero">
        <div className="signup-page__bubble">
          냉장고 구조대와
          <br />
          함께해요!
        </div>
        <img className="signup-page__mascot" src={mascotHealth} alt="냉장고 마스코트" />
      </div>
      <p className="signup-page__subtitle">
        몇 가지 정보만 입력하면
        <br />
        냉장고 속 음식을 똑똑하게 관리할 수 있어요.
      </p>

      <form className="signup-page__card" onSubmit={handleSubmit}>
        <TextField
          label="닉네임 *"
          placeholder="예: 구조대장냉장고"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <TextField
          label="이메일 *"
          type="email"
          placeholder="이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <TextField
            label="비밀번호 *"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="signup-page__hint">영문, 숫자 포함 8자 이상 입력하세요</p>
        </div>
        <TextField
          label="비밀번호 확인 *"
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={passwordConfirm && !confirmValid ? "비밀번호가 일치하지 않습니다." : ""}
          success={confirmValid}
        />

        {error && <p className="signup-page__error">{error}</p>}

        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "가입 중…" : "가입하고 시작하기 →"}
        </Button>
      </form>

      <p className="signup-page__login-link">
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </BackScreen>
  );
}
