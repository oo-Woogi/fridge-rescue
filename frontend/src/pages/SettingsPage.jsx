import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSampleFoods, deleteAllFoods } from "../api/foods";
import mascotSetting from "../assets/character/setting.png";
import Button from "../components/Button";
import ConfirmModal from "../components/ConfirmModal";
import { TabScreen } from "../components/layout/Screen";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./SettingsPage.css";

function MenuRow({ label, value, danger, onClick }) {
  return (
    <button className={"settings-menu__row" + (danger ? " settings-menu__row--danger" : "")} onClick={onClick}>
      <span>{label}</span>
      <span className="settings-menu__row-right">
        {value && <span className="settings-menu__value">{value}</span>}
        <span>›</span>
      </span>
    </button>
  );
}

// images/와이어프레임/10_설정.jpg
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function handleAddSampleData() {
    try {
      const res = await createSampleFoods();
      showToast(`샘플 음식 ${res.created_count}개를 추가했어요`);
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeleteAll() {
    try {
      await deleteAllFoods();
      showToast("전체 음식 데이터를 삭제했어요");
    } catch (err) {
      showToast(err.message);
    } finally {
      setConfirmDeleteAll(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <TabScreen title="설정">
      <div className="settings-hero">
        <div>
          <h1 className="settings-hero__title">설정</h1>
          <p className="settings-hero__subtitle">
            나에게 맞는 방식으로
            <br />
            냉장고 구조대를 이용해보세요
          </p>
        </div>
        <div className="settings-hero__mascot-wrap">
          <div className="settings-hero__bubble">편하게 맞춰봐요</div>
          <img className="settings-hero__mascot" src={mascotSetting} alt="설정 마스코트" />
        </div>
      </div>

      <section className="settings-group">
        <h2 className="settings-group__title">사용자 설정</h2>
        <div className="settings-menu">
          <MenuRow label="닉네임 수정" value={user?.nickname} onClick={() => navigate("/settings/profile")} />
          <MenuRow label="알림 설정" onClick={() => navigate("/notifications")} />
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group__title">데이터 관리</h2>
        <div className="settings-menu">
          <MenuRow label="샘플 데이터 추가" onClick={handleAddSampleData} />
          <MenuRow label="전체 데이터 삭제" danger onClick={() => setConfirmDeleteAll(true)} />
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group__title">서비스 정보</h2>
        <div className="settings-menu">
          <MenuRow label="프로젝트 소개" onClick={() => showToast("냉장고 구조대 팀이 만든 서비스예요 🍃")} />
          <MenuRow label="문의" onClick={() => navigate("/settings/faq")} />
        </div>
      </section>

      <Button variant="secondary" onClick={() => setConfirmLogout(true)}>
        로그아웃
      </Button>

      <div className="settings-footer-banner">
        <div className="settings-footer-banner__title">냉장고 속 작은 실천이</div>
        <div className="settings-footer-banner__subtitle">더 나은 지구를 만듭니다</div>
      </div>

      <ConfirmModal
        open={confirmDeleteAll}
        title="전체 데이터를 삭제할까요?"
        description="냉장고에 등록된 모든 음식 데이터가 삭제되며, 삭제 후에는 되돌릴 수 없어요."
        confirmLabel="삭제하기"
        onCancel={() => setConfirmDeleteAll(false)}
        onConfirm={handleDeleteAll}
      />

      <ConfirmModal
        open={confirmLogout}
        danger={false}
        title="로그아웃할까요?"
        description="다시 로그인하려면 이메일과 비밀번호가 필요해요."
        confirmLabel="로그아웃"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </TabScreen>
  );
}
