// import { useState, useEffect } from "react";
// import api from "../../../api/api"; // your axios instance

// export default function ProductForm({ formData = {}, isEditing, onSubmit, onDelete, onClose }) {
//   const [form, setForm] = useState(formData);
//   const [imagePreview, setImagePreview] = useState("");
//   const [categories, setCategories] = useState([]);

//   // Load categories from backend
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const { data } = await api.get("/category"); // backend endpoint
//         setCategories(data);
//       } catch (err) {
//         console.error("Cannot fetch categories:", err);
//       }
//     };
//     loadCategories();
//   }, []);

//   // Update form & image preview when editing
//   useEffect(() => {
//     setForm(formData);
//     setImagePreview(
//       formData?.image
//         ? typeof formData.image === "string"
//           ? `http://localhost:8080/uploads/${formData.image}`
//           : URL.createObjectURL(formData.image)
//         : ""
//     );
//   }, [formData]);

//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value, files } = e.target;

//     if (name === "image" && files?.length > 0) {
//       setForm({ ...form, image: files[0] });
//       setImagePreview(URL.createObjectURL(files[0]));
//     } else if (name === "category_id") {
//       setForm({ ...form, [name]: parseInt(value) }); // convert string to number
//     } else {
//       setForm({ ...form, [name]: value });
//     }
//   };

//   // Submit form
//  const handleSubmit = async (e) => {
//   e.preventDefault();

//   const data = new FormData();
//   data.append("category_id", Number(form.category_id));
//   data.append("product_name", form.product_name);
//   data.append("product_description", form.product_description || "");

//   if (form.image instanceof File) {
//     data.append("image", form.image);
//   }

//   onSubmit(data);
// };



//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
//       <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl relative">
//         <button
//           className="absolute top-3 right-3 text-gray-500 text-3xl hover:text-gray-700 transition"
//           onClick={onClose}
//         >
//           &times;
//         </button>

//         <h2 className="text-3xl font-bold mb-6 text-gray-800">
//           {isEditing ? "Edit Product" : "Add Product"}
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
//           {/* Category select */}
//           <select
//             name="category_id"
//             value={form.category_id || ""}
//             onChange={handleChange}
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
//             required
//           >
//             <option value="">Select Category</option>
//             {categories.map((cat) => (
//               <option key={cat.id} value={cat.id}>
//                 {cat.name}
//               </option>
//             ))}
//           </select>

//           {/* Product name */}
//           <input
//             name="product_name"
//             value={form.product_name || ""}
//             onChange={handleChange}
//             placeholder="Product Name"
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
//             required
//           />

//           {/* Description */}
//           <textarea
//             name="product_description"
//             value={form.product_description || ""}
//             onChange={handleChange}
//             placeholder="Description"
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
//             rows={3}
//           />

//           {/* Image */}
//           <div className="flex flex-col gap-2">
//             <label className="font-medium text-gray-700">Product Image</label>
//             <input type="file" name="image" accept="image/*" onChange={handleChange} className="w-full" />
//             {imagePreview && (
//               <img
//                 src={imagePreview}
//                 alt="Preview"
//                 className="mt-2 h-36 w-36 object-cover rounded-xl border shadow-sm"
//               />
//             )}
//           </div>

//           {/* Buttons */}
//           <div className="flex gap-4 pt-4">
//             <button
//               type="submit"
//               className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
//             >
//               {isEditing ? "Update" : "Add"} Product
//             </button>
//             {isEditing && (
//               <button
//                 type="button"
//                 onClick={() => onDelete(form.id)}
//                 className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition shadow-md"
//               >
//                 Delete
//               </button>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import api from "../../../api/api"; // your axios instance

export default function ProductForm({ formData = {}, isEditing, onSubmit, onDelete, onClose }) {
  const [form, setForm] = useState(formData);
  const [imagePreview, setImagePreview] = useState("");
  const [categories, setCategories] = useState([]);

  // Load categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get("/category"); // backend endpoint
        setCategories(data);
      } catch (err) {
        console.error("Cannot fetch categories:", err);
      }
    };
    loadCategories();
  }, []);

  // Update form & image preview when editing
  useEffect(() => {
    setForm(formData);
    setImagePreview(
      formData?.image
        ? typeof formData.image === "string"
          ? `http://localhost:8080/uploads/${formData.image}`
          : URL.createObjectURL(formData.image)
        : ""
    );
  }, [formData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files?.length > 0) {
      setForm({ ...form, image: files[0] });
      setImagePreview(URL.createObjectURL(files[0]));
    } else if (name === "category_id") {
      setForm({ ...form, [name]: parseInt(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.category_id || !form.product_name) {
      alert("Category and Product Name are required");
      return;
    }

    const data = new FormData();
    data.append("category_id", form.category_id);
    data.append("product_name", form.product_name);

    // Only append description if provided
    if (form.product_description?.trim()) {
      data.append("product_description", form.product_description.trim());
    }

    // Only append image if a new file is selected
    if (form.image instanceof File) {
      data.append("image", form.image);
    }

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl relative">
        <button
          className="absolute top-3 right-3 text-gray-500 text-3xl hover:text-gray-700 transition"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          {isEditing ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
          {/* Category select */}
          <select
            name="category_id"
            value={form.category_id || ""}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Product name */}
          <input
            name="product_name"
            value={form.product_name || ""}
            onChange={handleChange}
            placeholder="Product Name"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            required
          />

          {/* Description (optional) */}
          <textarea
            name="product_description"
            value={form.product_description || ""}
            onChange={handleChange}
            placeholder="Description (optional)"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            rows={3}
          />

          {/* Image (optional) */}
          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">Product Image (optional)</label>
            <input type="file" name="image" accept="image/*" onChange={handleChange} className="w-full" />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 h-36 w-36 object-cover rounded-xl border shadow-sm"
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              {isEditing ? "Update" : "Add"} Product
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => onDelete(form.id)}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition shadow-md"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
