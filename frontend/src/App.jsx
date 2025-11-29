// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from './pages/authPage/signup';
import Login from './pages/authPage/LogIn';
import Dashboard from "./pages/adminDashboard/Dashboard";
import Cashier from "./pages/cashierDashboard/cashierPage";
import ProductsPage from "./pages/adminDashboard/Product/productPage"; 
import ProductDashboard from "./pages/adminDashboard/Product/productPage";
import ProductDetails from "./pages/adminDashboard/Product/productDetails";

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

          {/* EXISTING: your previous product page */}
          <Route path="product" element={<ProductsPage />} />

          {/* NEW: Product Dashboard with Variants */}
          <Route path="product" element={<ProductDashboard />} />

          {/* NEW: Details Page for Adding Variants */}
          <Route path="product/:id" element={<ProductDetails />} />
        </Route>

        {/* Cashier */}
        <Route path="/cashier" element={<Cashier />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
