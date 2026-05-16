import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ThanhToan } from "../constants/donHang";
import { orderApi } from "../services/orderApi";
import { formatTien } from "../utils/formatTien";
import "../styles/orders.css";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const load = async () => {
      const data = await orderApi.getMine(token);
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <section>
      <h1>Đơn hàng của tôi</h1>
      {loading ? (
        <p>Đang tải đơn hàng…</p>
      ) : orders.length === 0 ? (
        <p>Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <header>
                <h3>{order.orderCode || `Đơn số ${order.id}`}</h3>
                <span className="badge">{order.status}</span>
              </header>
              <p>
                Thanh toán: {order.paymentMethod} —{" "}
                {order.paymentStatus === ThanhToan.da ? "Đã thanh toán" : "Chưa thanh toán"}
              </p>
              <p>Địa chỉ: {order.shippingAddress}</p>
              <p>Đặt lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
              <ul>
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.productName} × {item.quantity} — {formatTien(item.lineTotal || item.unitPrice * item.quantity)}
                  </li>
                ))}
              </ul>
              <strong>Tổng cộng: {formatTien(order.totalAmount)}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default OrdersPage;
