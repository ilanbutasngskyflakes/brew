const db = require("./db");

// Add this to ingredientsController.js for debugging
exports.debugIngredient = async (req, res) => {
  try {
    const id = req.params.id;

    // Check all products using this ingredient
    const [allProducts] = await db.execute(
      `SELECT 
        p.id,
        p.product_name,
        p.deleted_at as product_deleted,
        pv.id as variant_id,
        pv.name as variant_name,
        pv.deleted_at as variant_deleted,
        pi.amount
       FROM tbl_product_ingredients pi
       INNER JOIN tbl_product_variants pv ON pi.variant_id = pv.id
       INNER JOIN tbl_products p ON pv.product_id = p.id
       WHERE pi.ingredient_id = ?`,
      [id]
    );

    res.json({
      ingredient_id: id,
      total_uses: allProducts.length,
      products: allProducts,
      active_products: allProducts.filter(p => p.product_deleted === null && p.variant_deleted === null).length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        i.id,
        i.ingredient_name,
        i.unit,
        COALESCE(inv.quantity, 0) as quantity
      FROM tbl_ingredients i
      LEFT JOIN tbl_inventory inv ON inv.ingredient_id = i.id
      ORDER BY i.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Cannot get ingredients:", error);
    res.status(500).json({ message: "Cannot get ingredients", error: error.message });
  }
};

exports.getIngredient = async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.execute(
      `SELECT 
         i.id,
         i.ingredient_name,
         i.unit,
         COALESCE(inv.quantity, 0) as quantity
       FROM tbl_ingredients i
       LEFT JOIN tbl_inventory inv ON inv.ingredient_id = i.id
       WHERE i.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: "Ingredient not found" });

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get ingredient" });
  }
};

exports.addIngredient = async (req, res) => {
  try {
    const { ingredient_name, unit, quantity } = req.body;
    if (!ingredient_name || !unit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ensure quantity is never null
    const qty = quantity !== undefined && quantity !== null && quantity !== "" 
      ? Number(quantity) 
      : 0;

    const [ingredientResult] = await db.execute(
      `INSERT INTO tbl_ingredients (ingredient_name, unit)
       VALUES (?, ?)`,
      [ingredient_name, unit]
    );

    const ingredient_id = ingredientResult.insertId;
    const [inventoryResult] = await db.execute(
      `INSERT INTO tbl_inventory (ingredient_id, quantity)
       VALUES (?, ?)`,
      [ingredient_id, qty]
    );

    res.json({
      message: "Ingredient + inventory saved",
      ingredient_id,
      inventory_id: inventoryResult.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving ingredient", error });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const id = req.params.id;
    const { ingredient_name, unit, quantity } = req.body;

    if (!ingredient_name || !unit) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ensure quantity is never null
    const qty = quantity !== undefined && quantity !== null && quantity !== "" 
      ? Number(quantity) 
      : 0;

    // Update ingredient info
    const [ingredientResult] = await db.execute(
      `UPDATE tbl_ingredients 
       SET ingredient_name=?, unit=?
       WHERE id=?`,
      [ingredient_name, unit, id]
    );

    if (ingredientResult.affectedRows === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    // Update inventory quantity (or insert if not exists)
    await db.execute(
      `INSERT INTO tbl_inventory (ingredient_id, quantity)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE quantity = ?`,
      [id, qty, qty]
    );

    res.json({ message: "Ingredient updated" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot update ingredient", error });
  }
};

exports.deleteIngredient = async (req, res) => {
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const id = req.params.id;

    // Check if ingredient exists
    const [ingredient] = await conn.execute(
      "SELECT * FROM tbl_ingredients WHERE id = ?",
      [id]
    );

    if (ingredient.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        message: "Ingredient not found" 
      });
    }

    // Check if ingredient is being used in ACTIVE products only
    const [productIngredients] = await conn.execute(
      `SELECT 
        pi.ingredient_id,
        pv.name as variant_name,
        p.product_name
       FROM tbl_product_ingredients pi
       INNER JOIN tbl_product_variants pv ON pi.variant_id = pv.id
       INNER JOIN tbl_products p ON pv.product_id = p.id
       WHERE pi.ingredient_id = ? 
       AND p.deleted_at IS NULL
       AND pv.deleted_at IS NULL
       LIMIT 5`,
      [id]
    );

    if (productIngredients.length > 0) {
      await conn.rollback();
      
      const productList = productIngredients
        .map(p => `${p.product_name} (${p.variant_name})`)
        .join(', ');
      
      return res.status(400).json({ 
        message: "Cannot delete ingredient: It is being used in active products",
        inUse: true,
        usageCount: productIngredients.length,
        products: productList
      });
    }

    // Delete ingredient links from DELETED products/variants
    await conn.execute(
      `DELETE pi FROM tbl_product_ingredients pi
       INNER JOIN tbl_product_variants pv ON pi.variant_id = pv.id
       INNER JOIN tbl_products p ON pv.product_id = p.id
       WHERE pi.ingredient_id = ?
       AND (p.deleted_at IS NOT NULL OR pv.deleted_at IS NOT NULL)`,
      [id]
    );

    // Delete from inventory
    await conn.execute(
      "DELETE FROM tbl_inventory WHERE ingredient_id = ?",
      [id]
    );

    // Delete ingredient
    const [result] = await conn.execute(
      "DELETE FROM tbl_ingredients WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Ingredient not found" });
    }

    await conn.commit();
    
    res.json({ 
      message: "Ingredient deleted successfully",
      deletedIngredient: ingredient[0].ingredient_name
    });

  } catch (error) {
    await conn.rollback();
    console.error("Delete ingredient error:", error);
    res.status(500).json({ 
      message: "Cannot delete ingredient", 
      error: error.message,
      sqlMessage: error.sqlMessage
    });
  } finally {
    conn.release();
  }
};

const fetchIngredients = async () => {
  try {
    setLoading(true);
    const res = await api.get("/ingredients");
    console.log("API response:", res.data); // Debug
    console.log("Setting ingredients, count:", res.data.length); // Debug
    setIngredients(res.data || []);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    alert("Failed to load ingredients");
    setIngredients([]);
  } finally {
    setLoading(false);
  }
};