import { request } from "./httpClient";

export const orderApi = {
  create: (payload, token) =>
    request("/orders", {
      method: "POST",
      body: payload,
      token
    }),
  getMine: (token) =>
    request("/orders/my", {
      token
    }),
  getAll: (token) =>
    request("/orders", {
      token
    }),
  updateStatus: (id, payload, token) =>
    request(`/orders/${id}/status`, {
      method: "PATCH",
      body: payload,
      token
    }),
  updatePaymentStatus: (id, payload, token) =>
    request(`/orders/${id}/payment-status`, {
      method: "PATCH",
      body: payload,
      token
    }),
  getStats: (queryString, token) =>
    request(`/orders/stats${queryString ? `?${queryString}` : ""}`, {
      token
    }),
  getTopProducts: (queryString, token) =>
    request(`/orders/top-products${queryString ? `?${queryString}` : ""}`, {
      token
    })
};
