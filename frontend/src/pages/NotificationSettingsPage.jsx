import { useEffect, useState } from "react";
import { getNotificationSettings, updateNotificationSettings } from "../api/notifications";
import { BackScreen } from "../components/layout/Screen";
import Switch from "../components/Switch";
import "./NotificationSettingsPage.css";

// 설정 > "알림 설정"에서만 진입하는 화면. "알림 기준 설정"(D-1/D-3 토글)만 단독으로 노출한다.
// (기능명세서_최종본.md 2.9절은 원래 알림 목록 화면과 하나로 합쳐져 있으나, 사용자 요청으로 분리)
export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getNotificationSettings().then(setSettings);
  }, []);

  async function toggleSetting(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await updateNotificationSettings({ [key]: next[key] });
  }

  return (
    <BackScreen title="알림 설정">
      {settings && (
        <section className="noti-settings">
          <h2 className="noti-settings__title">알림 기준 설정</h2>
          <div className="noti-settings__row">
            <span>
              <strong>D-1 알림</strong> 전일 오전 알림 받기
            </span>
            <Switch checked={settings.d1_enabled} onChange={() => toggleSetting("d1_enabled")} />
          </div>
          <div className="noti-settings__row">
            <span>
              <strong>D-3 알림</strong> 3일 전 미리 알림 받기
            </span>
            <Switch checked={settings.d3_enabled} onChange={() => toggleSetting("d3_enabled")} />
          </div>
        </section>
      )}
    </BackScreen>
  );
}
