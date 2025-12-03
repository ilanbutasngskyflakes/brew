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
import Inventory from "./pages/adminDashboard/Equipment/equipmentPage"
import CreateProductDashboard from "./pages/adminDashboard/Product/Partials/Create";

import IngredientsDashboard from "./pages/adminDashboard/Ingredients/ingredientPage";
import CreateIngredientsDashboard from "./pages/adminDashboard/Ingredients/Partials/Create";
import UpdateIngredientsDashboard from "./pages/adminDashboard/Ingredients/Partials/Update";


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
          <Route path="product/new" element={<CreateProductDashboard />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="settings" element={<Settings/>} />
          <Route path="inventory" element={<Inventory/>}/>

          <Route path="ingredients" element={<IngredientsDashboard/>}/>
          <Route path="ingredients/new" element={<CreateIngredientsDashboard/>}/>
          <Route path="ingredients/:id/edit" element={<UpdateIngredientsDashboard/>}/>
          
        </Route>

        {/* Cashier */}
        <Route path="/cashier" element={<Cashier />} />
        <Route path="/cashier/order" element={<OrderHistory />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
