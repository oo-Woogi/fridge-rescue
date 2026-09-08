import { api } from "./client";

export const listNotifications = (query) => api.get("/notifications", { query });
export const getNotificationSettings = () => api.get("/notification-settings");
export const updateNotificationSettings = (payload) => api.patch("/notification-settings", payload);
