const db = require("../config/db.js");

// Get shop by ID
exports.getShop = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid shop ID" });
    }

    const [shops] = await db.execute(
      "SELECT id, name, has_tax, is_active, logo_url, receipt_header, receipt_footer, COALESCE(brand_color, '#073dbe') as brand_color FROM tbl_shops WHERE id = ? AND is_active = 1",
      [id]
    );

    if (shops.length === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json(shops[0]);
  } catch (error) {
    console.error("Error fetching shop:", error);
    res.status(500).json({ message: "Cannot fetch shop", error: error.message });
  }
};

// Get all shops
exports.getAllShops = async (req, res) => {
  try {
    const [shops] = await db.execute(
      "SELECT id, name, has_tax, is_active, logo_url, receipt_header, receipt_footer, COALESCE(brand_color, '#073dbe') as brand_color FROM tbl_shops WHERE is_active = 1"
    );

    res.json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    res.status(500).json({ message: "Cannot fetch shops", error: error.message });
  }
};

// Update shop branding
exports.updateShopBranding = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_color } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid shop ID" });
    }

    if (!brand_color) {
      return res.status(400).json({ message: "Brand color is required" });
    }

    // Validate hex color format
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (!hexColorRegex.test(brand_color)) {
      return res.status(400).json({ message: "Invalid hex color format" });
    }

    const [result] = await db.execute(
      "UPDATE tbl_shops SET brand_color = ? WHERE id = ?",
      [brand_color, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json({ message: "Shop branding updated successfully", brand_color });
  } catch (error) {
    console.error("Error updating shop branding:", error);
    res.status(500).json({ message: "Cannot update shop branding", error: error.message });
  }
};
