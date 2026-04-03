import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from './pages/authPage/signup';
import Login from './pages/authPage/LogIn';
import ShopSelectionPage from './pages/ShopSelectionPage';
import PublicOrderPage from './pages/publicOrder/PublicOrderPage';
import { ShopProvider } from './context/ShopContext';
import Dashboard from "./pages/adminDashboard/Dashboard";
import Cashier from "./pages/cashierDashboard/cashierPage";
import ProductsPage from "./pages/adminDashboard/Product/productPage"; 
import ProductDetails from "./pages/adminDashboard/Product/productDetails";
import OrderHistory from "./pages/cashierDashboard/orderHistory";
import Settings from "./pages/adminDashboard/Settings/userProfile"; 
import Inventory from "./pages/adminDashboard/Equipment/equipmentPage"
import CreateProductDashboard from "./pages/adminDashboard/Product/Partials/Create";
import Home from "./pages/adminDashboard/home";
import IngredientsDashboard from "./pages/adminDashboard/Ingredients/ingredientPage";
import CreateIngredientsDashboard from "./pages/adminDashboard/Ingredients/Partials/Create";
import UpdateIngredientsDashboard from "./pages/adminDashboard/Ingredients/Partials/Update";
import ProductEdit from "./pages/adminDashboard/Product/Edit";
import Report from "./pages/adminDashboard/Report/salesReport";
import CashFlowReport from "./pages/adminDashboard/Report/cashFlowReport";
import AddCashFlowTransaction from "./pages/adminDashboard/Report/addCashFlowTransaction";
import AddOnEditPage from "./pages/adminDashboard/Ingredients/addOnEditPage";
import QRCodePage from "./pages/adminDashboard/QRCodePage";
import KitchenDisplaySystem from "./pages/kitchenDisplay/KitchenDisplaySystem";

function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<ShopSelectionPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          
          {/* Public Mobile Ordering */}
          <Route path="/order/:shopId" element={<PublicOrderPage />} />

        {/* Admin Dashboard */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="product" element={<ProductsPage />} />
          <Route path="product/new" element={<CreateProductDashboard />} />
          {/* <Route path="product/:id" element={<ProductDetails />} /> */}
          <Route path="/dashboard/product/edit/:id" element={<ProductEdit />} />
          <Route path="reports" element={<Report/>} />
          <Route path="cashflow" element={<CashFlowReport/>} />
          <Route path="cashflow/new" element={<AddCashFlowTransaction/>} />
          <Route path="cashflow/:id/edit" element={<AddCashFlowTransaction/>} />
          <Route path="inventory" element={<Inventory/>}/>
          <Route path="settings" element={<Settings />} />
          <Route path="ingredients" element={<IngredientsDashboard/>}/>
          <Route path="ingredients/new" element={<CreateIngredientsDashboard/>}/>
          <Route path="ingredients/:id/edit" element={<UpdateIngredientsDashboard/>}/>
          <Route path="/dashboard/addons/:id/edit" element={<AddOnEditPage />} />
          <Route path="qr-codes" element={<QRCodePage />} />
        {/* <Route path="cashier" element={<Cashier />} />
         <Route path="cashier/order/" element={<OrderHistory />} />
        <Route path="cashier/order/update" element={<OrderHistory />} /> */}
        </Route>

        <Route path="cashier" element={<Cashier />} />
        <Route path="cashier/order/" element={<OrderHistory />} />
        <Route path="cashier/order/update" element={<OrderHistory />} />
        <Route path="kitchen" element={<KitchenDisplaySystem />} />

        {/* Cashier */}
        

      </Routes>
      </BrowserRouter>
    </ShopProvider>
  );
}

export default App;
