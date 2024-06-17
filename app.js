const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOSTNAME,
  port: process.env.POSTGRES_SERVER_PORT,
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  max: 10,
});

// Test the database connection
pool.query('SELECT 1')
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  });

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your React app's URL
  credentials: true,
}));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/api', require('./routes/auth'));

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});