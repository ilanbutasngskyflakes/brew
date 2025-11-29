const mysql = require('mysql2');
const db = require('./config/db')

const express = require('express')
const app = express();

const cors = require('cors');
app.use(cors()); // single use

const port = process.env.PORT || 8080;

// Middleware
// app.use(cors()); // removed duplicate
app.use(express.json());

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

const userRoutes = require('./routes/userRoutes')
app.use('/user', userRoutes);

const tableRoutes = require('./routes/tableRoutes')
app.use('/table', tableRoutes);

const categoryRoutes = require('./routes/categoryRoutes')
app.use('/category', categoryRoutes);

const productRoutes = require('./routes/productRoutes')
app.use('/product', productRoutes);

const orderRoutes = require('./routes/orderRoutes')
app.use('/order', orderRoutes);

app.use("/uploads", express.static("uploads"));

const variantRoutes = require('./routes/variantRoutes');
app.use("/variants", variantRoutes);



// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
