import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { cartApi } from "../services/cartApi";
import { productApi } from "../services/productApi";
import { diaChiAnhMinhHoa } from "../utils/anhMinhHoa";
import { formatTien } from "../utils/formatTien";
import "../styles/product-detail.css";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await productApi.getById(id, token);
        setProduct(data);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  const addToCart = async () => {
    if (!isAuthenticated) {
      setMessage("Vui lòng đăng nhập để thêm vào giỏ hàng.");
      navigate("/login");
      return;
    }

    try {
      await cartApi.addItem({ productId: Number(id), quantity: 1 }, token);
      setMessage("Đã thêm vào giỏ hàng.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <p>Đang tải chi tiết sản phẩm…</p>;
  if (!product) return <p>Không tìm thấy sản phẩm.</p>;

  return (
    <section className="product-detail">
      <Link to="/" className="back-link">
        ← Quay lại danh sách sản phẩm
      </Link>
      {message && <p className="info">{message}</p>}
      <div className="product-detail__card">
        <img src={product.imageUrl || diaChiAnhMinhHoa(800, 520)} alt={product.name} />
        <div className="product-detail__content">
          <p className="category">{product.categoryName}</p>
          <h1>{product.name}</h1>
          <p>{product.description || "Sản phẩm được phục vụ với công thức đặc biệt của quán."}</p>
          <h2>{formatTien(product.price)}</h2>
          {!product.isAvailable && user?.role === "Admin" && (
            <p className="info">Sản phẩm đang ngừng bán — khách không thấy trên trang sản phẩm.</p>
          )}
          <div className="detail-actions">
            <button type="button" className="btn" onClick={addToCart} disabled={!product.isAvailable}>
              Thêm vào giỏ hàng
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/cart")}>
              Đi tới giỏ hàng
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetailPage;
