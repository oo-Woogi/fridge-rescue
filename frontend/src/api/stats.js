import { api } from "./client";

export const fetchStats = (period) => api.get("/stats", { query: { period } });
