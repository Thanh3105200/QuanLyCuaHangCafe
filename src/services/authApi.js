import { request } from "./httpClient";

export const authApi = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: payload
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: payload
    }),
  getProfile: (token) =>
    request("/auth/me", {
      token
    })
};
