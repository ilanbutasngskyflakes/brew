const mysql = require('mysql2/promise');

async function fixShopColors() {
  let connection;
  try {
    console.log("Connecting to database...");
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Adjust if you have a password
      database: 'brewtrack'  // Correct database name
    });

    console.log("✓ Connected to database");

    // Check current values
    console.log("\nCurrent shop colors:");
    const [shops] = await connection.execute(
      "SELECT id, name, brand_color FROM tbl_shops"
    );
    shops.forEach(shop => {
      console.log(`  ${shop.name} (ID: ${shop.id}): ${shop.brand_color || 'NULL'}`);
    });

    // Update Barcelo Cafe (ID 1) to blue
    console.log("\nUpdating Barcelo Cafe to blue (#073dbe)...");
    const [result1] = await connection.execute(
      "UPDATE tbl_shops SET brand_color = ? WHERE id = 1",
      ['#073dbe']
    );
    console.log(`✓ Updated ${result1.affectedRows} row(s)`);

    // Update Good Coffee (ID 2) to black
    console.log("Updating Good Coffee to black (#000000)...");
    const [result2] = await connection.execute(
      "UPDATE tbl_shops SET brand_color = ? WHERE id = 2",
      ['#000000']
    );
    console.log(`✓ Updated ${result2.affectedRows} row(s)`);

    // Verify updates
    console.log("\nVerifying updates:");
    const [updatedShops] = await connection.execute(
      "SELECT id, name, brand_color FROM tbl_shops"
    );
    updatedShops.forEach(shop => {
      console.log(`  ${shop.name} (ID: ${shop.id}): ${shop.brand_color}`);
    });

    console.log("\n✓ All done! Refresh your browser to see the changes.");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

fixShopColors();
