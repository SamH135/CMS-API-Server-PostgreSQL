const express = require("express");
//const { scheduleTasksStart } = require('./scheduledTasks');
const dotenv = require("dotenv");
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const pool = require("./db");

// Load environment variables from .env file
require('dotenv').config();
console.log('RGC_PASSCODE:', process.env.RGC_PASSCODE);
console.log('RGC_JWT_SECRET is set:', !!process.env.RGC_JWT_SECRET);

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
  origin: [process.env.ISA_CLIENT_URL, 'http://localhost:3000'], // DELETE localhost after testing
  credentials: true,
}));


app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// define api routes
const isacRoutes = require('./routes/isac');
const rgcRoutes = require('./routes/rgc');

// set API routes
app.use('/api/rgc', rgcRoutes);
app.use('/api', isacRoutes);

// This should be the last route
app.use('*', (req, res) => {
  console.log('Unmatched route:', req.method, req.originalUrl);
  res.status(404).send('Not Found');
});

// Start the scheduled tasks - need to convert to cron 
// DELETE eventually
//scheduleTasksStart();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export the pool object
module.exports = pool;