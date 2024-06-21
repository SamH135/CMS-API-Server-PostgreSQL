// db.js

const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const pool = new Pool({
  host: process.env.POSTGRES_HOSTNAME,
  port: process.env.POSTGRES_SERVER_PORT,
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  max: 10,
});

module.exports = pool;