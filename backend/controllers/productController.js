const db = require("../config/db.js");

// -------------------- GET SINGLE PRODUCT --------------------
exports.getProductById = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = req.params.id;

    const [products] = await conn.execute(
      "SELECT * FROM tbl_products WHERE id = ? AND is_deleted = 0",
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = products[0];

    // Get variants with ingredients and calculated_cost
    const [variants_data] = await conn.execute(
      `SELECT 
         v.id,
         v.name,
         v.price,
         v.calculated_cost,
         i.id AS ingredient_id,
         i.ingredient_name as name,
         i.unit,
         i.quantity as ingredient_quantity,
         pi.amount
       FROM tbl_product_variants v
       LEFT JOIN tbl_product_ingredients pi ON v.id = pi.variant_id
       LEFT JOIN tbl_ingredients i ON pi.ingredient_id = i.id
       WHERE v.product_id = ?
       ORDER BY v.id`,
      [id]
    );

    // Group ingredients by variant and calculate quantity
    const variantsMap = new Map();
    variants_data.forEach(row => {
      if (!variantsMap.has(row.id)) {
        variantsMap.set(row.id, {
          id: row.id,
          name: row.name,
          price: row.price,
          calculated_cost: row.calculated_cost || 0,
          quantity: null,
          ingredients: []
        });
      }
      
      if (row.ingredient_id) {
        const ingredient = {
          id: row.ingredient_id,
          ingredient_id: row.ingredient_id,
          name: row.name,
          unit: row.unit,
          amount: row.amount,
          quantity: Number(row.ingredient_quantity) || 0
        };
        variantsMap.get(row.id).ingredients.push(ingredient);
      }
    });

    // Calculate quantity for each variant based on ingredient availability
    const variants = Array.from(variantsMap.values()).map(variant => {
      if (variant.ingredients.length === 0) {
        variant.quantity = 0;
      } else {
        const possibleUnits = variant.ingredients.map(ing => {
          if (!ing.amount || ing.amount === 0) return Infinity;
          const qty = Number(ing.quantity) || 0;
          return Math.floor(qty / ing.amount);
        });
        variant.quantity = Math.min(...possibleUnits);
        if (variant.quantity === Infinity) variant.quantity = 0;
      }
      return variant;
    });

    res.json({ 
      product,
      variants
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Cannot fetch product", error: error.message });
  } finally {
    conn.release();
  }
};

// -------------------- GET ALL PRODUCTS --------------------
exports.getAllProducts = async (req, res) => {
  const conn = await db.getConnection();
  try {
    // Get all products
    const [products] = await conn.execute(
      "SELECT * FROM tbl_products WHERE is_deleted = 0 ORDER BY id DESC"
    );

    // Get all variants with ingredients, quantities, and calculated_cost
    const [variants_data] = await conn.execute(
      `SELECT 
         v.product_id,
         v.id,
         v.name,
         v.price,
         v.calculated_cost,
         i.id AS ingredient_id,
         i.ingredient_name as name,
         i.unit,
         i.quantity as ingredient_quantity,
         pi.amount
       FROM tbl_product_variants v
       LEFT JOIN tbl_product_ingredients pi ON v.id = pi.variant_id
       LEFT JOIN tbl_ingredients i ON pi.ingredient_id = i.id
       ORDER BY v.product_id, v.id`
    );

    // Group variants and ingredients by product
    const productsMap = new Map();
    products.forEach(p => {
      productsMap.set(p.id, {
        ...p,
        variants: []
      });
    });

    const variantsMap = new Map();
    variants_data.forEach(row => {
      const key = `${row.product_id}_${row.id}`;
      
      if (!variantsMap.has(key)) {
        variantsMap.set(key, {
          id: row.id,
          name: row.name,
          price: row.price,
          calculated_cost: row.calculated_cost || 0,
          quantity: null,
          ingredients: []
        });
      }
      
      if (row.ingredient_id) {
        variantsMap.get(key).ingredients.push({
          id: row.ingredient_id,
          ingredient_id: row.ingredient_id,
          name: row.name,
          unit: row.unit,
          amount: row.amount,
          quantity: Number(row.ingredient_quantity) || 0
        });
      }
    });

    // Calculate quantity for each variant based on ingredient availability
    variantsMap.forEach((variant, key) => {
      if (variant.ingredients.length === 0) {
        variant.quantity = 0;
      } else {
        const possibleUnits = variant.ingredients.map(ing => {
          if (!ing.amount || ing.amount === 0) return Infinity;
          const qty = Number(ing.quantity) || 0;
          return Math.floor(qty / ing.amount);
        });
        variant.quantity = Math.min(...possibleUnits);
        if (variant.quantity === Infinity || variant.quantity < 0) variant.quantity = 0;
      }
    });

    // Assign variants to products
    variantsMap.forEach((variant, key) => {
      const productId = parseInt(key.split('_')[0]);
      if (productsMap.has(productId)) {
        productsMap.get(productId).variants.push(variant);
      }
    });

    const productsWithVariants = Array.from(productsMap.values());

    res.json({ products: productsWithVariants });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Cannot fetch products", error: error.message });
  } finally {
    conn.release();
  }
};

// -------------------- GET ALL PRODUCTS with ingredient-based quantity --------------------
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
    res.status(500).json({ message: "Cannot get products", error: error.message });
  }
};

// -------------------- GET PRODUCTS WITH VARIANTS AND CALCULATED quantity --------------------
exports.getProductsFull = async (req, res) => {
  const conn = await db.getConnection();

  try {
    // Get all products with variants and ingredients
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
        v.calculated_cost,
        i.id AS ingredient_id,
        i.ingredient_name,
        i.unit,
        pi.amount AS required_amount,
        inv.quantity AS available_quantity
      FROM tbl_products p
      LEFT JOIN tbl_product_variants v ON p.id = v.product_id
      LEFT JOIN tbl_product_ingredients pi ON v.id = pi.variant_id
      LEFT JOIN tbl_ingredients i ON pi.ingredient_id = i.id
      LEFT JOIN tbl_inventory inv ON inv.ingredient_id = i.id
      WHERE p.is_deleted = 0
      ORDER BY p.id, v.id
    `);

    // Transform into nested structure with calculated quantity
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
            calculated_cost: row.calculated_cost || 0,
            ingredients: [],
          };
          product.variants.push(variant);
        }

        if (row.ingredient_id) {
          variant.ingredients.push({
            id: row.ingredient_id,
            name: row.ingredient_name,
            unit: row.unit,
            amount: row.required_amount,
            available: Number(row.available_quantity) || 0
          });
        }
      }
    });

    // Calculate quantity for each variant based on ingredients
    products.forEach(product => {
      product.variants.forEach(variant => {
        if (variant.ingredients.length > 0) {
          // Calculate how many units can be made with each ingredient
          const possibleUnits = variant.ingredients.map(ing => {
            const available = ing.available || 0;
            const required = ing.amount || 1;
            return Math.floor(available / required);
          });
          
          // The limiting ingredient determines the quantity
          variant.quantity = Math.min(...possibleUnits);
        } else {
          // No ingredients defined, set quantity to 0
          variant.quantity = 0;
        }
      });
    });

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching products", error: err });
  } finally {
    conn.release();
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

// -------------------- ADD PRODUCT --------------------
exports.addProductFull = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { category_id, product_name, product_description, variants } = req.body;
    const image = req.file ? req.file.filename : null;

    // Parse variants
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

    // Insert product
    const [productResult] = await conn.execute(
      `INSERT INTO tbl_products (category_id, product_name, product_description, image)
       VALUES (?, ?, ?, ?)`,
      [category_id || null, product_name || null, product_description || null, image || null]
    );
    const product_id = productResult.insertId;

    // Insert variants and ingredients
    for (let variant of variantsArray) {
      const variant_name = variant.variant_name || variant.name || null;
      const price = variant.price !== undefined && variant.price !== "" ? Number(variant.price) : null;
      const calculated_cost = variant.calculated_cost !== undefined ? Number(variant.calculated_cost) : 0;

      const [variantResult] = await conn.execute(
        `INSERT INTO tbl_product_variants (product_id, name, price, calculated_cost)
         VALUES (?, ?, ?, ?)`,
        [product_id, variant_name, price, calculated_cost]
      );
      const variant_id = variantResult.insertId;

      if (variant.ingredients && variant.ingredients.length > 0) {
        const ingredientQueries = variant.ingredients.map((i) => {
          const ingredient_id = i.ingredient_id || null;
          const amount = i.amount !== undefined && i.amount !== "" ? Number(i.amount) : null;

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

// -------------------- UPDATE PRODUCT --------------------
exports.updateProduct = async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const id = req.params.id;
    const { category_id, product_name, product_description, variants } = req.body;
    
    // Only update image if a new one is uploaded
    let imageUpdate = "";
    let params = [category_id, product_name, product_description || null];
    
    if (req.file) {
      imageUpdate = ", image = ?";
      params.push(req.file.filename);
    }
    
    params.push(id);

    console.log("📥 Update request for product:", id);
    console.log("📦 Variants received:", variants);

    if (!category_id || !product_name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Update product info (preserve image if not uploading new one)
    const [result] = await conn.execute(
      `UPDATE tbl_products 
       SET category_id=?, product_name=?, product_description=?${imageUpdate}
       WHERE id=?`,
      params
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Handle variants if provided
    if (variants) {
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

      console.log("✅ Parsed variants:", variantsArray);

      // Get existing variant IDs from the request
      const existingVariantIds = variantsArray
        .filter(v => v.id)
        .map(v => v.id);

      console.log("📋 Existing variant IDs:", existingVariantIds);

      // Delete variants that are no longer in the list (only if we have IDs to keep)
      if (existingVariantIds.length > 0) {
        const placeholders = existingVariantIds.map(() => '?').join(',');
        await conn.execute(
          `DELETE FROM tbl_product_variants 
           WHERE product_id = ? AND id NOT IN (${placeholders})`,
          [id, ...existingVariantIds]
        );
        console.log("🗑️ Deleted removed variants");
      }

      // Process each variant
      for (let variant of variantsArray) {
        const variant_name = variant.variant_name || variant.name || null;
        const price = variant.price !== undefined && variant.price !== "" 
          ? Number(variant.price) 
          : null;
        const calculated_cost = variant.calculated_cost !== undefined ? Number(variant.calculated_cost) : 0;

        let variant_id;

        if (variant.id) {
          // UPDATE existing variant - keep existing data if not provided
          console.log(`📝 Updating variant ${variant.id}:`, variant_name);
          await conn.execute(
            `UPDATE tbl_product_variants 
             SET name = ?, price = ?, calculated_cost = ? 
             WHERE id = ?`,
            [variant_name, price, calculated_cost, variant.id]
          );
          variant_id = variant.id;
        } else {
          // INSERT new variant
          console.log(`➕ Adding new variant:`, variant_name);
          const [variantResult] = await conn.execute(
            `INSERT INTO tbl_product_variants (product_id, name, price, calculated_cost)
             VALUES (?, ?, ?, ?)`,
            [id, variant_name, price, calculated_cost]
          );
          variant_id = variantResult.insertId;
          console.log(`✅ New variant created with ID:`, variant_id);
        }

        // Delete old ingredients for this variant
        await conn.execute(
          `DELETE FROM tbl_product_ingredients WHERE variant_id = ?`,
          [variant_id]
        );

        // Insert new ingredients
        if (variant.ingredients && variant.ingredients.length > 0) {
          console.log(`  📦 Adding ${variant.ingredients.length} ingredients to variant ${variant_id}`);
          
          for (let ingredient of variant.ingredients) {
            const ingredient_id = ingredient.ingredient_id || null;
            const amount = ingredient.amount !== undefined && ingredient.amount !== "" 
              ? Number(ingredient.amount) 
              : null;

            if (ingredient_id && amount !== null) {
              await conn.execute(
                `INSERT INTO tbl_product_ingredients (variant_id, ingredient_id, amount)
                 VALUES (?, ?, ?)`,
                [variant_id, ingredient_id, amount]
              );
              console.log(`    ✅ Added ingredient ${ingredient_id} with amount ${amount}`);
            }
          }
        }
      }
    }

    await conn.commit();
    console.log("✅ Product updated successfully!");

    // Fetch and return updated product with variants
    const [products] = await conn.execute(
      "SELECT * FROM tbl_products WHERE id = ?",
      [id]
    );
    const product = products[0];

    // Get variants with ingredients and calculated_cost
    const [variants_data] = await conn.execute(
      `SELECT 
         v.id,
         v.name,
         v.price,
         v.calculated_cost,
         i.id AS ingredient_id,
         i.ingredient_name,
         i.unit,
         pi.amount
       FROM tbl_product_variants v
       LEFT JOIN tbl_product_ingredients pi ON v.id = pi.variant_id
       LEFT JOIN tbl_ingredients i ON pi.ingredient_id = i.id
       WHERE v.product_id = ?
       ORDER BY v.id`,
      [id]
    );

    // Group ingredients by variant
    const variantsMap = new Map();
    variants_data.forEach(row => {
      if (!variantsMap.has(row.id)) {
        variantsMap.set(row.id, {
          id: row.id,
          name: row.name,
          price: row.price,
          calculated_cost: row.calculated_cost || 0,
          ingredients: []
        });
      }
      
      if (row.ingredient_id) {
        variantsMap.get(row.id).ingredients.push({
          id: row.ingredient_id,
          ingredient_id: row.ingredient_id,
          name: row.ingredient_name,
          unit: row.unit,
          amount: row.amount
        });
      }
    });

    const variants_result = Array.from(variantsMap.values());

    console.log("📤 Returning product with", variants_result.length, "variants");

    res.json({ 
      message: "Product updated successfully",
      product,
      variants: variants_result
    });
  } catch (error) {
    await conn.rollback();
    console.error("❌ Error updating product:", error);
    res.status(500).json({ message: "Cannot update product", error: error.message });
  } finally {
    conn.release();
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
