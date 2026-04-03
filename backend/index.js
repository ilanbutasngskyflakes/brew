const mysql = require('mysql2');
const db = require('./config/db')

const express = require('express')
const app = express();

const cors = require('cors');
app.use(cors()); // Keep ONLY this one

const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
const shopFilter = require('./middleware/shopFilter');

// Test DB connection if available
if (db && typeof db.connect === 'function') {
  db.connect(err => {
    if (err) console.error('DB connection error:', err);
    else console.log('DB connected');
  });
}

app.get('/', (req, res)=>{
  res.json({message: "backend running"})
})

const shopRoutes = require('./routes/shopRoutes')
app.use('/shop', shopRoutes);

const publicRoutes = require('./routes/publicRoutes')
app.use('/public', publicRoutes);

const userRoutes = require('./routes/userRoutes')
app.use('/user', userRoutes);

const tableRoutes = require('./routes/tableRoutes')
app.use('/table', tableRoutes);

const categoryRoutes = require('./routes/categoryRoutes')
app.use('/category', categoryRoutes);

const productRoutes = require('./routes/productRoutes')
app.use('/product', productRoutes);

const ingredientRoutes = require('./routes/ingredientsRoutes')
app.use('/ingredients', ingredientRoutes);

const orderRoutes = require('./routes/orderRoutes')
app.use('/order', orderRoutes);

app.use("/uploads", express.static("uploads"));

const variantRoutes = require('./routes/variantRoutes');
app.use("/variants", variantRoutes);

const equipmentRoutes = require ('./routes/equipmentRoutes')
app.use("/equipment", equipmentRoutes);

const addonsRoutes = require ('./routes/addonsRoutes')
app.use("/addons", addonsRoutes);

const cashFlowRoutes = require('./routes/cashFlowRoutes');
app.use('/cashflow', cashFlowRoutes); 


// Start server
// Run migrations and start server
async function migrateUnitPrice() {
  try {
    // Check if column exists
    const [rows] = await db.execute(
      "SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='tbl_ingredients' AND column_name='unit_price'"
    );

    if (!rows.length) {
      await db.execute("ALTER TABLE tbl_ingredients ADD COLUMN unit_price DECIMAL(10,3) NULL");
      
    } else {
      await db.execute("ALTER TABLE tbl_ingredients MODIFY unit_price DECIMAL(10,3) NULL");
      
    }
  } catch (err) { 
  }
}

async function init() {
  await migrateUnitPrice();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

init();
