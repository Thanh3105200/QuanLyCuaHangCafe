import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { cartApi } from "../services/cartApi";
import { categoryApi } from "../services/categoryApi";
import { productApi } from "../services/productApi";
import "../styles/products.css";

const ABOUT_HIGHLIGHTS = [
  {
    title: "Hạt chọn lọc",
    text: "Cà phê rang xay từ vùng trồng uy tín, giữ trọn vị chocolate và caramel tự nhiên.",
  },
  {
    title: "Pha chế tỉ mỉ",
    text: "Mỗi ly đều được đong đếm nhiệt độ, thời gian chiết để bạn cảm nhận rõ từng lớp hương.",
  },
  {
    title: "Phục vụ tận tâm",
    text: "Đội ngũ barista thân thiện, sẵn sàng tư vấn gu uống — từ espresso đậm đến cold brew mát lạnh.",
  },
];

const CONTACT_LINES = [
  {
    icon: "📍",
    label: "Địa chỉ",
    value: "123 Đường Nguyễn Trãi, phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh",
    href:
      "https://www.google.com/maps/search/?api=1&query=123+%C4%90%C6%B0%E1%BB%9Dng+Nguy%E1%BB%85n+Tr%C3%A3i+Qu%E1%BA%ADn+1+TP+H%E1%BB%93+Ch%C3%AD+Minh",
  },
  {
    icon: "📞",
    label: "Hotline",
    value: "028 3822 7788 — 0977 886 889",
    href: "tel:+84977886889",
  },
  {
    icon: "📧",
    label: "Email",
    value: "lienhe@caphengon.vn",
    href: "mailto:lienhe@caphengon.vn",
  },
  {
    icon: "🕘",
    label: "Giờ mở cửa",
    value: "Thứ 2 — Chủ nhật: 7h00 — 22h30 (Không nghỉ trưa)",
  },
];

const CUSTOMER_REVIEWS = [
  {
    name: "Minh Anh",
    note: "Thường xuyên mua takeaway",
    rating: 5,
    quote:
      "Cold brew ở đây trong veo, không gắt. Nhân viên nhớ gu của mình sau vài lần ghé — cảm giác như quen lâu rồi.",
  },
  {
    name: "Quốc Huy",
    note: "Làm việc tại khu vực",
    rating: 5,
    quote:
      "Espresso êm mà không chua lạ. Không gian yên để làm việc buổi sáng; wifi ổn, ổ cắm đủ dùng.",
  },
  {
    name: "Thu Hà",
    note: "Đặt giao hàng",
    rating: 4,
    quote:
      "Trà sữa kem muối vừa miệng, đóng gói kỹ đến nơi còn nguyên bọc giữ nhiệt. Sẽ quay lại dùng thêm topping.",
  },
];

function StarRow({ rating }) {
  const full = Math.round(rating);
  return (
    <span className="review-stars" aria-label={`${rating} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n}>{n <= full ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState({ search: "", categoryId: "", page: 1, pageSize: 8 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch((e) => setMessage(e.message));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await productApi.getProducts(query);
        setProducts(data.items || []);
        setPagination({ page: data.page, totalPages: data.totalPages });
      } catch (e) {
        setMessage(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query.page, query.pageSize, query.search, query.categoryId]);

  const onAddToCart = async (product) => {
    if (!isAuthenticated) {
      setMessage("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return;
    }

    try {
      await cartApi.addItem({ productId: product.id, quantity: 1 }, token);
      setMessage("Đã thêm vào giỏ hàng.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section className="products-page">
      <div className="products-hero">
        <div className="products-hero__text">
          <h1>Chào mừng đến với Cà Phê Ngon</h1>
          <p>
            Khám phá hương vị cà phê đích thực, được chọn lọc từ những hạt cà phê tốt nhất — cùng
            trà, đồ uống tươi mỗi ngày.
          </p>
          <a href="#menu-section" className="btn products-hero__cta">
            Xem Menu
          </a>
        </div>
        <div className="products-hero__visual" aria-hidden />
      </div>

      <section className="home-about anchor-section" id="gioi-thieu" aria-labelledby="gioi-thieu-heading">
        <div className="home-about__inner">
          <div className="home-about__intro">
            <h2 id="gioi-thieu-heading">Giới thiệu Cà Phê Ngon</h2>
            <p className="home-about__lead">
              Chúng tôi bắt đầu từ niềm yêu với tách cà phê chuẩn vị — nơi mỗi khách không chỉ uống mà còn cảm nhận
              được câu chuyện của hạt, khói rang và bàn tay pha chế.
            </p>
            <p>
              Từ ly đen đá truyền thống đến các món sáng tạo, Cà Phê Ngon chọn nguyên liệu tươi, hợp tác trực tiếp với
              nông hộ và xưởng rang địa phương để giữ trọn hương đặc trưng. Bạn có thể ghé trực tiếp, đặt mang đi hoặc
              giao tận nơi — luôn với tiêu chí: nóng đúng nhiệt, lạnh đủ thời gian ủ, vệ sinh và minh bạch nguồn gốc.
            </p>
          </div>
          <ul className="home-about__highlights">
            {ABOUT_HIGHLIGHTS.map((item) => (
              <li key={item.title} className="home-about__card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <h2 className="home-menu-title anchor-section" id="menu-section">
        Menu &amp; sản phẩm
      </h2>

      <div className="toolbar">
        <input
          placeholder="Tìm theo tên sản phẩm…"
          value={query.search}
          onChange={(e) => setQuery((p) => ({ ...p, search: e.target.value, page: 1 }))}
        />
        <select value={query.categoryId} onChange={(e) => setQuery((p) => ({ ...p, categoryId: e.target.value, page: 1 }))}>
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {message && <p className="info">{message}</p>}
      {loading ? (
        <p>Đang tải sản phẩm…</p>
      ) : (
        <div className="grid-products">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} canAddToCart={isAuthenticated} />
          ))}
        </div>
      )}
      <div className="pagination">
        <button type="button" className="btn btn-outline" disabled={pagination.page <= 1} onClick={() => setQuery((p) => ({ ...p, page: p.page - 1 }))}>
          Trước
        </button>
        <span>
          Trang {pagination.page}/{pagination.totalPages}
        </span>
        <button
          type="button"
          className="btn btn-outline"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => setQuery((p) => ({ ...p, page: p.page + 1 }))}
        >
          Sau
        </button>
      </div>

      <section className="home-reviews anchor-section" id="danh-gia" aria-labelledby="danh-gia-heading">
        <header className="home-reviews__header">
          <h2 id="danh-gia-heading">Đánh giá khách hàng</h2>
          <p className="home-reviews__sub">Ý kiến thật từ những người đã ghé và đặt đồ uống tại Cà Phê Ngon.</p>
        </header>
        <ul className="home-reviews__grid">
          {CUSTOMER_REVIEWS.map((r) => (
            <li key={r.name} className="home-reviews__card">
              <StarRow rating={r.rating} />
              <blockquote className="home-reviews__quote">&ldquo;{r.quote}&rdquo;</blockquote>
              <footer>
                <strong className="home-reviews__name">{r.name}</strong>
                <span className="home-reviews__note">{r.note}</span>
              </footer>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-contact anchor-section" id="lien-he" aria-labelledby="lien-he-heading">
        <header className="home-contact__header">
          <h2 id="lien-he-heading">Liên hệ</h2>
          <p className="home-contact__sub">
            Ghé cửa hàng, gọi hotline hoặc gửi email — đội ngũ Cà Phê Ngon sẽ phản hồi trong giờ hành chính và khi có
            ca trực tối.
          </p>
        </header>
        <div className="home-contact__layout">
          <dl className="home-contact__list">
            {CONTACT_LINES.map((row) => (
              <div key={row.label} className="home-contact__row">
                <dt>
                  <span className="home-contact__icon" aria-hidden>
                    {row.icon}
                  </span>
                  {row.label}
                </dt>
                <dd>
                  {row.href ? (
                    <a href={row.href} target={row.href.startsWith("http") ? "_blank" : undefined} rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="home-contact__map-card">
            <div className="home-contact__map-visual" aria-hidden />
            <p className="home-contact__map-text">Đỗ xe máy và xe đạp phía sau cửa hàng.</p>
            <a className="btn home-contact__map-btn" href={CONTACT_LINES[0].href} target="_blank" rel="noopener noreferrer">
              Chỉ đường trên Maps
            </a>
          </div>
        </div>
      </section>
    </section>
  );
}

export default ProductsPage;
