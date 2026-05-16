import { useEffect, useMemo, useState } from "react";
import { ThanhToan, TrangThaiDon } from "../constants/donHang";
import { useAuth } from "../context/AuthContext";
import { orderApi } from "../services/orderApi";
import "../styles/admin-ops.css";

const CAC_TRANG_THAI_DON = Object.values(TrangThaiDon);
const CAC_TRANG_THAI_TT = [ThanhToan.chua, ThanhToan.da];

function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAll(token);
      setOrders(data || []);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const orderSummary = useMemo(() => {
    return {
      total: orders.length,
      paid: orders.filter((x) => x.paymentStatus === ThanhToan.da).length
    };
  }, [orders]);

  const updateStatus = async (orderId, status) => {
    await orderApi.updateStatus(orderId, { status }, token);
    await loadOrders();
  };

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    await orderApi.updatePaymentStatus(orderId, { paymentStatus }, token);
    await loadOrders();
  };

  const printInvoice = (order) => {
    const dongTien = (n) => `${Number(n).toLocaleString("vi-VN")} đ`;
    const html = `
      <html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${order.orderCode}</title></head><body>
      <h2>Hóa đơn ${order.orderCode}</h2>
      <p>Khách hàng: ${order.customer?.fullName || ""} (${order.customer?.email || ""})</p>
      <p>Ngày đặt: ${new Date(order.createdAt).toLocaleString("vi-VN")}</p>
      <p>Địa chỉ: ${order.shippingAddress}</p>
      <p>Trạng thái giao: ${order.status}</p>
      <p>Thanh toán: ${order.paymentMethod} — ${order.paymentStatus}</p>
      <ul>${order.items.map((item) => `<li>${item.productName} × ${item.quantity} = ${dongTien(item.lineTotal || item.unitPrice * item.quantity)}</li>`).join("")}</ul>
      <h3>Tổng cộng: ${dongTien(order.totalAmount)}</h3>
      </body></html>
    `;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const buildQrUrl = (order) => {
    const payload = `Mã đơn:${order.orderCode}|Tổng tiền:${order.totalAmount}|Hình thức:${order.paymentMethod}|Tình trạng thanh toán:${order.paymentStatus}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(payload)}`;
  };

  return (
    <section className="admin-ops">
      <h1>Quản lý đơn hàng</h1>
      <div className="admin-ops__stats">
        <article>
          <h4>Tổng số đơn</h4>
          <strong>{orderSummary.total}</strong>
        </article>
        <article>
          <h4>Đã thanh toán</h4>
          <strong>{orderSummary.paid}</strong>
        </article>
      </div>
      {message && <p className="error-banner">{message}</p>}
      {loading ? (
        <p>Đang tải…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Người đặt</th>
              <th>Thời gian</th>
              <th>Sản phẩm</th>
              <th>Trạng thái giao</th>
              <th>Thanh toán</th>
              <th>Hóa đơn / mã</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderCode}</td>
                <td>
                  {order.customer?.fullName}
                  <br />
                  {order.customer?.email}
                </td>
                <td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                <td>
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.productId}`}>
                      {item.productName} × {item.quantity}
                    </div>
                  ))}
                </td>
                <td>
                  <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                    {CAC_TRANG_THAI_DON.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div>{order.paymentMethod}</div>
                  <select value={order.paymentStatus} onChange={(e) => updatePaymentStatus(order.id, e.target.value)}>
                    {CAC_TRANG_THAI_TT.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" className="btn btn-outline" onClick={() => printInvoice(order)}>
                    In hóa đơn
                  </button>
                  <img className="qr-image" src={buildQrUrl(order)} alt={`Mã cho đơn ${order.orderCode}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default AdminOrdersPage;
