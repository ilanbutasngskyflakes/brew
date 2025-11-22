// import { useState } from "react";
// import api from "../../api/api";
// import { Link, useNavigate } from "react-router-dom";

// export default function Login() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     name: "",
//     password: "",
//   });

//   const [message, setMessage] = useState("");

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");

//     try {
//       const res = await api.post("http://localhost:8080/user/auth", form);
//       localStorage.setItem("user", JSON.stringify(res.data.user));

//       setMessage("Login successful!");
//       setTimeout(() => navigate("/dashboard"), 1000);
//     } catch (err) {
//       setMessage(err.response?.data?.message || "Invalid credentials");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
//       <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg">
//         <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

//         {message && (
//           <p className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
//             {message}
//           </p>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">

//           <input
//             type="text"
//             name="name"
//             placeholder="Username"
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
//             value={form.name}
//             onChange={handleChange}
//             required
//           />

//           <input
//             type="password"
//             name="password"
//             placeholder="Password"
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
//             value={form.password}
//             onChange={handleChange}
//             required
//           />

//           <button
//             type="submit"
//             className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
//           >
//             Login
//           </button>
//         </form>

//         <p className="text-center mt-4 text-sm">
//           Don’t have an account?{" "}
//           <Link to="/signup" className="text-blue-600 hover:underline">
//     Sign Up
//   </Link>
//         </p>
//       </div>
//     </div>
//   );
// }
import { useState } from "react";
import api from "../../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await api.post("http://localhost:8080/user/auth", form);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Login successful!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0441b1] to-blue-700 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl border-t-4 border-[#0441b1]">
        <h2 className="text-3xl font-extrabold text-[#0441b1] text-center mb-6">Barcelo Cafe Login</h2>

        {message && (
          <p
            className={`${
              message === "Login successful!"
                ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                : "bg-red-100 border-l-4 border-red-500 text-red-700"
            } p-3 mb-4 rounded transition`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Username"
            className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0441b1] transition"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0441b1] transition"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="w-full bg-[#0441b1] text-white p-4 rounded-xl hover:bg-blue-900 font-semibold transition"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-5 text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-[#0441b1] font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
