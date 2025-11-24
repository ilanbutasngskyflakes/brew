import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from './pages/authPage/signup';
import Login from './pages/authPage/LogIn';
import Dashboard from "./pages/adminDashboard/Dashboard";
import Cashier from "./pages/cashierDashboard/cashierPage";
import ProductsPage from "./pages/adminDashboard/Product/productPage"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="product" element={<ProductsPage />} />
        </Route>

        <Route path="/cashier" element={<Cashier />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
