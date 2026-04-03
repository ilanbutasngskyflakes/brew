const db = require("./config/db");

// Setup script to initialize shop brand colors
async function setupShopColors() {
  try {
    console.log("Starting shop color setup...");

    // Update Barcelo Cafe (Shop 1) - Blue
    const [result1] = await db.execute(
      "UPDATE tbl_shops SET brand_color = '#073dbe' WHERE id = 1",
      []
    );
    console.log(`✓ Barcelo Cafe updated: ${result1.affectedRows} row(s) affected`);

    // Update Good Coffee (Shop 2) - Black
    const [result2] = await db.execute(
      "UPDATE tbl_shops SET brand_color = '#000000' WHERE id = 2",
      []
    );
    console.log(`✓ Good Coffee updated: ${result2.affectedRows} row(s) affected`);

    // Verify the updates
    const [shops] = await db.execute(
      "SELECT id, name, brand_color FROM tbl_shops"
    );
    
    console.log("\nShop colors after update:");
    shops.forEach(shop => {
      console.log(`  ${shop.name} (ID: ${shop.id}): ${shop.brand_color}`);
    });

    console.log("\n✓ Setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up shop colors:", error);
    process.exit(1);
  }
}

setupShopColors();
