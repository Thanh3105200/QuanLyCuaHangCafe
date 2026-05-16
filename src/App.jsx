import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminStatsPage from "./pages/AdminStatsPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RequireAuth role="Admin">
              <AdminProductsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <RequireAuth role="Admin">
              <AdminOrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth role="Admin">
              <AdminUsersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <RequireAuth role="Admin">
              <AdminStatsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
