const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5104/api";

function createHeaders(token, hasJsonBody = false) {
  const headers = {};
  if (hasJsonBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function request(path, options = {}) {
  const { token, body, method = "GET" } = options;
  const hasBody = body !== undefined && body !== null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: createHeaders(token, hasBody),
    body: hasBody ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let message = "Yêu cầu không thực hiện được.";
    try {
      const errorData = await response.json();
      if (typeof errorData === "string") {
        message = errorData;
      } else if (errorData.errors) {
        const firstKey = Object.keys(errorData.errors)[0];
        const firstMsg = errorData.errors[firstKey]?.[0];
        message = firstMsg || errorData.title || message;
      } else {
        message = errorData.detail || errorData.title || message;
      }
    } catch {
      /* bỏ qua */
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}
