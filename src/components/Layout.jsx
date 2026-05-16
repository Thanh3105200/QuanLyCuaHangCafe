import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/layout.css";

function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const id = location.hash.slice(1);
    const element = document.getElementById(id);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.pathname, location.hash]);

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">
          <span className="brand__icon" aria-hidden>
            ☕
          </span>
          <span className="brand__text">Cà Phê Ngon</span>
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Trang chủ
          </NavLink>
          <Link to={{ pathname: "/", hash: "menu-section" }}>Menu</Link>
          <Link to={{ pathname: "/", hash: "gioi-thieu" }}>Giới thiệu</Link>
          <Link to={{ pathname: "/", hash: "danh-gia" }}>Đánh giá</Link>
          <Link to={{ pathname: "/", hash: "lien-he" }}>Liên hệ</Link>
          {isAuthenticated && <NavLink to="/cart">Giỏ hàng</NavLink>}
          {isAuthenticated && <NavLink to="/orders">Hóa đơn</NavLink>}
          {user?.role === "Admin" && <NavLink to="/admin/products">Quản lý sản phẩm</NavLink>}
          {user?.role === "Admin" && <NavLink to="/admin/orders">Quản lý đơn</NavLink>}
          {user?.role === "Admin" && <NavLink to="/admin/users">Người dùng</NavLink>}
          {user?.role === "Admin" && <NavLink to="/admin/stats">Thống kê</NavLink>}
        </nav>
        <div className="auth-actions">
          {isAuthenticated ? (
            <>
              <span className="user-pill" title={user?.fullName}>
                {user?.fullName}
              </span>
              <Link to="/cart" className="cart-fab" aria-label="Giỏ hàng" title="Giỏ hàng">
                🛒
              </Link>
              <button type="button" onClick={logout} className="btn btn-outline">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
