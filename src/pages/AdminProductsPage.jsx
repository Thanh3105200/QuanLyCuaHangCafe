import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { categoryApi } from "../services/categoryApi";
import { productApi } from "../services/productApi";
import { formatTien } from "../utils/formatTien";
import "../styles/admin-products.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  isAvailable: true,
  categoryId: ""
};

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("tatca");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState("");
  const { token } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [productData, categoryData] = await Promise.all([
        productApi.getProducts({ page: 1, pageSize: 100 }, token),
        categoryApi.getAll()
      ]);
      setProducts(productData.items || []);
      setCategories(categoryData || []);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Không tải được dữ liệu." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryNameMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchKeyword = product.name.toLowerCase().includes(keyword.trim().toLowerCase());
      const matchCategory = !categoryFilter || String(product.categoryId) === categoryFilter;
      const matchAvailability =
        availabilityFilter === "tatca" ||
        (availabilityFilter === "dangban" && product.isAvailable) ||
        (availabilityFilter === "ngungban" && !product.isAvailable);
      return matchKeyword && matchCategory && matchAvailability;
    });
  }, [products, keyword, categoryFilter, availabilityFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((product) => product.isAvailable).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  }, [products]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImagePreview("");
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    const payload = {
      ...form,
      price: Number(form.price),
      categoryId: Number(form.categoryId)
    };

    try {
      if (editingId) {
        await productApi.update(editingId, payload, token);
        setMessage({ type: "success", text: "Cập nhật sản phẩm thành công." });
      } else {
        await productApi.create(payload, token);
        setMessage({ type: "success", text: "Tạo sản phẩm thành công." });
      }
      resetForm();
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Thao tác thất bại." });
    }
  };

  const deleteProduct = async (id) => {
    const accepted = window.confirm(
      "Bạn có chắc không? Nếu sản phẩm đã từng có trong giỏ hoặc đơn hàng, hệ thống sẽ chuyển sang ngừng bán thay vì xóa hẳn."
    );
    if (!accepted) return;
    try {
      const ketQua = await productApi.delete(id, token);
      if (ketQua?.ngungBan) {
        setMessage({ type: "success", text: ketQua.thongBao || "Đã chuyển sản phẩm sang ngừng bán." });
      } else {
        setMessage({ type: "success", text: "Đã xóa sản phẩm." });
      }
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Thao tác thất bại." });
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || 0,
      imageUrl: product.imageUrl || "",
      isAvailable: Boolean(product.isAvailable),
      categoryId: String(product.categoryId || "")
    });
    setImagePreview(product.imageUrl || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, imageUrl: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <h1>Quản lý sản phẩm</h1>
          <p>Thêm mới, cập nhật, lọc và quản lý danh sách sản phẩm.</p>
        </div>
      </div>

      <div className="admin-stats">
        <article>
          <h4>Tổng sản phẩm</h4>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <h4>Đang bán</h4>
          <strong>{stats.available}</strong>
        </article>
        <article>
          <h4>Ngừng bán</h4>
          <strong>{stats.unavailable}</strong>
        </article>
      </div>

      {message.text && (
        <p className={message.type === "error" ? "error-banner" : "success-banner"}>{message.text}</p>
      )}

      <form className="admin-form" onSubmit={submitProduct}>
        <div className="admin-form__title">
          <h3>{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Hủy sửa
            </button>
          )}
        </div>
        <div className="admin-form__grid">
          <input
            placeholder="Tên sản phẩm"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <input
            placeholder="Giá (đồng)"
            type="number"
            min={1000}
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            required
          />
        </div>
        <div className="admin-form__grid">
          <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} required>
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={form.isAvailable ? "dangban" : "ngungban"}
            onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.value === "dangban" }))}
          >
            <option value="dangban">Đang bán</option>
            <option value="ngungban">Ngừng bán</option>
          </select>
        </div>
        <div className="image-picker">
          <label className="btn btn-outline image-button">
            Chọn ảnh từ máy
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </label>
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Xem trước ảnh" />
            </div>
          )}
        </div>
        <textarea
          placeholder="Mô tả"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
        <button type="submit" className="btn">
          {editingId ? "Lưu thay đổi" : "Thêm sản phẩm"}
        </button>
      </form>

      <div className="admin-filters">
        <input
          placeholder="Tìm theo tên sản phẩm…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
          <option value="tatca">Tất cả trạng thái</option>
          <option value="dangban">Đang bán</option>
          <option value="ngungban">Ngừng bán</option>
        </select>
      </div>

      <div className="admin-products">
        {loading ? (
          <p>Đang tải dữ liệu…</p>
        ) : filteredProducts.length === 0 ? (
          <p>Không có sản phẩm phù hợp.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    {product.description && <p>{product.description}</p>}
                  </td>
                  <td>{categoryNameMap[product.categoryId] || "Chưa rõ"}</td>
                  <td>{formatTien(product.price)}</td>
                  <td>
                    <span className={product.isAvailable ? "status ok" : "status stop"}>
                      {product.isAvailable ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button type="button" className="btn btn-outline" onClick={() => startEdit(product)}>
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline danger"
                        title="Xóa hẳn nếu chưa có trong đơn/giỏ; nếu đã có thì chuyển ngừng bán."
                        onClick={() => deleteProduct(product.id)}
                      >
                        Xóa / ngừng bán
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminProductsPage;
