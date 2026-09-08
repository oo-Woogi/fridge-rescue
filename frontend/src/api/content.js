import { api } from "./client";

export const fetchRandomTip = () => api.get("/storage-tips/random");
export const fetchFaqs = () => api.get("/faqs", { auth: false });
