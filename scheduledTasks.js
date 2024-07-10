const pool = require('./db');  // Your database connection

async function updateNeedsPickup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all clients
    const { rows: clients } = await client.query(`
      SELECT ClientID, AvgTimeBetweenPickups, LastPickupDate
      FROM Client
    `);

    for (const client of clients) {
      const { ClientID, AvgTimeBetweenPickups, LastPickupDate } = client;
      
      if (!LastPickupDate || !AvgTimeBetweenPickups) continue;

      const lastPickup = new Date(LastPickupDate);
      const today = new Date();
      const diffTime = Math.abs(today - lastPickup);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const needsPickup = diffDays >= AvgTimeBetweenPickups;

      // Update the client's needsPickup status
      await client.query(`
        UPDATE Client
        SET NeedsPickup = $1
        WHERE ClientID = $2
      `, [needsPickup, ClientID]);
    }

    await client.query('COMMIT');
    console.log('Successfully updated NeedsPickup status for all clients');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error updating NeedsPickup status:', e);
  } finally {
    client.release();
  }
}

updateNeedsPickup();