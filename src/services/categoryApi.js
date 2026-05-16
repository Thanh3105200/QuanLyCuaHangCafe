import { request } from "./httpClient";

export const categoryApi = {
  getAll: () => request("/categories")
};
