import { request } from "./httpClient";

function buildQuery(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.append(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const productApi = {
  /** @param {object} query tham số lọc / phân trang
   * @param {string} [token] gửi kèm khi quản trị để xem cả sản phẩm ngừng bán */
  getProducts: (query, token) =>
    request(`/products${buildQuery(query)}`, token ? { token } : undefined),
  getById: (id, token) => request(`/products/${id}`, token ? { token } : undefined),
  create: (payload, token) =>
    request("/products", {
      method: "POST",
      body: payload,
      token
    }),
  update: (id, payload, token) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: payload,
      token
    }),
  delete: (id, token) =>
    request(`/products/${id}`, {
      method: "DELETE",
      token
    })
};
