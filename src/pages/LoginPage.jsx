import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={onSubmit}>
        <h1>Đăng nhập</h1>
        <label>Thư điện tử</label>
        <input
          type="text"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <label>Mật khẩu</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={loading} type="submit">
          {loading ? "Đang xử lý…" : "Đăng nhập"}
        </button>
        <p>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
