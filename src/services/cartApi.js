import { request } from "./httpClient";

export const cartApi = {
  getMyCart: (token) => request("/cart", { token }),
  addItem: (payload, token) =>
    request("/cart/items", {
      method: "POST",
      body: payload,
      token
    }),
  updateItem: (id, payload, token) =>
    request(`/cart/items/${id}`, {
      method: "PUT",
      body: payload,
      token
    }),
  deleteItem: (id, token) =>
    request(`/cart/items/${id}`, {
      method: "DELETE",
      token
    }),
  clear: (token) =>
    request("/cart/clear", {
      method: "DELETE",
      token
    })
};
