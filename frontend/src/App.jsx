import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from './pages/authPage/signup';
import Login from './pages/authPage/LogIn';
import Dashboard from "./pages/adminDashboard/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
         <Route path="/dashboard/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
