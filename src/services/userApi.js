import { request } from "./httpClient";

export const userApi = {
  getAll: (token) =>
    request("/admin/users", {
      token
    }),
  updateRole: (id, payload, token) =>
    request(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: payload,
      token
    }),
  updateActive: (id, payload, token) =>
    request(`/admin/users/${id}/active`, {
      method: "PATCH",
      body: payload,
      token
    })
};
