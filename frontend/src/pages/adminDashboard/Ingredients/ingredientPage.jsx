import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/api";

export default function IngredientPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch ingredients on mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await api.get("/ingredients");
        setIngredients(res.data);
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  return (
    <div className="p-6 bg-white w-full rounded-md shadow-sm">
      <div className="flex justify-between p-3">
        <h1 className="uppercase text-lg font-medium items-center">
          Ingredient Listing
        </h1>
        <Link
          to="/dashboard/ingredients/new"
          className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow hover:bg-blue-700 transition"
        >
          New Ingredient
        </Link>
      </div>

      {loading ? (
        <p className="p-4 text-gray-500">Loading ingredients...</p>
      ) : (
        <table className="min-w-full shadow-sm rounded-md mt-3">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-lg px-4 py-2 text-left font-semibold border-b border-gray-300">
                Name
              </th>
              <th className="text-lg px-4 py-2 text-left font-semibold border-b border-gray-300">
                Quantity
              </th>
              <th className="text-lg px-4 py-2 text-left font-semibold border-b border-gray-300">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {ingredients.length > 0 ? (
              ingredients.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-2 border-b border-gray-100">
                    {item.ingredient_name}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-100">
                    {item.quantity ?? 0} {item.unit}
                  </td>
                  <td className="px-4 py-2 border-b border-gray-100">
                    <Link
                      to={`/dashboard/ingredients/${item.id}/edit`}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mr-2"
                    >
                      Edit
                    </Link>
                    <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  No ingredients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
