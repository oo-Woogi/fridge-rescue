import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateMe } from "../api/auth";
import mascotSetting from "../assets/character/setting.png";
import Button from "../components/Button";
import TextField from "../components/TextField";
import { BackScreen } from "../components/layout/Screen";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./SettingsProfilePage.css";

// images/와이어프레임/11_설정_회원정보수정.jpg (화면 타이틀은 "계정 설정")
export default function SettingsProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = nickname.trim().length > 0 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = { nickname: nickname.trim() };
      if (currentPassword || newPassword || newPasswordConfirm) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
        payload.new_password_confirm = newPasswordConfirm;
      }
      const updated = await updateMe(payload);
      updateUser({ nickname: updated.nickname });
      showToast("변경사항을 저장했어요");
      navigate("/settings", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BackScreen title="계정 설정" right={<img className="settings-profile__header-mascot" src={mascotSetting} alt="" />}>
      <form className="settings-profile__card" onSubmit={handleSubmit}>
        <div className="settings-profile__section">
          <p className="settings-profile__section-title">👤 닉네임</p>
          <TextField label="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>

        <hr className="settings-profile__divider" />

        <div className="settings-profile__section">
          <p className="settings-profile__section-title">🔒 비밀번호 변경</p>
          <TextField
            type="password"
            placeholder="현재 비밀번호를 입력하세요"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <div className="settings-profile__new-password-group">
            <div>
              <TextField
                type="password"
                placeholder="새 비밀번호를 입력하세요"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="field-hint">영문, 숫자 포함 8자 이상 입력하세요</p>
            </div>
            <TextField
              type="password"
              placeholder="새 비밀번호를 다시 입력하세요"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="settings-profile__error">{error}</p>}

        <Button type="submit" disabled={!canSubmit}>
          {submitting ? "저장 중…" : "변경사항 저장하기 →"}
        </Button>
      </form>
    </BackScreen>
  );
}
