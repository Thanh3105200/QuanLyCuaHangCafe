import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userApi } from "../services/userApi";
import "../styles/admin-ops.css";

function AdminUsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      const data = await userApi.getAll(token);
      setUsers(data || []);
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (userId, role) => {
    await userApi.updateRole(userId, { role }, token);
    await loadUsers();
  };

  const changeActive = async (userId, isActive) => {
    await userApi.updateActive(userId, { isActive }, token);
    await loadUsers();
  };

  return (
    <section className="admin-ops">
      <h1>Quản lý người dùng</h1>
      {message && <p className="error-banner">{message}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Họ và tên</th>
            <th>Thư điện tử</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {users.map((item) => (
            <tr key={item.id}>
              <td>{item.fullName}</td>
              <td>{item.email}</td>
              <td>
                <select value={item.role} onChange={(e) => changeRole(item.id, e.target.value)} disabled={item.id === user?.id}>
                  <option value="Customer">Khách hàng</option>
                  <option value="Admin">Quản trị viên</option>
                </select>
              </td>
              <td>
                <select
                  value={item.isActive ? "hoatdong" : "khoa"}
                  onChange={(e) => changeActive(item.id, e.target.value === "hoatdong")}
                  disabled={item.id === user?.id}
                >
                  <option value="hoatdong">Đang hoạt động</option>
                  <option value="khoa">Đã khóa</option>
                </select>
              </td>
              <td>{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default AdminUsersPage;
