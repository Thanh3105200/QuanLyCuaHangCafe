import { Link } from "react-router-dom";
import { diaChiAnhMinhHoa } from "../utils/anhMinhHoa";
import { formatTien } from "../utils/formatTien";
import "../styles/product-card.css";

function ProductCard({ product, onAddToCart, canAddToCart }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card__image-link">
        <img src={product.imageUrl || diaChiAnhMinhHoa(400, 280)} alt={product.name} />
      </Link>
      <div className="product-card__body">
        <Link to={`/products/${product.id}`} className="product-card__title">
          <h3>{product.name}</h3>
        </Link>
        <p>{product.description || "Đồ uống chất lượng, phục vụ tận tâm."}</p>
        <div className="product-card__footer">
          <strong>{formatTien(product.price)}</strong>
          <button type="button" className="btn" onClick={() => onAddToCart(product)}>
            Thêm vào giỏ
          </button>
        </div>
        {!canAddToCart && <small>Đăng nhập để thêm vào giỏ hàng</small>}
      </div>
    </article>
  );
}

export default ProductCard;
