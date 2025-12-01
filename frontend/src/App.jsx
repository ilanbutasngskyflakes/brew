// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from './pages/authPage/signup';
import Login from './pages/authPage/LogIn';
import Dashboard from "./pages/adminDashboard/Dashboard";
import Cashier from "./pages/cashierDashboard/cashierPage";
import ProductsPage from "./pages/adminDashboard/Product/productPage"; 
import ProductDashboard from "./pages/adminDashboard/Product/productPage";
import ProductDetails from "./pages/adminDashboard/Product/productDetails";
import OrderHistory from "./pages/cashierDashboard/orderHistory";
import Settings from "./pages/adminDashboard/Settings/userProfile"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="product" element={<ProductsPage />} />
          <Route path="product" element={<ProductDashboard />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="settings" element={<Settings/>} />
        </Route>

        {/* Cashier */}
        <Route path="/cashier" element={<Cashier />} />
        <Route path="/cashier/order" element={<OrderHistory />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
