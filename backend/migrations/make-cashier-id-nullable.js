const db = require("../config/db.js");

async function migrate() {
  try {
    console.log("🔄 Making cashier_id nullable in tbl_orders...");
    
    await db.execute(
      "ALTER TABLE tbl_orders MODIFY cashier_id BIGINT(20) UNSIGNED NULL DEFAULT NULL"
    );
    
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

migrate();
