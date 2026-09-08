import { useNavigate } from "react-router-dom";
import "./FAB.css";

// 기능명세서_최종본.md 1.6.4절: 홈/목록 화면 우측 하단 오렌지색 원형 "+" 버튼
export default function FAB() {
  const navigate = useNavigate();
  return (
    <button className="fab" aria-label="음식 등록" onClick={() => navigate("/foods/new")}>
      +
    </button>
  );
}
