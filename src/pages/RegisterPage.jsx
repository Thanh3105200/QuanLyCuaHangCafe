import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={onSubmit}>
        <h1>Đăng ký</h1>
        <label>Họ và tên</label>
        <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} required />
        <label>Thư điện tử</label>
        <input type="text" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        <label>Mật khẩu</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={loading} type="submit">
          {loading ? "Đang xử lý…" : "Đăng ký"}
        </button>
        <p>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
