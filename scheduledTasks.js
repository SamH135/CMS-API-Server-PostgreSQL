const cron = require('node-cron');
const pool = require("./db");

const updateNeedsPickup = async () => {
  try {
    const query = `
      UPDATE Client
      SET NeedsPickup = true
      WHERE ClientID IN (
        SELECT c.ClientID
        FROM Client c
        LEFT JOIN (
          SELECT ClientID, MAX(PickupDate) as LastPickupDate
          FROM Receipt
          GROUP BY ClientID
        ) r ON c.ClientID = r.ClientID
        WHERE EXTRACT(DAY FROM NOW() - COALESCE(r.LastPickupDate, c.RegistrationDate)) > c.AvgTimeBetweenPickups
      )
    `;
    await pool.query(query);
    console.log('Updated NeedsPickup status for clients');
  } catch (error) {
    console.error('Error updating NeedsPickup status:', error);
  }
};

const scheduleTasksStart = () => {
  // Run the task every day at midnight
  cron.schedule('0 0 * * *', () => {
    console.log(`[${timestamp()}] Running scheduled task: updateNeedsPickup`);
    updateNeedsPickup();
  });
};

module.exports = { scheduleTasksStart };