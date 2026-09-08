import { useEffect, useState } from "react";
import { fetchFaqs } from "../api/content";
import mascotSearch from "../assets/character/stat.png";
import { BackScreen } from "../components/layout/Screen";
import "./FaqPage.css";

// images/와이어프레임/13_설정_문의.jpg
export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [contactEmail, setContactEmail] = useState("");
  const [openIds, setOpenIds] = useState(new Set());

  useEffect(() => {
    fetchFaqs().then((res) => {
      setFaqs(res.items);
      setContactEmail(res.contact_email);
      // 목업상 1~4번 문항은 기본적으로 펼쳐진 상태로 노출된다.
      setOpenIds(new Set(res.items.filter((f) => f.answer).map((f) => f.faq_id)));
    });
  }, []);

  function toggle(faqId) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(faqId)) next.delete(faqId);
      else next.add(faqId);
      return next;
    });
  }

  return (
    <BackScreen title="문의 / FAQ">
      <div className="faq-hero">
        <div>
          <h1 className="faq-hero__title">자주 묻는 질문</h1>
          <p className="faq-hero__subtitle">
            궁금한 점을 빠르게 찾아보세요.
            <br />
            원하는 답을 못 찾으면 문의해주세요!
          </p>
        </div>
        <img className="faq-hero__mascot" src={mascotSearch} alt="문의 마스코트" />
      </div>

      <div className="faq-list">
        {faqs.map((faq) => {
          const isOpen = openIds.has(faq.faq_id);
          return (
            <div className="faq-item" key={faq.faq_id}>
              <button className="faq-item__question" onClick={() => toggle(faq.faq_id)}>
                <span className="faq-item__q-badge">Q</span>
                <span className="faq-item__q-text">{faq.question}</span>
                <span>{isOpen ? "⌃" : "⌄"}</span>
              </button>
              {isOpen && <p className="faq-item__answer">{faq.answer || "답변을 준비 중이에요. 곧 안내해드릴게요!"}</p>}
            </div>
          );
        })}
      </div>

      <div className="faq-footer">
        <p className="faq-footer__title">더 궁금한 점이 있으신가요?</p>
        <p className="faq-footer__desc">{contactEmail} 로 문의해주세요</p>
      </div>
    </BackScreen>
  );
}
