const db = require("../config/db");

// -------------------- GET ALL PRODUCTS --------------------
// exports.getProducts = async (req, res) => {
//   try {
//     const [rows] = await db.execute(
//       "SELECT id, category_id, product_name, product_description, image, created_at FROM tbl_products WHERE is_deleted = 0 ORDER BY created_at DESC"
//     );
//     res.json(rows);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Cannot get products" });
//   }
// };

exports.getProducts = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
         p.id,
         p.category_id,
         c.name AS category_name,
         p.product_name,
         p.product_description,
         p.image,
         p.created_at
       FROM tbl_products p
       LEFT JOIN tbl_category c ON p.category_id = c.id
       WHERE p.is_deleted = 0
       ORDER BY p.created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Cannot get products:", error);
    res
      .status(500)
      .json({ message: "Cannot get products", error: error.message });
  }
};

// -------------------- GET SINGLE PRODUCT + VARIANTS --------------------
exports.getProductWithVariants = async (req, res) => {
  try {
    const id = req.params.id;
    const [products] = await db.execute(
      "SELECT * FROM tbl_products WHERE id = ?",
      [id]
    );
    if (!products.length)
      return res.status(404).json({ message: "Product not found" });
    const product = products[0];

    const [variants] = await db.execute(
      "SELECT * FROM tbl_product_variants WHERE product_id = ?",
      [id]
    );

    res.json({ product, variants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get product" });
  }
};

exports.addProductFull = async (req, res) => {
  const conn = await db.getConnection(); // get a connection for transaction

  try {
    await conn.beginTransaction();

    const { category_id, product_name, product_description, image, variants } =
      req.body;

    // Parse variants if it's a JSON string
    let variantsArray = [];
    if (typeof variants === "string") {
      try {
        variantsArray = JSON.parse(variants);
      } catch (err) {
        console.error("Failed to parse variants:", err);
        variantsArray = [];
      }
    } else if (Array.isArray(variants)) {
      variantsArray = variants;
    }

    // 1️⃣ Insert into tbl_products
    const [productResult] = await conn.execute(
      `INSERT INTO tbl_products (category_id, product_name, product_description, image)
       VALUES (?, ?, ?, ?)`,
      [
        category_id || null,
        product_name || null,
        product_description || null,
        image || null,
      ]
    );
    const product_id = productResult.insertId;

    // 2️⃣ Insert variants and ingredients
    for (let variant of variantsArray) {
      const variant_name = variant.name || variant.variant_name || null;
      const price =
        variant.price !== undefined && variant.price !== ""
          ? Number(variant.price)
          : null;

      const [variantResult] = await conn.execute(
        `INSERT INTO tbl_product_variants (product_id, name, price)
         VALUES (?, ?, ?)`,
        [product_id, variant_name, price]
      );
      const variant_id = variantResult.insertId;

      if (variant.ingredients && variant.ingredients.length > 0) {
        const ingredientQueries = variant.ingredients.map((i) => {
          const ingredient_id = i.ingredient_id || null;
          const amount =
            i.amount !== undefined && i.amount !== "" ? Number(i.amount) : null;

          return conn.execute(
            `INSERT INTO tbl_product_ingredients (variant_id, ingredient_id, amount)
             VALUES (?, ?, ?)`,
            [variant_id, ingredient_id, amount]
          );
        });
        await Promise.all(ingredientQueries);
      }
    }

    await conn.commit();

    res.json({
      message: "Product + variants + ingredients created successfully",
      product_id,
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: "Error creating product", error });
  } finally {
    conn.release();
  }
};

exports.getProductsFull = async (req, res) => {
  const conn = await db.getConnection();

  try {
    // 1️⃣ Get all products with variants and ingredients
    const [rows] = await conn.execute(`
      SELECT 
        p.id AS product_id,
        p.product_name,
        p.product_description,
        p.image,
        p.category_id,
        v.id AS variant_id,
        v.name AS variant_name,
        v.price,
        i.id AS ingredient_id,
        i.ingredient_name,
        i.unit,
        pi.amount
      FROM tbl_products p
      LEFT JOIN tbl_product_variants v ON p.id = v.product_id
      LEFT JOIN tbl_product_ingredients pi ON v.id = pi.variant_id
      LEFT JOIN tbl_ingredients i ON pi.ingredient_id = i.id
      ORDER BY p.id, v.id
    `);

    // 2️⃣ Transform rows into nested structure
    const products = [];
    const productMap = new Map();

    rows.forEach((row) => {
      let product = productMap.get(row.product_id);
      if (!product) {
        product = {
          id: row.product_id,
          product_name: row.product_name,
          product_description: row.product_description,
          image: row.image,
          category_id: row.category_id,
          variants: [],
        };
        productMap.set(row.product_id, product);
        products.push(product);
      }

      if (row.variant_id) {
        let variant = product.variants.find((v) => v.id === row.variant_id);
        if (!variant) {
          variant = {
            id: row.variant_id,
            name: row.variant_name,
            price: row.price,
            ingredients: [],
          };
          product.variants.push(variant);
        }

        if (row.ingredient_id) {
          variant.ingredients.push({
            id: row.ingredient_id,
            name: row.ingredient_name,
            unit: row.unit,
            amount: row.amount,
          });
        }
      }
    });

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching products", error: err });
  } finally {
    conn.release();
  }
};

// -------------------- ADD PRODUCT --------------------
// exports.addProduct = async (req, res) => {
//   try {
//     const { category_id, product_name, product_description } = req.body;
//     const image = req.file ? req.file.filename : null;

//     if (!category_id || !product_name || !product_description || !image) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const [result] = await db.execute(
//       "INSERT INTO tbl_products (category_id, product_name, product_description, image) VALUES (?, ?, ?, ?)",
//       [category_id, product_name, product_description, image]
//     );

//     res.json({
//       message: "Product added successfully",
//       product_id: result.insertId
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error saving product", error });
//   }
// };

// // -------------------- UPDATE PRODUCT --------------------
// exports.updateProduct = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const { category_id, product_name, product_description } = req.body;
//     const image = req.file ? req.file.filename : req.body.image || null;

//     const [result] = await db.execute(
//       "UPDATE tbl_products SET category_id=?, product_name=?, product_description=?, image=? WHERE id=?",
//       [category_id, product_name, product_description || null, image, id]
//     );

//     if (result.affectedRows === 0)
//       return res.status(404).json({ message: "Product not found" });

//     res.json({ message: "Product updated" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Cannot update product" });
//   }
// };

exports.addProductFull = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { category_id, product_name, product_description, variants } = req.body;
    const image = req.file ? req.file.filename : null; // <--- Multer handles this

    // Parse variants
    let variantsArray = [];
    if (typeof variants === "string") variantsArray = JSON.parse(variants);
    else if (Array.isArray(variants)) variantsArray = variants;

    // Insert product
    const [productResult] = await conn.execute(
      `INSERT INTO tbl_products (category_id, product_name, product_description, image)
       VALUES (?, ?, ?, ?)`,
      [
        category_id || null,
        product_name || null,
        product_description || null,
        image || null,
      ]
    );
    const product_id = productResult.insertId;

    // Insert variants and ingredients (same as before)
    for (let variant of variantsArray) {
      const variant_name = variant.variant_name || variant.name || null;
      const price = variant.price !== undefined ? Number(variant.price) : null;

      const [variantResult] = await conn.execute(
        `INSERT INTO tbl_product_variants (product_id, name, price)
         VALUES (?, ?, ?)`,
        [product_id, variant_name, price]
      );
      const variant_id = variantResult.insertId;

      if (variant.ingredients?.length > 0) {
        const ingredientQueries = variant.ingredients.map((i) =>
          conn.execute(
            `INSERT INTO tbl_product_ingredients (variant_id, ingredient_id, amount)
             VALUES (?, ?, ?)`,
            [variant_id, i.ingredient_id, Number(i.amount)]
          )
        );
        await Promise.all(ingredientQueries);
      }
    }

    await conn.commit();
    res.json({ message: "Product + variants + ingredients created successfully", product_id });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Error creating product", error: err });
  } finally {
    conn.release();
  }
};


// -------------------- UPDATE PRODUCT --------------------
exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { category_id, product_name, product_description } = req.body;
    const image = req.file ? req.file.filename : req.body.image || null;

    if (!category_id || !product_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.execute(
      `UPDATE tbl_products 
       SET category_id=?, product_name=?, product_description=?, image=? 
       WHERE id=?`,
      [category_id, product_name, product_description || null, image, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot update product", error });
  }
};

// -------------------- DELETE PRODUCT (SOFT DELETE) --------------------
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await db.execute(
      "UPDATE tbl_products SET is_deleted = 1 WHERE id=?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot delete product" });
  }
};
