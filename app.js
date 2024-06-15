const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const session = require('express-session');
const bodyParser = require('body-parser');
const pgSession = require('connect-pg-simple')(session);
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
  

// Middleware setup
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your React app's URL
  credentials: true,
}));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Set up session middleware with connect-pg-simple
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions',
  }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
}));

// Define routes
app.use('/api', require('./routes/auth'));

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});