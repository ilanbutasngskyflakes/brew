const mysql = require('mysql2');
const db = require('./config/db')

const express = require('express')
const app = express();

const cors = require('cors');
app.use(cors());

const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

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

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
