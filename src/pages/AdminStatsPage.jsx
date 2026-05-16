import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { orderApi } from "../services/orderApi";
import { formatTien } from "../utils/formatTien";
import "../styles/admin-ops.css";

function AdminStatsPage() {
  const { token } = useAuth();
  const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState("ngay");
  const [chartType, setChartType] = useState("cot");
  const [stats, setStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const loadStats = async () => {
    const query = new URLSearchParams({ from: fromDate, to: toDate, groupBy }).toString();
    const [statsData, topData] = await Promise.all([orderApi.getStats(query, token), orderApi.getTopProducts(query, token)]);
    setStats(statsData || []);
    setTopProducts(topData || []);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const maxRevenue = useMemo(() => Math.max(...stats.map((x) => x.revenue), 1), [stats]);
  const totalRevenue = useMemo(() => stats.reduce((sum, x) => sum + x.revenue, 0), [stats]);
  const totalQuantity = useMemo(() => stats.reduce((sum, x) => sum + x.quantity, 0), [stats]);

  return (
    <section className="admin-ops">
      <h1>Thống kê doanh thu (chỉ tính đơn đã thanh toán)</h1>
      <div className="stats-filters">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
          <option value="ngay">Theo ngày</option>
          <option value="thang">Theo tháng</option>
        </select>
        <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
          <option value="cot">Biểu đồ cột</option>
          <option value="duong">Biểu đồ đường</option>
        </select>
        <button type="button" className="btn" onClick={loadStats}>
          Lọc dữ liệu
        </button>
      </div>

      <div className="admin-ops__stats">
        <article>
          <h4>Tổng doanh thu</h4>
          <strong>{formatTien(totalRevenue)}</strong>
        </article>
        <article>
          <h4>Tổng số lượng bán</h4>
          <strong>{totalQuantity}</strong>
        </article>
      </div>

      <div className={`bieudo bieudo-${chartType}`}>
        {stats.map((item) => (
          <div className="bieudo-muc" key={item.label}>
            <div className="bieudo-cot" style={{ height: `${(item.revenue / maxRevenue) * 200}px` }} />
            <small>{item.label}</small>
            <span>{formatTien(item.revenue)}</span>
          </div>
        ))}
      </div>

      <h2>Sản phẩm bán chạy</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Số lượng bán</th>
            <th>Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {topProducts.map((item) => (
            <tr key={item.productId}>
              <td>{item.productName}</td>
              <td>{item.quantitySold}</td>
              <td>{formatTien(item.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default AdminStatsPage;
