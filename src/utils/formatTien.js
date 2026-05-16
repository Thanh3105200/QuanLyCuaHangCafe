/** Định dạng số tiền hiển thị tiếng Việt */
export function formatTien(so) {
  return `${Number(so).toLocaleString("vi-VN")} đ`;
}
