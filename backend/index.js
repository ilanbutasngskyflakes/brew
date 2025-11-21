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

const userRoutes = require('./routes/user')
app.use('/user', userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
