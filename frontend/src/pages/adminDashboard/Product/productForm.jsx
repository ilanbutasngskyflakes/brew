// // import { useState, useEffect } from "react";

// // export default function ProductForm({ categories, formData, isEditing, onSubmit, onDelete, onClose }) {
// //   const [form, setForm] = useState(formData);
// //   const [imagePreview, setImagePreview] = useState("");

// //   useEffect(() => {
// //     setForm(formData);
// //     setImagePreview(
// //       formData.image
// //         ? typeof formData.image === "string"
// //           ? `http://localhost:8080/uploads/${formData.image}`
// //           : URL.createObjectURL(formData.image)
// //         : ""
// //     );
// //   }, [formData]);

// //   const handleChange = (e) => {
// //     const { name, value, files } = e.target;
// //     if (name === "image" && files.length > 0) {
// //       setForm({ ...form, image: files[0] });
// //       setImagePreview(URL.createObjectURL(files[0]));
// //     } else {
// //       setForm({ ...form, [name]: value });
// //     }
// //   };

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     const data = new FormData();

// //     for (let key in form) {
// //       if (form[key] !== null && form[key] !== undefined) {
// //         data.append(key, form[key]);
// //       }
// //     }

// //     onSubmit(data);
// //   };

// //   return (
// //     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
// //       <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl relative">
// //         <button
// //           className="absolute top-3 right-3 text-gray-500 text-3xl hover:text-gray-700 transition"
// //           onClick={onClose}
// //         >
// //           &times;
// //         </button>
// //         <h2 className="text-3xl font-bold mb-6 text-gray-800">{isEditing ? "Edit Product" : "Add Product"}</h2>

// //         <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
// //           <select
// //             name="category_id"
// //             value={form.category_id}
// //             onChange={handleChange}
// //             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
// //             required
// //           >
// //             <option value="">Select Category</option>
// //             {categories.map((cat) => (
// //               <option key={cat.id} value={cat.id}>
// //                 {cat.name}
// //               </option>
// //             ))}
// //           </select>

// //           <input
// //             name="product_name"
// //             value={form.product_name}
// //             onChange={handleChange}
// //             placeholder="Product Name"
// //             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
// //             required
// //           />

// //           <textarea
// //             name="product_description"
// //             value={form.product_description}
// //             onChange={handleChange}
// //             placeholder="Description"
// //             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
// //             rows={3}
// //           />

// //           <input
// //             name="price"
// //             type="number"
// //             value={form.price}
// //             onChange={handleChange}
// //             placeholder="Price"
// //             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
// //             required
// //           />

// //           <div className="flex flex-col gap-2">
// //             <label className="font-medium text-gray-700">Product Image</label>
// //             <input type="file" name="image" accept="image/*" onChange={handleChange} className="w-full" />
// //             {imagePreview && (
// //               <img
// //                 src={imagePreview}
// //                 alt="Preview"
// //                 className="mt-2 h-36 w-36 object-cover rounded-xl border shadow-sm"
// //               />
// //             )}
// //           </div>

// //           <select
// //             name="status"
// //             value={form.status}
// //             onChange={handleChange}
// //             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
// //           >
// //             <option value="active">Active</option>
// //             <option value="inactive">Inactive</option>
// //           </select>

// //           <div className="flex gap-4 pt-4">
// //             <button
// //               type="submit"
// //               className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
// //             >
// //               {isEditing ? "Update" : "Add"} Product
// //             </button>
// //             {isEditing && (
// //               <button
// //                 type="button"
// //                 onClick={() => onDelete(form.id)}
// //                 className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition shadow-md"
// //               >
// //                 Delete
// //               </button>
// //             )}
// //           </div>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // }
// // ProductForm.jsx
// import { useState, useEffect } from "react";

// export default function ProductForm({ categories = [], formData = {}, isEditing, onSubmit, onDelete, onClose }) {
//   const [form, setForm] = useState(formData);
//   const [imagePreview, setImagePreview] = useState("");

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

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     if (name === "image" && files?.length > 0) {
//       setForm({ ...form, image: files[0] });
//       setImagePreview(URL.createObjectURL(files[0]));
//     } else {
//       setForm({ ...form, [name]: value });
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const data = new FormData();

//     for (let key in form) {
//       if (form[key] !== null && form[key] !== undefined) {
//         data.append(key, form[key]);
//       }
//     }

//     onSubmit(data);
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
//       <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl relative">
//         <button
//           className="absolute top-3 right-3 text-gray-500 text-3xl hover:text-gray-700 transition"
//           onClick={onClose}
//         >
//           &times;
//         </button>
//         <h2 className="text-3xl font-bold mb-6 text-gray-800">{isEditing ? "Edit Product" : "Add Product"}</h2>

//         <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
//           <select
//             name="category_id"
//             value={form.category_id || ""}
//             onChange={handleChange}
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
//             required
//           >
//             <option value="">Select Category</option>
//             {categories?.map((cat) => (
//               <option key={cat?.id} value={cat?.id}>
//                 {cat?.name}
//               </option>
//             ))}
//           </select>

//           <input
//             name="product_name"
//             value={form.product_name || ""}
//             onChange={handleChange}
//             placeholder="Product Name"
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
//             required
//           />

//           <textarea
//             name="product_description"
//             value={form.product_description || ""}
//             onChange={handleChange}
//             placeholder="Description"
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
//             rows={3}
//           />

//           <input
//             name="price"
//             type="number"
//             value={form.price || ""}
//             onChange={handleChange}
//             placeholder="Price"
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
//             required
//           />

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

//           <select
//             name="status"
//             value={form.status || "active"}
//             onChange={handleChange}
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
//           >
//             <option value="active">Active</option>
//             <option value="inactive">Inactive</option>
//           </select>

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
//                 onClick={() => onDelete(form?.id)}
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
// ProductForm.jsx
import { useState, useEffect } from "react";

export default function ProductForm({ categories = [], formData = {}, isEditing, onSubmit, onDelete, onClose }) {
  const [form, setForm] = useState(formData);
  const [imagePreview, setImagePreview] = useState("");

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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files?.length > 0) {
      setForm({ ...form, image: files[0] });
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();

    for (let key in form) {
      if (form[key] !== null && form[key] !== undefined) {
        data.append(key, form[key]);
      }
    }

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
      <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl relative">
        <button
          className="absolute top-3 right-3 text-gray-500 text-3xl hover:text-gray-700 transition"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold mb-6 text-gray-800">{isEditing ? "Edit Product" : "Add Product"}</h2>

        <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
          <select
            name="category_id"
            value={form.category_id || ""}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            required
          >
            <option value="">Select Category</option>
            {categories?.map((cat) => (
              <option key={cat?.id} value={cat?.id}>
                {cat?.name}
              </option>
            ))}
          </select>

          <input
            name="product_name"
            value={form.product_name || ""}
            onChange={handleChange}
            placeholder="Product Name"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            required
          />

          <textarea
            name="product_description"
            value={form.product_description || ""}
            onChange={handleChange}
            placeholder="Description"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            rows={3}
          />

          <input
            name="price"
            type="number"
            value={form.price || ""}
            onChange={handleChange}
            placeholder="Price"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
            required
          />

          <div className="flex flex-col gap-2">
            <label className="font-medium text-gray-700">Product Image</label>
            <input type="file" name="image" accept="image/*" onChange={handleChange} className="w-full" />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 h-36 w-36 object-cover rounded-xl border shadow-sm"
              />
            )}
          </div>

          <select
            name="status"
            value={form.status || "active"}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 transition"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

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
                onClick={() => onDelete(form?.id)}
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
