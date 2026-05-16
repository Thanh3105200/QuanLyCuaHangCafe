import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ThanhToan } from "../constants/donHang";
import { cartApi } from "../services/cartApi";
import { orderApi } from "../services/orderApi";
import { formatTien } from "../utils/formatTien";
import "../styles/cart.css";

function CartPage() {
  const [items, setItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(ThanhToan.khiNhanHang);
  const [message, setMessage] = useState("");
  const { token } = useAuth();
  const navigate = useNavigate();

  const loadCart = async () => {
    const data = await cartApi.getMyCart(token);
    setItems(data || []);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.lineTotal, 0), [items]);

  const updateQty = async (id, quantity) => {
    if (quantity <= 0) return;
    await cartApi.updateItem(id, { quantity }, token);
    loadCart();
  };

  const removeItem = async (id) => {
    await cartApi.deleteItem(id, token);
    loadCart();
  };

  const placeOrder = async () => {
    if (shippingAddress.trim().length < 10) {
      setMessage("Địa chỉ giao hàng cần ít nhất 10 ký tự.");
      return;
    }

    try {
      await orderApi.create({ shippingAddress, paymentMethod }, token);
      setMessage("Đặt hàng thành công.");
      setShippingAddress("");
      setPaymentMethod(ThanhToan.khiNhanHang);
      await loadCart();
      navigate("/orders");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section>
      <h1>Giỏ hàng</h1>
      {message && <p className="info">{message}</p>}
      {items.length === 0 ? (
        <p>Chưa có sản phẩm trong giỏ hàng.</p>
      ) : (
        <div className="cart-list">
          {items.map((item) => (
            <div className="cart-item" key={item.id}>
              <div>
                <h3>{item.productName}</h3>
                <p>{formatTien(item.unitPrice)}</p>
              </div>
              <div className="cart-actions">
                <input type="number" min={1} value={item.quantity} onChange={(e) => updateQty(item.id, Number(e.target.value))} />
                <strong>{formatTien(item.lineTotal)}</strong>
                <button type="button" className="btn btn-outline" onClick={() => removeItem(item.id)}>
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="checkout-box">
        <h2>Tổng cộng: {formatTien(total)}</h2>
        <label>Địa chỉ giao hàng</label>
        <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows={3} />
        <label>Phương thức thanh toán</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value={ThanhToan.khiNhanHang}>{ThanhToan.khiNhanHang}</option>
          <option value={ThanhToan.trucTuyen}>{ThanhToan.trucTuyen}</option>
        </select>
        <button type="button" className="btn" onClick={placeOrder} disabled={items.length === 0}>
          Đặt hàng và thanh toán
        </button>
      </div>
    </section>
  );
}

export default CartPage;
