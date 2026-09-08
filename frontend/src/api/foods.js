import { api } from "./client";

export const listFoods = (query) => api.get("/foods", { query });
export const createFood = (payload) => api.post("/foods", payload);
export const getFood = (foodId) => api.get(`/foods/${foodId}`);
export const updateFood = (foodId, payload) => api.patch(`/foods/${foodId}`, payload);
export const deleteFood = (foodId) => api.delete(`/foods/${foodId}`);
export const changeFoodStatus = (foodId, status) => api.patch(`/foods/${foodId}/status`, { status });
export const deleteAllFoods = () => api.delete("/foods", { confirm: true });
export const createSampleFoods = () => api.post("/foods/sample");
export const recommendRecipe = () => api.post("/recipes/recommend");
