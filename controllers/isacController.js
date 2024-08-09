// controllers/auth.js
const pool = require("../db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// imports for time zone specific date operations
const { parseISO, format, startOfDay, endOfDay } = require('date-fns');
const { formatInTimeZone, toDate, fromZonedTime } = require('date-fns-tz');



/*******************************************************
 *                   AUTHENTICATION                    *
 *                                                     *
 *    Functions for user authentication and security   *
 *******************************************************/

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

exports.authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.userType === role) {
      next();
    } else {
      res.sendStatus(403);
    }
  };
};

exports.login = async (req, res) => {
  const { userID, password } = req.body;
  const timestamp = () => new Date().toISOString();

  console.log(`[${timestamp()}] Login attempt for userID: ${userID}`);

  try {
    const { rows: results } = await pool.query('SELECT * FROM "User" WHERE UserID = $1', [userID]);
    console.log(`[${timestamp()}] Query executed for userID: ${userID}`);

    if (results.length === 0) {
      console.log(`[${timestamp()}] User ID not registered: ${userID}`);
      return res.status(401).json({ message: 'That user ID has not been registered yet' });
    }

    console.log(`[${timestamp()}] User found: ${userID}`);
    let match = await bcrypt.compare(password, results[0].password);
    console.log(`[${timestamp()}] Password comparison completed for userID: ${userID}`);

    if (match) {
      const token = jwt.sign(
        { userID: results[0].userid, userType: results[0].usertype },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      console.log(`[${timestamp()}] JWT token generated for userID: ${userID}`);
      return res.status(200).json({ token, userType: results[0].usertype });
    } else {
      console.log(`[${timestamp()}] Invalid password for userID: ${userID}`);
      return res.status(401).json({ message: 'Invalid password' });
    }
  } catch (error) {
    console.log(`[${timestamp()}] ERROR: ${error.message}`);
    return res.status(500).json({ message: 'An error occurred during login' });
  }
};

exports.register = async (req, res) => {
  const { userID, username, userType, password, confirmPassword } = req.body;
  console.log('Register request received:', req.body);

  try {
    const { rows: existingUser } = await pool.query('SELECT UserID FROM "User" WHERE UserID = $1', [userID]);
    console.log('Result from checking existing user:', existingUser);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User ID already exists' });
    } else if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    let hashedPassword = await bcrypt.hash(password, 8);
    console.log('Hashed password:', hashedPassword);

    await pool.query('INSERT INTO "User" (UserID, Username, UserType, Password) VALUES ($1, $2, $3, $4)', [userID, username, userType, hashedPassword]);
    console.log('New user inserted');

    return res.status(200).json({ success: true, message: 'Successfully registered!' });
  } catch (error) {
    console.log('Error during registration:', error);
    return res.status(500).json({ message: 'An error occurred during registration' });
  }
};

exports.dashboard = (req, res) => {
  const { userID, userType } = req.user;
  return res.status(200).json({ userType });
};




/*******************************************************
 *                      CLIENTS                        *
 *                                                     *
 *    Functions for client-related operations          *
 *******************************************************/

exports.clientList = async (req, res) => {
  try {
    const clients = await getClients();
    res.status(200).json({ clients });
  } catch (error) {
    console.error('Error retrieving clients:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.clientInfo = async (req, res) => {
  const clientID = req.params.clientID;
  try {
    const client = await getClientByID(clientID);
    res.status(200).json({ client });
  } catch (error) {
    console.error('Error retrieving client:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateClient = async (req, res) => {
  console.log('Update client request received:', req.body);
  console.log('User from token:', req.user);
  const clientData = req.body;
  try {
    await updateClient(clientData);
    res.status(200).json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.pickupInfo = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 31);

    const query = `
      SELECT r.ReceiptID, r.ClientID, c.ClientName, c.ClientLocation, 
             r.PickupDate, r.PickupTime, c.NeedsPickup, r.CreatedBy
      FROM Receipt r
      JOIN Client c ON r.ClientID = c.ClientID
      WHERE r.PickupDate >= $1
      ORDER BY r.PickupDate DESC, r.PickupTime DESC
      LIMIT 1000
    `;

    const { rows } = await pool.query(query, [thirtyDaysAgo]);
    res.status(200).json({ receipts: rows });
  } catch (error) {
    console.error('Error retrieving pickup information:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.searchClients = async (req, res) => {
  const searchTerm = req.query.term;
  try {
    const { rows } = await pool.query(`
      SELECT * FROM Client
      WHERE ClientName ILIKE $1 OR ClientID::text ILIKE $1 OR ClientLocation ILIKE $1
    `, [`%${searchTerm}%`]);
    res.status(200).json({ clients: rows });
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getClientMetals = async (req, res) => {
  console.log('In getClientMetals controller');
  const clientID = req.params.clientID;
  try {
    const client = await getClientByID(clientID);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    const metals = await getClientMetals(client.clienttype, clientID);
    res.status(200).json({ metals, clientType: client.clienttype });
  } catch (error) {
    console.error('Error retrieving client metals:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.getClientTotals = async (req, res) => {
  const clientID = req.params.clientID;
  try {
    const client = await getClientByID(clientID);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    const totals = await getClientTotals(client.clienttype, clientID);
    res.status(200).json({ totals });
  } catch (error) {
    console.error('Error retrieving client totals:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.addClient = async (req, res) => {
  const {
    clientname,
    clientlocation,
    clienttype,
    avgtimebetweenpickups,
    locationnotes,
    locationcontact,
    paymentmethod
  } = req.body;

  // Validate payment method
  const validPaymentMethods = ['Cash', 'Check', 'Direct Deposit'];
  if (!validPaymentMethods.includes(paymentmethod)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }

  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query('BEGIN');

    // Insert new client
    const clientQuery = `
      INSERT INTO Client (
        ClientName, ClientLocation, ClientType, AvgTimeBetweenPickups,
        LocationNotes, LocationContact, PaymentMethod, RegistrationDate, 
        TotalPayout, TotalVolume, LastPickupDate, NeedsPickup
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, 0, 0, CURRENT_DATE, false)
      RETURNING ClientID
    `;
    const { rows } = await client.query(clientQuery, [
      clientname, clientlocation, clienttype, avgtimebetweenpickups,
      locationnotes || '', locationcontact || '', paymentmethod
    ]);

    const clientID = rows[0].clientid;

    // Initialize client totals based on client type
    let totalsQuery;
    if (clienttype === 'auto') {
      totalsQuery = 'INSERT INTO AutoClientTotals (ClientID) VALUES ($1)';
    } else if (clienttype === 'hvac') {
      totalsQuery = 'INSERT INTO HVACClientTotals (ClientID) VALUES ($1)';
    } else if (clienttype === 'insulation') {
      totalsQuery = 'INSERT INTO InsulationClientTotals (ClientID) VALUES ($1)';
    }
    
    if (totalsQuery) {
      await client.query(totalsQuery, [clientID]);
    }

    // Commit the transaction
    await client.query('COMMIT');

    res.status(201).json({ success: true, message: 'Client added successfully', clientID });
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error adding client:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding the client' });
  } finally {
    // Release the client back to the pool
    client.release();
  }
};

// Helper functions for client operations
async function getClients() {
  const { rows } = await pool.query('SELECT * FROM Client');
  return rows;
}

async function getClientByID(clientID) {
  const { rows } = await pool.query('SELECT * FROM Client WHERE ClientID = $1', [clientID]);
  return rows[0];
}

async function getClientsWithPickupInfo() {
  const { rows } = await pool.query('SELECT ClientName, ClientLocation, LastPickupDate, NeedsPickup FROM Client');
  return rows;
}

async function updateClient(clientData) {
  const {
    clientid,
    clientname,
    clientlocation,
    clienttype,
    avgtimebetweenpickups,
    locationnotes,
    registrationdate,
    locationcontact,
    totalpayout,
    totalvolume,
    paymentmethod,
    lastpickupdate,
    needspickup
  } = clientData;

  await pool.query(`
    UPDATE Client
    SET
      ClientName = $1,
      ClientLocation = $2,
      ClientType = $3,
      AvgTimeBetweenPickups = $4,
      LocationNotes = $5,
      RegistrationDate = $6,
      LocationContact = $7,
      TotalPayout = $8,
      TotalVolume = $9,
      PaymentMethod = $10,
      LastPickupDate = $11,
      NeedsPickup = $12
    WHERE ClientID = $13
  `, [
    clientname,
    clientlocation,
    clienttype,
    avgtimebetweenpickups,
    locationnotes,
    registrationdate,
    locationcontact,
    totalpayout,
    totalvolume,
    paymentmethod,
    lastpickupdate,
    needspickup,
    clientid
  ]);
}

async function getClientMetals(clientType, clientID) {
  let query;
  switch (clientType.toLowerCase()) {

    case 'auto':
      query = `SELECT 
        TotalDrumsRotors as "Drums & Rotors",
        TotalShortIron as "Short Iron",
        TotalShredSteel as "Shred Steel",
        TotalAluminumBreakage as "Aluminum Breakage",
        TotalDirtyAluminumRadiators as "Dirty Aluminum Radiators",
        TotalWiringHarness as "Wiring Harness",
        TotalACCompressor as "A/C Compressor",
        TotalAlternatorStarter as "Alternator/Starter",
        TotalAluminumRims as "Aluminum Rims",
        TotalChromeRims as "Chrome Rims",
        TotalBrassCopperRadiator as "Brass Copper Radiator"
      FROM AutoClientTotals WHERE ClientID = $1`;
      break;

    case 'hvac':
      query = `SELECT 
        TotalShredSteel as "Shred Steel",
        TotalDirtyAlumCopperRadiators as "Dirty Alum/Copper Radiators",
        TotalCleanAluminumRadiators as "Clean Aluminum Radiators",
        TotalCopperTwo as "#2 Copper",
        TotalCompressors as "Compressors",
        TotalDirtyBrass as "Dirty Brass",
        TotalElectricMotors as "Electric Motors",
        TotalAluminumBreakage as "Aluminum Breakage"
      FROM HVACClientTotals WHERE ClientID = $1`;
      break;

    case 'insulation':
      query = `SELECT 
        TotalDumpFees as "Dump Fees",
        TotalHaulFees as "Haul Fees"
      FROM InsulationClientTotals WHERE ClientID = $1`;
      break;

    case 'other':
      query = `
        SELECT udm.MetalName as "Metal", SUM(udm.Weight) as "Weight"
        FROM UserDefinedMetal udm
        JOIN Receipt r ON udm.ReceiptID = r.ReceiptID
        WHERE r.ClientID = $1
        GROUP BY udm.MetalName
      `;
      break;
    default:
      throw new Error('Invalid client type');
  }
  
  const { rows } = await pool.query(query, [clientID]);
  
  if (clientType.toLowerCase() === 'other') {
    // Return an object with metal names as keys and total weights as values
    return rows.reduce((acc, row) => {
      acc[row.Metal] = parseFloat(row.Weight);
      return acc;
    }, {});
  } else {
    // For other client types, return the existing format
    return rows[0] || {};
  }
}

async function getClientTotals(clientType, clientID) {
  let query;
  switch (clientType.toLowerCase()) {

    case 'auto':
      query = `
        SELECT act.TotalPayout, 
               (act.TotalDrumsRotors + act.TotalShortIron + act.TotalShredSteel + act.TotalAluminumBreakage + 
                act.TotalDirtyAluminumRadiators + act.TotalWiringHarness + act.TotalACCompressor + 
                act.TotalAlternatorStarter + act.TotalAluminumRims + act.TotalChromeRims + 
                act.TotalBrassCopperRadiator) as TotalVolume, 
               c.LastPickupDate 
        FROM AutoClientTotals act
        JOIN Client c ON c.ClientID = act.ClientID
        WHERE act.ClientID = $1
      `;
      break;

    case 'hvac':
      query = `
        SELECT hct.TotalPayout, 
                (hct.TotalShredSteel + hct.TotalDirtyAlumCopperRadiators + hct.TotalCleanAluminumRadiators + 
                hct.TotalCopperTwo + hct.TotalCompressors + hct.TotalDirtyBrass + 
                hct.TotalElectricMotors + hct.TotalAluminumBreakage) as TotalVolume, 
                c.LastPickupDate 
        FROM HVACClientTotals hct
        JOIN Client c ON c.ClientID = hct.ClientID
        WHERE hct.ClientID = $1
      `;
      break;

    case 'insulation':
      query = `
        SELECT ict.TotalDumpFees + ict.TotalHaulFees as TotalPayout, 
                0 as TotalVolume, 
                c.LastPickupDate 
        FROM InsulationClientTotals ict
        JOIN Client c ON c.ClientID = ict.ClientID
        WHERE ict.ClientID = $1
      `;
      break;

    case 'other':
      query = `
        SELECT 
          SUM(r.TotalPayout) as TotalPayout,
          SUM(r.TotalVolume) as TotalVolume,
          MAX(r.PickupDate) as LastPickupDate
        FROM Receipt r
        WHERE r.ClientID = $1
      `;
      break;
  
    default:
      throw new Error('Invalid client type');
  }
  
  const { rows } = await pool.query(query, [clientID]);
  return rows[0] || {};
}

async function searchClientsByTerm(term) {
  const { rows } = await pool.query(`
    SELECT * FROM Client
    WHERE ClientName ILIKE $1 OR ClientID ILIKE $1 OR ClientLocation ILIKE $1
  `, [`%${term}%`]);
  return rows;
}


// allows admins to edit the haul/dump fees 
// associated with insulation clients
exports.adjustInsulationFee = async (req, res) => {
  const { clientID, feeType, amount, isAddition } = req.body;

  try {
    let query;
    const columnName = feeType === 'dumpfee' ? 'TotalDumpFees' : 'TotalHaulFees';

    if (isAddition) {
      query = `
        UPDATE InsulationClientTotals
        SET ${columnName} = ${columnName} + $1
        WHERE ClientID = $2
        RETURNING ${columnName} as updatedFee
      `;
    } else {
      query = `
        UPDATE InsulationClientTotals
        SET ${columnName} = $1
        WHERE ClientID = $2
        RETURNING ${columnName} as updatedFee
      `;
    }

    const { rows } = await pool.query(query, [amount, clientID]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.status(200).json({ success: true, [feeType]: rows[0].updatedFee });
  } catch (error) {
    console.error('Error adjusting insulation fee:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};








// delete client and receipt functions


// this function works and is in use
exports.deleteReceipt = async (req, res) => {
  const { receiptID } = req.params;
  const { passcode } = req.body;

  if (passcode !== process.env.DELETE_PASSCODE) {
    return res.status(403).json({ message: 'Invalid passcode' });
  }

  try {
    await pool.query('BEGIN');

    // Fetch receipt details including client type
    const { rows: receiptRows } = await pool.query(`
      SELECT r.ClientID, r.TotalVolume, r.TotalPayout, c.ClientType
      FROM Receipt r
      JOIN Client c ON r.ClientID = c.ClientID
      WHERE r.ReceiptID = $1
    `, [receiptID]);
    
    if (receiptRows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const { clientid, totalvolume, totalpayout, clienttype } = receiptRows[0];

    // Delete related records and update totals based on client type
    switch (clienttype.toLowerCase()) {
      case 'auto':
        const { rows: autoMetals } = await pool.query('SELECT * FROM AutoReceiptMetals WHERE ReceiptID = $1', [receiptID]);
        if (autoMetals.length > 0) {
          await pool.query(`
            UPDATE AutoClientTotals
            SET TotalDrumsRotors = GREATEST(0, COALESCE(TotalDrumsRotors, 0) - COALESCE($1::decimal, 0)),
                TotalShortIron = GREATEST(0, COALESCE(TotalShortIron, 0) - COALESCE($2::decimal, 0)),
                TotalShredSteel = GREATEST(0, COALESCE(TotalShredSteel, 0) - COALESCE($3::decimal, 0)),
                TotalAluminumBreakage = GREATEST(0, COALESCE(TotalAluminumBreakage, 0) - COALESCE($4::decimal, 0)),
                TotalDirtyAluminumRadiators = GREATEST(0, COALESCE(TotalDirtyAluminumRadiators, 0) - COALESCE($5::decimal, 0)),
                TotalWiringHarness = GREATEST(0, COALESCE(TotalWiringHarness, 0) - COALESCE($6::decimal, 0)),
                TotalACCompressor = GREATEST(0, COALESCE(TotalACCompressor, 0) - COALESCE($7::decimal, 0)),
                TotalAlternatorStarter = GREATEST(0, COALESCE(TotalAlternatorStarter, 0) - COALESCE($8::decimal, 0)),
                TotalAluminumRims = GREATEST(0, COALESCE(TotalAluminumRims, 0) - COALESCE($9::decimal, 0)),
                TotalChromeRims = GREATEST(0, COALESCE(TotalChromeRims, 0) - COALESCE($10::decimal, 0)),
                TotalBrassCopperRadiator = GREATEST(0, COALESCE(TotalBrassCopperRadiator, 0) - COALESCE($11::decimal, 0)),
                TotalPayout = GREATEST(0, COALESCE(TotalPayout, 0) - COALESCE($12::decimal, 0))
            WHERE ClientID = $13
          `, [
            autoMetals[0].drumsrotorsweight, autoMetals[0].shortironweight, autoMetals[0].shredsteelweight,
            autoMetals[0].aluminumbreakageweight, autoMetals[0].dirtyaluminumradiatorsweight, autoMetals[0].wiringharnessweight,
            autoMetals[0].accompressorweight, autoMetals[0].alternatorstarterweight, autoMetals[0].aluminumrimsweight,
            autoMetals[0].chromerimweight, autoMetals[0].brasscopperradiatorweight, totalpayout, clientid
          ]);
        }
        await pool.query('DELETE FROM AutoReceiptMetals WHERE ReceiptID = $1', [receiptID]);
        await pool.query('DELETE FROM CatalyticConverter WHERE ReceiptID = $1', [receiptID]);
        break;

      case 'hvac':
        const { rows: hvacMetals } = await pool.query('SELECT * FROM HVACReceiptMetals WHERE ReceiptID = $1', [receiptID]);
        if (hvacMetals.length > 0) {
          await pool.query(`
            UPDATE HVACClientTotals
            SET TotalShredSteel = GREATEST(0, COALESCE(TotalShredSteel, 0) - COALESCE($1::decimal, 0)),
                TotalDirtyAlumCopperRadiators = GREATEST(0, COALESCE(TotalDirtyAlumCopperRadiators, 0) - COALESCE($2::decimal, 0)),
                TotalCleanAluminumRadiators = GREATEST(0, COALESCE(TotalCleanAluminumRadiators, 0) - COALESCE($3::decimal, 0)),
                TotalCopperTwo = GREATEST(0, COALESCE(TotalCopperTwo, 0) - COALESCE($4::decimal, 0)),
                TotalCompressors = GREATEST(0, COALESCE(TotalCompressors, 0) - COALESCE($5::decimal, 0)),
                TotalDirtyBrass = GREATEST(0, COALESCE(TotalDirtyBrass, 0) - COALESCE($6::decimal, 0)),
                TotalElectricMotors = GREATEST(0, COALESCE(TotalElectricMotors, 0) - COALESCE($7::decimal, 0)),
                TotalAluminumBreakage = GREATEST(0, COALESCE(TotalAluminumBreakage, 0) - COALESCE($8::decimal, 0)),
                TotalPayout = GREATEST(0, COALESCE(TotalPayout, 0) - COALESCE($9::decimal, 0))
            WHERE ClientID = $10
          `, [
            hvacMetals[0].shredsteelweight, hvacMetals[0].dirtyalumcopperradiatorsweight, hvacMetals[0].cleanaluminumradiatorsweight,
            hvacMetals[0].coppertwoweight, hvacMetals[0].compressorsweight, hvacMetals[0].dirtybrassweight,
            hvacMetals[0].electricmotorsweight, hvacMetals[0].aluminumbreakageweight, totalpayout, clientid
          ]);
        }
        await pool.query('DELETE FROM HVACReceiptMetals WHERE ReceiptID = $1', [receiptID]);
        break;

      case 'insulation':
        const { rows: insulationMetals } = await pool.query('SELECT * FROM InsulationReceiptMetals WHERE ReceiptID = $1', [receiptID]);
        if (insulationMetals.length > 0) {
          await pool.query(`
            UPDATE InsulationClientTotals
            SET TotalDumpFees = GREATEST(0, COALESCE(TotalDumpFees, 0) - COALESCE($1::decimal, 0)),
                TotalHaulFees = GREATEST(0, COALESCE(TotalHaulFees, 0) - COALESCE($2::decimal, 0))
            WHERE ClientID = $3
          `, [insulationMetals[0].dumpfee, insulationMetals[0].haulfee, clientid]);
        }
        await pool.query('DELETE FROM InsulationReceiptMetals WHERE ReceiptID = $1', [receiptID]);
        break;
    }

    // Delete common related records
    await pool.query('DELETE FROM UserDefinedMetal WHERE ReceiptID = $1', [receiptID]);
    await pool.query('DELETE FROM CheckPayments WHERE ReceiptID = $1', [receiptID]);

    // Delete the receipt
    await pool.query('DELETE FROM Receipt WHERE ReceiptID = $1', [receiptID]);

    // Update Client table
    await pool.query(`
      UPDATE Client 
      SET TotalVolume = GREATEST(0, COALESCE(TotalVolume, 0) - COALESCE($1::decimal, 0)), 
          TotalPayout = GREATEST(0, COALESCE(TotalPayout, 0) - COALESCE($2::decimal, 0)) 
      WHERE ClientID = $3
    `, [totalvolume, totalpayout, clientid]);

    await pool.query('COMMIT');
    res.status(200).json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting receipt:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};



// this function is not implemented in the front end
// (also has never been tested)
// it has too many cascading effects on the database
// seems too dangerous to give users this much power
exports.deleteClient = async (req, res) => {
  const { clientID } = req.params;
  const { passcode } = req.body;

  if (passcode !== process.env.DELETE_PASSCODE) {
    return res.status(403).json({ message: 'Invalid passcode' });
  }

  try {
    await pool.query('BEGIN');

    // Fetch client details
    const { rows } = await pool.query('SELECT ClientType FROM Client WHERE ClientID = $1', [clientID]);
    
    if (rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Client not found' });
    }

    const { clienttype } = rows[0];

    // Delete related records based on client type
    switch (clienttype.toLowerCase()) {
      case 'auto':
        await pool.query('DELETE FROM AutoClientTotals WHERE ClientID = $1', [clientID]);
        await pool.query(`
          DELETE FROM AutoReceiptMetals 
          WHERE ReceiptID IN (SELECT ReceiptID FROM Receipt WHERE ClientID = $1)
        `, [clientID]);
        await pool.query(`
          DELETE FROM CatalyticConverter 
          WHERE ReceiptID IN (SELECT ReceiptID FROM Receipt WHERE ClientID = $1)
        `, [clientID]);
        break;
      case 'hvac':
        await pool.query('DELETE FROM HVACClientTotals WHERE ClientID = $1', [clientID]);
        await pool.query(`
          DELETE FROM HVACReceiptMetals 
          WHERE ReceiptID IN (SELECT ReceiptID FROM Receipt WHERE ClientID = $1)
        `, [clientID]);
        break;
      case 'insulation':
        await pool.query('DELETE FROM InsulationClientTotals WHERE ClientID = $1', [clientID]);
        await pool.query(`
          DELETE FROM InsulationReceiptMetals 
          WHERE ReceiptID IN (SELECT ReceiptID FROM Receipt WHERE ClientID = $1)
        `, [clientID]);
        break;
    }

    // Delete common related records
    await pool.query('DELETE FROM Request WHERE ClientID = $1', [clientID]);
    await pool.query(`
      DELETE FROM UserDefinedMetal 
      WHERE ReceiptID IN (SELECT ReceiptID FROM Receipt WHERE ClientID = $1)
    `, [clientID]);
    await pool.query(`
      DELETE FROM CheckPayments 
      WHERE ReceiptID IN (SELECT ReceiptID FROM Receipt WHERE ClientID = $1)
    `, [clientID]);

    // Delete all receipts for this client
    await pool.query('DELETE FROM Receipt WHERE ClientID = $1', [clientID]);

    // Finally, delete the client
    const { rowCount } = await pool.query('DELETE FROM Client WHERE ClientID = $1', [clientID]);

    if (rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Client not found' });
    }

    await pool.query('COMMIT');

    res.status(200).json({ message: 'Client and all related data deleted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};







/*******************************************************
 *                       USERS                         *
 *                                                     *
 *    Functions for user-related operations            *
 *******************************************************/

exports.userDashboard = async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.editUser = async (req, res) => {
  const userID = req.params.userID;
  try {
    const user = await getUserByID(userID);
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateUser = async (req, res) => {
  const { userid, username, usertype } = req.body;
  console.log('Received update request:', req.body);

  try {
    if (!userid) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const updatedUser = await updateUserInfo(userid, username, usertype);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const userID = req.params.userID;
  try {
    await deleteUser(userID);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.searchUsers = async (req, res) => {
  const searchTerm = req.query.term;
  try {
    const users = await searchUsersByTerm(searchTerm);
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Helper functions for user operations
async function getUsers() {
    const { rows } = await pool.query('SELECT * FROM "User"');
    return rows;
  }
  
  async function getUserByID(userID) {
    const { rows } = await pool.query('SELECT * FROM "User" WHERE UserID = $1', [userID]);
    return rows[0];
  }
  
  async function updateUserInfo(userID, username, userType) {
    console.log(`Updating user: ID=${userID}, Username=${username}, UserType=${userType}`);
    if (!userID) {
      throw new Error('User ID is required');
    }
    const updateFields = [];
    const values = [];
    let paramCount = 1;
  
    if (username !== undefined) {
      updateFields.push(`Username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }
  
    if (userType !== undefined) {
      updateFields.push(`UserType = $${paramCount}`);
      values.push(userType);
      paramCount++;
    }
  
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
  
    values.push(userID);
    const query = `UPDATE "User" SET ${updateFields.join(', ')} WHERE UserID = $${paramCount} RETURNING *`;
    
    console.log('Executing query:', query);
    console.log('With values:', values);
  
    const result = await pool.query(query, values);
    console.log('Update result:', result.rows[0]);
    return result.rows[0];
  }
  
  async function deleteUser(userID) {
    await pool.query('DELETE FROM "User" WHERE UserID = $1', [userID]);
  }
  
  async function searchUsersByTerm(term) {
    const { rows } = await pool.query(`
      SELECT * FROM "User"
      WHERE Username ILIKE $1 OR UserID::text ILIKE $1
    `, [`%${term}%`]);
    return rows;
  }



  /*******************************************************
 *                        Prices                         *
 *                                                       *
 *       Functions for price set/get operations          *
 *******************************************************/



exports.getHVACPrices = async (req, res) => {
  try {
    const query = `
      SELECT 
        ShredSteelPrice as "Shred Steel",
        DirtyAlumCopperRadiatorsPrice as "Dirty Alum/Copper Radiators",
        CleanAluminumRadiatorsPrice as "Clean Aluminum Radiators",
        CopperTwoPrice as "#2 Copper",
        CompressorsPrice as "Compressors",
        DirtyBrassPrice as "Dirty Brass",
        ElectricMotorsPrice as "Electric Motors",
        AluminumBreakagePrice as "Aluminum Breakage"
      FROM SetHVACPrices
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows[0] || {});
  } catch (error) {
    console.error('Error retrieving HVAC prices:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
  
exports.setHVACPrices = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const prices = req.body;
    const query = `
      UPDATE SetHVACPrices SET
      ShredSteelPrice = $1,
      DirtyAlumCopperRadiatorsPrice = $2,
      CleanAluminumRadiatorsPrice = $3,
      CopperTwoPrice = $4,
      CompressorsPrice = $5,
      DirtyBrassPrice = $6,
      ElectricMotorsPrice = $7,
      AluminumBreakagePrice = $8
      RETURNING ShredSteelPrice
    `;
    const result = await client.query(query, [
      prices['Shred Steel'],
      prices['Dirty Alum/Copper Radiators'],
      prices['Clean Aluminum Radiators'],
      prices['#2 Copper'],
      prices['Compressors'],
      prices['Dirty Brass'],
      prices['Electric Motors'],
      prices['Aluminum Breakage']
    ]);

    const newShredSteelPrice = result.rows[0].shredsteelprice;

    // Get the current Auto shred steel price
    const autoQuery = 'SELECT ShredSteelPrice FROM SetAutoPrices';
    const autoResult = await client.query(autoQuery);
    const currentAutoShredSteelPrice = autoResult.rows[0].shredsteelprice;

    let shredSteelUpdated = false;

    // Update Auto prices table with new shred steel price if it's different
    if (newShredSteelPrice !== currentAutoShredSteelPrice) {
      await client.query(`
        UPDATE SetAutoPrices
        SET ShredSteelPrice = $1
      `, [newShredSteelPrice]);
      shredSteelUpdated = true;
    }

    await client.query('COMMIT');

    const message = shredSteelUpdated
      ? 'HVAC prices updated successfully. Shred steel price also updated in Auto prices.'
      : 'HVAC prices updated successfully.';

    res.status(200).json({ message });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting HVAC prices:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};
  
  exports.getAutoPrices = async (req, res) => {
    try {
      const query = `
        SELECT 
          DrumsRotorsPrice as "Drums & Rotors",
          ShortIronPrice as "Short Iron",
          ShredSteelPrice as "Shred Steel",
          AluminumBreakagePrice as "Aluminum Breakage",
          DirtyAluminumRadiatorsPrice as "Dirty Aluminum Radiators",
          WiringHarnessPrice as "Wiring Harness",
          ACCompressorPrice as "A/C Compressor",
          AlternatorStarterPrice as "Alternator/Starter",
          AluminumRimsPrice as "Aluminum Rims",
          ChromeRimsPrice as "Chrome Rims",
          BrassCopperRadiatorPrice as "Brass Copper Radiator"
        FROM SetAutoPrices
      `;
      const { rows } = await pool.query(query);
      res.status(200).json(rows[0] || {});
    } catch (error) {
      console.error('Error retrieving Auto prices:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.setAutoPrices = async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      const prices = req.body;
      const query = `
        UPDATE SetAutoPrices SET
        DrumsRotorsPrice = $1,
        ShortIronPrice = $2,
        ShredSteelPrice = $3,
        AluminumBreakagePrice = $4,
        DirtyAluminumRadiatorsPrice = $5,
        WiringHarnessPrice = $6,
        ACCompressorPrice = $7,
        AlternatorStarterPrice = $8,
        AluminumRimsPrice = $9,
        ChromeRimsPrice = $10,
        BrassCopperRadiatorPrice = $11
        RETURNING ShredSteelPrice
      `;
      const result = await client.query(query, [
        prices['Drums & Rotors'],
        prices['Short Iron'],
        prices['Shred Steel'],
        prices['Aluminum Breakage'],
        prices['Dirty Aluminum Radiators'],
        prices['Wiring Harness'],
        prices['A/C Compressor'],
        prices['Alternator/Starter'],
        prices['Aluminum Rims'],
        prices['Chrome Rims'],
        prices['Brass Copper Radiator']
      ]);
  
      const newShredSteelPrice = result.rows[0].shredsteelprice;
  
      // Get the current HVAC shred steel price
      const hvacQuery = 'SELECT ShredSteelPrice FROM SetHVACPrices';
      const hvacResult = await client.query(hvacQuery);
      const currentHVACShredSteelPrice = hvacResult.rows[0].shredsteelprice;
  
      let shredSteelUpdated = false;
  
      // Update HVAC prices table with new shred steel price if it's different
      if (newShredSteelPrice !== currentHVACShredSteelPrice) {
        await client.query(`
          UPDATE SetHVACPrices
          SET ShredSteelPrice = $1
        `, [newShredSteelPrice]);
        shredSteelUpdated = true;
      }
  
      await client.query('COMMIT');
  
      const message = shredSteelUpdated
        ? 'Auto prices updated successfully. Shred steel price also updated in HVAC prices.'
        : 'Auto prices updated successfully.';
  
      res.status(200).json({ message });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error setting Auto prices:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    } finally {
      client.release();
    }
  };

  exports.getViewPrices = async (req, res) => {
    try {
      const hvacQuery = `
        SELECT 
          ShredSteelPrice as "Shred Steel",
          DirtyAlumCopperRadiatorsPrice as "Dirty Alum/Copper Radiators",
          CleanAluminumRadiatorsPrice as "Clean Aluminum Radiators",
          CopperTwoPrice as "#2 Copper",
          CompressorsPrice as "Compressors",
          DirtyBrassPrice as "Dirty Brass",
          ElectricMotorsPrice as "Electric Motors",
          AluminumBreakagePrice as "Aluminum Breakage"
        FROM SetHVACPrices
      `;
  
      const autoQuery = `
        SELECT 
          DrumsRotorsPrice as "Drums & Rotors",
          ShortIronPrice as "Short Iron",
          ShredSteelPrice as "Shred Steel",
          AluminumBreakagePrice as "Aluminum Breakage",
          DirtyAluminumRadiatorsPrice as "Dirty Aluminum Radiators",
          WiringHarnessPrice as "Wiring Harness",
          ACCompressorPrice as "A/C Compressor",
          AlternatorStarterPrice as "Alternator/Starter",
          AluminumRimsPrice as "Aluminum Rims",
          ChromeRimsPrice as "Chrome Rims",
          BrassCopperRadiatorPrice as "Brass Copper Radiator"
        FROM SetAutoPrices
      `;
  
      const [hvacPrices, autoPrices] = await Promise.all([
        pool.query(hvacQuery),
        pool.query(autoQuery)
      ]);
  
      res.status(200).json({
        hvacPrices: hvacPrices.rows[0],
        autoPrices: autoPrices.rows[0]
      });
    } catch (error) {
      console.error('Error retrieving prices:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };



  
  /*******************************************************
   *                     RECEIPTS                        *
   *                                                     *
   *    Functions for receipt-related operations         *
   *******************************************************/
  

  exports.receiptList = async (req, res) => {
    try {
      const { term, date } = req.query;
      const receipts = await getReceipts(term, date);
      res.status(200).json({ receipts });
    } catch (error) {
      console.error('Error retrieving receipts:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.receiptInfo = async (req, res) => {
    const receiptID = req.params.receiptID;
    try {
      const query = `
        SELECT r.*, c.ClientName, c.ClientType
        FROM Receipt r
        JOIN Client c ON r.ClientID = c.ClientID
        WHERE r.ReceiptID = $1
      `;
      const { rows } = await pool.query(query, [receiptID]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Receipt not found' });
      }
      const receipt = rows[0];
      const customMetals = await getCustomMetals(receiptID);
      const catalyticConverters = await getCatalyticConverters(receiptID);
      res.status(200).json({ receipt, customMetals, catalyticConverters });
    } catch (error) {
      console.error('Error retrieving receipt:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  };
  
  exports.searchReceipts = async (req, res) => {
    const searchTerm = req.query.term;
    try {
      const receipts = await searchReceiptsByTerm(searchTerm);
      res.status(200).json({ receipts });
    } catch (error) {
      console.error('Error searching receipts:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.receiptMetals = async (req, res) => {
    const receiptID = req.params.receiptID;
    try {
      console.log(`Fetching receipt with ID: ${receiptID}`);
      const receipt = await getReceiptWithClientType(receiptID);
      console.log('Receipt data:', receipt);
  
      if (!receipt) {
        console.log('Receipt not found');
        return res.status(404).json({ message: 'Receipt not found' });
      }
      if (!receipt.clienttype) {
        console.log('Client type not found for this receipt');
        return res.status(400).json({ message: 'Client type not found for this receipt' });
      }
  
      let metals = {};
      
      // Fetch predefined metals based on client type
      if (receipt.clienttype !== 'other') {
        const predefinedMetalsQuery = getPredefinedMetalsQuery(receipt.clienttype);
        const { rows: predefinedMetals } = await pool.query(predefinedMetalsQuery, [receiptID]);
        if (predefinedMetals.length > 0) {
          metals = predefinedMetals[0];
        }
      }
  
      // Fetch custom metals for all client types
      const customMetalsQuery = `
        SELECT MetalName, Weight
        FROM UserDefinedMetal
        WHERE ReceiptID = $1
      `;
      const { rows: customMetals } = await pool.query(customMetalsQuery, [receiptID]);
  
      // Merge custom metals with predefined metals
      customMetals.forEach(metal => {
        metals[metal.metalname] = parseFloat(metal.weight) || 0;
      });
  
      // Convert all values to numbers and remove any zero values
      metals = Object.entries(metals).reduce((acc, [key, value]) => {
        const numValue = parseFloat(value);
        if (numValue !== 0) {
          acc[key] = numValue;
        }
        return acc;
      }, {});
  
      console.log('Final metals data:', metals);
  
      res.status(200).json({ metals });
    } catch (error) {
      console.error('Error retrieving receipt metals:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  };
  
  function getPredefinedMetalsQuery(clientType) {
    switch (clientType.toLowerCase()) {
      case 'auto':
        return `
          SELECT 
            DrumsRotorsWeight as "Drums & Rotors",
            ShortIronWeight as "Short Iron",
            ShredSteelWeight as "Shred Steel",
            AluminumBreakageWeight as "Aluminum Breakage",
            DirtyAluminumRadiatorsWeight as "Dirty Aluminum Radiators",
            WiringHarnessWeight as "Wiring Harness",
            ACCompressorWeight as "A/C Compressor",
            AlternatorStarterWeight as "Alternator/Starter",
            AluminumRimsWeight as "Aluminum Rims",
            ChromeRimsWeight as "Chrome Rims",
            BrassCopperRadiatorWeight as "Brass Copper Radiator"
          FROM AutoReceiptMetals WHERE ReceiptID = $1
        `;
      case 'hvac':
        return `
          SELECT 
            ShredSteelWeight as "Shred Steel",
            DirtyAlumCopperRadiatorsWeight as "Dirty Alum/Copper Radiators",
            CleanAluminumRadiatorsWeight as "Clean Aluminum Radiators",
            CopperTwoWeight as "#2 Copper",
            CompressorsWeight as "Compressors",
            DirtyBrassWeight as "Dirty Brass",
            ElectricMotorsWeight as "Electric Motors",
            AluminumBreakageWeight as "Aluminum Breakage"
          FROM HVACReceiptMetals WHERE ReceiptID = $1
        `;
      case 'insulation':
        return `
          SELECT 
            DumpFee as "Dump Fee",
            HaulFee as "Haul Fee"
          FROM InsulationReceiptMetals WHERE ReceiptID = $1
        `;
      default:
        return null;
    }
  }
  
  exports.customMetals = async (req, res) => {
    const receiptID = req.params.receiptID;
    try {
      const customMetals = await getCustomMetals(receiptID);
      res.status(200).json({ customMetals });
    } catch (error) {
      console.error('Error retrieving custom metals:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.catalyticConverters = async (req, res) => {
    const receiptID = req.params.receiptID;
    try {
      const catalyticConverters = await getCatalyticConverters(receiptID);
      res.status(200).json({ catalyticConverters });
    } catch (error) {
      console.error('Error retrieving catalytic converters:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  // Helper functions for receipt operations
  async function getReceipts(term, date) {
    let query = `
      SELECT r.*, c.ClientName 
      FROM Receipt r
      JOIN Client c ON r.ClientID = c.ClientID
      WHERE 1=1
    `;
    const queryParams = [];
  
    if (term) {
      query += ` AND (c.ClientName ILIKE $${queryParams.length + 1} OR r.ReceiptID::text ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${term}%`);
    }
  
    if (date) {
      query += ` AND r.PickupDate::date = $${queryParams.length + 1}`;
      queryParams.push(date);
    }
  
    query += ' ORDER BY r.PickupDate DESC, r.PickupTime DESC';
  
    const { rows } = await pool.query(query, queryParams);
    return rows;
  }
  
  async function getCustomMetals(receiptID) {
    const { rows } = await pool.query('SELECT * FROM UserDefinedMetal WHERE ReceiptID = $1', [receiptID]);
    return rows;
  }
  
  async function getCatalyticConverters(receiptID) {
    const { rows } = await pool.query('SELECT * FROM CatalyticConverter WHERE ReceiptID = $1', [receiptID]);
    return rows;
  }
  
  async function searchReceiptsByTerm(term) {
    const { rows } = await pool.query(`
      SELECT r.*, c.ClientName 
      FROM Receipt r
      JOIN Client c ON r.ClientID = c.ClientID
      WHERE r.ReceiptID::text ILIKE $1 OR c.ClientName ILIKE $1
    `, [`%${term}%`]);
    return rows;
  }
  
  async function getReceiptWithClientType(receiptID) {
    const query = `
      SELECT r.*, c.ClientType 
      FROM Receipt r 
      JOIN Client c ON r.ClientID = c.ClientID 
      WHERE r.ReceiptID = $1
    `;
    console.log('Executing query:', query);
    console.log('With parameter:', receiptID);
  
    const { rows } = await pool.query(query, [receiptID]);
    console.log('Query result:', rows);
  
    if (rows.length === 0) {
      console.log('No receipt found with this ID');
      return null;
    }
  
    return rows[0];
  }
  
  exports.getReceiptByClientAndDate = async (req, res) => {
    const { clientId, date } = req.query;
    try {
      const { rows } = await pool.query(`
        SELECT ReceiptID
        FROM Receipt
        WHERE ClientID = $1 AND PickupDate::date = $2::date
        ORDER BY PickupTime DESC
        LIMIT 1
      `, [clientId, date]);
      
      if (rows.length > 0) {
        res.status(200).json({ receipt: rows[0] });
      } else {
        res.status(404).json({ message: 'No receipt found for this client and date' });
      }
    } catch (error) {
      console.error('Error fetching receipt:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  exports.searchPickups = async (req, res) => {
    try {
      const { term, date, timeZone } = req.query;
      let query;
      let queryParams;
  
      if (term) {
        // Search by client name or location (no changes needed here)
        query = `
          WITH RankedReceipts AS (
            SELECT r.*, c.ClientName, c.ClientLocation, c.NeedsPickup,
                   ROW_NUMBER() OVER (PARTITION BY r.ClientID ORDER BY r.PickupDate DESC, r.PickupTime DESC) as rn
            FROM Receipt r
            JOIN Client c ON r.ClientID = c.ClientID
            WHERE c.ClientName ILIKE $1 OR c.ClientLocation ILIKE $1
          )
          SELECT * FROM RankedReceipts WHERE rn = 1
          ORDER BY PickupDate DESC, PickupTime DESC
        `;
        queryParams = [`%${term}%`];
      } else if (date && timeZone) {
        // Search by date, considering the time zone
        const userDate = toDate(date, { timeZone });
        const startOfDayUTC = formatInTimeZone(userDate, timeZone, "yyyy-MM-dd'T'00:00:00XXX");
        const endOfDayUTC = formatInTimeZone(userDate, timeZone, "yyyy-MM-dd'T'23:59:59XXX");
  
        query = `
          SELECT r.*, c.ClientName, c.ClientLocation, c.NeedsPickup
          FROM Receipt r
          JOIN Client c ON r.ClientID = c.ClientID
          WHERE r.PickupTime >= $1::timestamp WITH TIME ZONE
            AND r.PickupTime < $2::timestamp WITH TIME ZONE
          ORDER BY r.PickupTime DESC
        `;
        queryParams = [startOfDayUTC, endOfDayUTC];
      } else {
        throw new Error('Either term or both date and timeZone must be provided');
      }
  
      const { rows } = await pool.query(query, queryParams);
      res.status(200).json({ receipts: rows });
    } catch (error) {
      console.error('Error searching pickups:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };




// function to make CSV file from receipt/client data
exports.generateCSV = async (req, res) => {
  const { startDate, endDate, columnOrder, columnNames } = req.body;

  try {
    // Check for unresolved checks
    const unresolvedChecks = await checkUnresolvedChecks(startDate, endDate);
    if (unresolvedChecks.length > 0) {
      return res.status(400).json({ 
        message: 'Unresolved checks found. Please resolve before generating CSV.', 
        unresolvedChecks 
      });
    }

    // Fetch all receipts within the date range
    const query = `
      SELECT r.ReceiptID, c.ClientName, r.PickupDate, c.PaymentMethod, r.TotalPayout, cp.CheckNumber
      FROM Receipt r
      JOIN Client c ON r.ClientID = c.ClientID
      LEFT JOIN CheckPayments cp ON r.ReceiptID = cp.ReceiptID
      WHERE r.PickupDate::date BETWEEN $1::date AND $2::date
      ORDER BY r.PickupDate
    `;
    
    const { rows } = await pool.query(query, [startDate, endDate]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No receipts found for the specified date range.' });
    }

    // Generate CSV content
    const csvContent = rows.map(row => {
      const paymentMethod = row.checknumber ? 'Check' : row.paymentmethod;
      return columnOrder.map(field => {
        switch(field) {
          case 'ClientName':
            return row.clientname || '';
          case 'PickupDate':
            return row.pickupdate ? new Date(row.pickupdate).toLocaleDateString() : '';
          case 'PaymentMethod':
            return paymentMethod || '';
          case 'TotalPayout':
            return row.totalpayout ? parseFloat(row.totalpayout).toFixed(2) : '';
          case 'CheckNumber':
            return row.checknumber || '';
          default:
            return '';
        }
      }).join(',');
    }).join('\n');

    const header = columnOrder.map(field => columnNames[field]).join(',');
    const fullCSV = header + '\n' + csvContent;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=receipts.csv');
    res.status(200).send(fullCSV);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ message: 'An error occurred while generating the CSV file.' });
  }
};

async function checkUnresolvedChecks(startDate, endDate) {
  const query = `
    SELECT r.ReceiptID, c.ClientName, r.PickupDate
    FROM Receipt r
    JOIN Client c ON r.ClientID = c.ClientID
    JOIN CheckPayments cp ON r.ReceiptID = cp.ReceiptID
    WHERE r.PickupDate::date BETWEEN $1::date AND $2::date AND cp.CheckNumber = '0000'
  `;
  const { rows } = await pool.query(query, [startDate, endDate]);
  return rows;
}


exports.updateReceipt = async (req, res) => {
  const { receiptid, totalpayout, paymentmethod } = req.body;
  try {
    const query = `
      UPDATE Receipt
      SET TotalPayout = $1, PaymentMethod = $2
      WHERE ReceiptID = $3
      RETURNING *
    `;
    const { rows } = await pool.query(query, [totalpayout, paymentmethod, receiptid]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    res.status(200).json({ message: 'Receipt updated successfully', receipt: rows[0] });
  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};




  /*******************************************************
   *                     REQUESTS                        *
   *                                                     *
   *    Functions for request-related operations         *
   *******************************************************/
  
  exports.getRequests = async (req, res) => {
    const { sortOrder = 'asc', searchTerm, startDate, endDate } = req.query;
    try {
      let query = `
        SELECT r.*, c.ClientName, c.ClientLocation
        FROM Request r
        JOIN Client c ON r.ClientID = c.ClientID
        WHERE 1=1
      `;
      const queryParams = [];
  
      if (searchTerm) {
        query += `
          AND (c.ClientName ILIKE $${queryParams.length + 1}
          OR c.ClientID ILIKE $${queryParams.length + 1}
          OR r.RequestID::text ILIKE $${queryParams.length + 1})
        `;
        queryParams.push(`%${searchTerm}%`);
      }
  
      if (startDate) {
        query += ` AND r.RequestDate >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }
  
      if (endDate) {
        query += ` AND r.RequestDate <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }
  
      query += ` ORDER BY r.RequestDate ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
  
      const { rows } = await pool.query(query, queryParams);
      res.status(200).json({ requests: rows });
    } catch (error) {
      console.error('Error retrieving requests:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.getRequestById = async (req, res) => {
    const requestID = req.params.requestID;
    try {
      const query = `
        SELECT r.*, c.ClientName, c.ClientLocation
        FROM Request r
        JOIN Client c ON r.ClientID = c.ClientID
        WHERE r.RequestID = $1
      `;
      const { rows } = await pool.query(query, [requestID]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Request not found' });
      }
      res.status(200).json({ request: rows[0] });
    } catch (error) {
      console.error('Error retrieving request:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.createRequest = async (req, res) => {
    const { clientID, requestDate, requestTime, numFullBarrels, largeObjects, notes } = req.body;
    try {
      // Check if there's an existing open request for this client
      const existingRequest = await pool.query(
        'SELECT * FROM Request WHERE ClientID = $1 AND RequestDate > NOW() ORDER BY RequestDate ASC LIMIT 1',
        [clientID]
      );
  
      if (existingRequest.rows.length > 0) {
        // If there's an existing request, update it instead of creating a new one
        const updatedRequest = await pool.query(
          'UPDATE Request SET RequestDate = $1, RequestTime = $2, NumFullBarrels = $3, LargeObjects = $4, Notes = $5 WHERE RequestID = $6 RETURNING *',
          [requestDate, requestTime, numFullBarrels, largeObjects, notes, existingRequest.rows[0].requestid]
        );
        return res.status(200).json({ message: 'Existing request updated', request: updatedRequest.rows[0] });
      }
  
      // If no existing request, create a new one
      const { rows } = await pool.query(
        'INSERT INTO Request (ClientID, RequestDate, RequestTime, NumFullBarrels, LargeObjects, Notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [clientID, requestDate, requestTime, numFullBarrels, largeObjects, notes]
      );
      res.status(201).json({ request: rows[0] });
    } catch (error) {
      console.error('Error creating/updating request:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.updateRequest = async (req, res) => {
    const requestID = req.params.requestID;
    const { numFullBarrels, largeObjects, notes } = req.body;
    try {
      const { rows } = await pool.query(
        'UPDATE Request SET NumFullBarrels = $1, LargeObjects = $2, Notes = $3 WHERE RequestID = $4 RETURNING *',
        [numFullBarrels, largeObjects, notes, requestID]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Request not found' });
      }
      res.status(200).json({ request: rows[0] });
    } catch (error) {
      console.error('Error updating request:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.deleteRequest = async (req, res) => {
    const { requestID } = req.params;
    try {
      const { rowCount } = await pool.query('DELETE FROM Request WHERE RequestID = $1', [requestID]);
      if (rowCount === 0) {
        return res.status(404).json({ message: 'Request not found' });
      }
      res.status(200).json({ message: 'Request deleted successfully' });
    } catch (error) {
      console.error('Error deleting request:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  exports.deleteMultipleRequests = async (req, res) => {
    const { requestIDs } = req.body;
    if (!Array.isArray(requestIDs) || requestIDs.length === 0) {
      return res.status(400).json({ message: 'Invalid request IDs' });
    }
  
    try {
      const placeholders = requestIDs.map((_, index) => `$${index + 1}`).join(', ');
      const query = `DELETE FROM Request WHERE RequestID IN (${placeholders})`;
      
      const { rowCount } = await pool.query(query, requestIDs);
      
      if (rowCount === 0) {
        return res.status(404).json({ message: 'No requests found' });
      }
      
      res.status(200).json({ message: `${rowCount} request(s) deleted successfully` });
    } catch (error) {
      console.error('Error deleting multiple requests:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  


  
  /*******************************************************
   *                  DATA ANALYTICS                     *
   *                                                     *
   *    Functions for data analysis and reporting        *
   *******************************************************/

  exports.getTruckLoads = async (req, res) => {
    const { date, timeZone } = req.query;
    if (!date || !timeZone) {
      return res.status(400).json({ message: 'Date and time zone are required' });
    }
  
    try {
      const truckLoads = await fetchTruckLoadsForDate(date, timeZone);
      res.status(200).json({ truckLoads });
    } catch (error) {
      console.error('Error fetching truck loads:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  async function fetchTruckLoadsForDate(date, timeZone) {
    console.log('Received from frontend:', { date, timeZone });
  
    // Parse the input date as if it were in the user's time zone
    const userDate = toDate(date, { timeZone });
    
    // Create start and end of day in user's time zone
    const startOfDayLocal = startOfDay(userDate);
    const endOfDayLocal = endOfDay(userDate);
    
    // Convert start and end of day to UTC
    const startOfDayUTC = fromZonedTime(startOfDayLocal, timeZone);
    const endOfDayUTC = fromZonedTime(endOfDayLocal, timeZone);
  
    // Format UTC dates for SQL query
    const startOfDayUTCString = formatInTimeZone(startOfDayUTC, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
    const endOfDayUTCString = formatInTimeZone(endOfDayUTC, 'UTC', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  
    console.log('Query date range:', startOfDayUTCString, 'to', endOfDayUTCString);
  
    const query = `
      WITH TruckTotals AS (
        SELECT 
          CreatedBy,
          SUM(TotalVolume) as TotalWeight,
          MAX(PickupDate) as LastReceiptDate,
          MAX(PickupTime) as LastReceiptTime
        FROM Receipt
        WHERE PickupTime >= $1::timestamp WITH TIME ZONE 
          AND PickupTime < $2::timestamp WITH TIME ZONE
        GROUP BY CreatedBy
      ),
      MetalBreakdown AS (
        SELECT 
          r.CreatedBy,
          COALESCE(arm.DrumsRotorsWeight, 0) +
          COALESCE(arm.ShortIronWeight, 0) +
          COALESCE(arm.ShredSteelWeight, 0) +
          COALESCE(arm.AluminumBreakageWeight, 0) +
          COALESCE(arm.DirtyAluminumRadiatorsWeight, 0) +
          COALESCE(arm.WiringHarnessWeight, 0) +
          COALESCE(arm.ACCompressorWeight, 0) +
          COALESCE(arm.AlternatorStarterWeight, 0) +
          COALESCE(arm.AluminumRimsWeight, 0) +
          COALESCE(arm.ChromeRimsWeight, 0) +
          COALESCE(arm.BrassCopperRadiatorWeight, 0) as AutoWeight,
          COALESCE(hrm.ShredSteelWeight, 0) +
          COALESCE(hrm.DirtyAlumCopperRadiatorsWeight, 0) +
          COALESCE(hrm.CleanAluminumRadiatorsWeight, 0) +
          COALESCE(hrm.CopperTwoWeight, 0) +
          COALESCE(hrm.CompressorsWeight, 0) +
          COALESCE(hrm.DirtyBrassWeight, 0) +
          COALESCE(hrm.ElectricMotorsWeight, 0) +
          COALESCE(hrm.AluminumBreakageWeight, 0) as HVACWeight,
          COALESCE(SUM(udm.Weight), 0) as CustomWeight
        FROM Receipt r
        LEFT JOIN AutoReceiptMetals arm ON r.ReceiptID = arm.ReceiptID
        LEFT JOIN HVACReceiptMetals hrm ON r.ReceiptID = hrm.ReceiptID
        LEFT JOIN UserDefinedMetal udm ON r.ReceiptID = udm.ReceiptID
        WHERE r.PickupTime >= $1::timestamp WITH TIME ZONE 
          AND r.PickupTime < $2::timestamp WITH TIME ZONE
        GROUP BY r.CreatedBy, r.ReceiptID, arm.ReceiptID, hrm.ReceiptID
      )
      SELECT 
        tt.CreatedBy,
        tt.TotalWeight,
        tt.LastReceiptDate,
        tt.LastReceiptTime,
        json_build_object(
          'Auto Metals', SUM(mb.AutoWeight),
          'HVAC Metals', SUM(mb.HVACWeight),
          'Custom Metals', SUM(mb.CustomWeight)
        ) as Metals
      FROM TruckTotals tt
      JOIN MetalBreakdown mb ON tt.CreatedBy = mb.CreatedBy
      GROUP BY tt.CreatedBy, tt.TotalWeight, tt.LastReceiptDate, tt.LastReceiptTime
    `;
    
    const { rows } = await pool.query(query, [startOfDayUTCString, endOfDayUTCString]);
    return rows.map(row => ({
      ...row,
      metals: row.metals,
      totalWeight: parseFloat(row.totalweight),
      lastReceiptDate: row.lastreceiptdate,
      lastReceiptTime: row.lastreceipttime
    }));
  }
  
  exports.getTopClientsByMetal = async (req, res) => {
    const { metal, limit = 10 } = req.query;
    try {
      let query;
      switch (metal.toLowerCase()) {

        case 'shredsteel':
          query = `
            SELECT c.ClientID, c.ClientName, 
              COALESCE(act.TotalShredSteel, 0) + COALESCE(hct.TotalShredSteel, 0) as TotalShredSteel
            FROM Client c
            LEFT JOIN AutoClientTotals act ON c.ClientID = act.ClientID
            LEFT JOIN HVACClientTotals hct ON c.ClientID = hct.ClientID
            ORDER BY TotalShredSteel DESC
            LIMIT $1
          `;
          break;

        case 'copper':
          query = `
            SELECT c.ClientID, c.ClientName, 
              COALESCE(hct.TotalCopperTwo, 0) as TotalCopper
            FROM Client c
            LEFT JOIN HVACClientTotals hct ON c.ClientID = hct.ClientID
            ORDER BY TotalCopper DESC
            LIMIT $1
          `;
          break;

      // Add more cases for other metals
      default:
        return res.status(400).json({ message: 'Invalid metal type' });
    }
    const { rows } = await pool.query(query, [limit]);
    res.status(200).json({ topClients: rows });
  } catch (error) {
    console.error('Error getting top clients by metal:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getTopClientsByVolume = async (req, res) => {
  const { limit = 10 } = req.query;
  try {
    const query = `
      SELECT c.ClientID, c.ClientName, c.TotalVolume
      FROM Client c
      ORDER BY c.TotalVolume DESC
      LIMIT $1
    `;
    const { rows } = await pool.query(query, [limit]);
    res.status(200).json({ topClients: rows });
  } catch (error) {
    console.error('Error getting top clients by volume:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateLastPickupDate = async (req, res) => {
  const { clientID } = req.params;
  try {
    const query = `
      UPDATE Client c
      SET LastPickupDate = (
        SELECT MAX(PickupDate)
        FROM Receipt r
        WHERE r.ClientID = c.ClientID
      )
      WHERE c.ClientID = $1
      RETURNING LastPickupDate
    `;
    const { rows } = await pool.query(query, [clientID]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json({ lastPickupDate: rows[0].lastpickupdate });
  } catch (error) {
    console.error('Error updating last pickup date:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.manualUpdatePickupDate = async (req, res) => {
  const { clientID } = req.params;
  const { pickupDate } = req.body;
  try {
    const query = `
      UPDATE Client
      SET LastPickupDate = $1
      WHERE ClientID = $2
      RETURNING LastPickupDate
    `;
    const { rows } = await pool.query(query, [pickupDate, clientID]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json({ lastPickupDate: rows[0].lastpickupdate });
  } catch (error) {
    console.error('Error manually updating pickup date:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};






/*******************************************************
 *                 Check Payments                      *
 *                                                     *
 *   Functions for check number/check payment logic    *
 *******************************************************/
exports.getCheckPayment = async (req, res) => {
  const { receiptID } = req.params;
  try {
    const query = 'SELECT CheckNumber FROM CheckPayments WHERE ReceiptID = $1';
    const { rows } = await pool.query(query, [receiptID]);
    res.json({ checkNumber: rows[0]?.checknumber || '' });
  } catch (error) {
    console.error('Error fetching check payment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getUnresolvedChecks = async (req, res) => {
  try {
    const query = `
      SELECT r.ReceiptID, c.ClientName, r.PickupDate
      FROM Receipt r
      JOIN Client c ON r.ClientID = c.ClientID
      JOIN CheckPayments cp ON r.ReceiptID = cp.ReceiptID
      WHERE cp.CheckNumber = '0000'
      ORDER BY r.PickupDate DESC
    `;
    const { rows } = await pool.query(query);
    res.status(200).json({ unresolvedChecks: rows });
  } catch (error) {
    console.error('Error fetching unresolved checks:', error);
    res.status(500).json({ message: 'Error fetching unresolved checks' });
  }
};

exports.updateCheckNumber = async (req, res) => {
  const { receiptID, checkNumber } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log(`Updating check number for receipt ${receiptID} to ${checkNumber}`);

    // Check if a record exists
    const checkExistingQuery = `
      SELECT * FROM CheckPayments WHERE ReceiptID = $1
    `;
    const existingResult = await client.query(checkExistingQuery, [receiptID]);

    let result;
    if (existingResult.rows.length > 0) {
      console.log(`Existing check payment found for receipt ${receiptID}. Updating...`);
      // Update existing record
      const updateQuery = `
        UPDATE CheckPayments
        SET CheckNumber = $1
        WHERE ReceiptID = $2
        RETURNING *
      `;
      result = await client.query(updateQuery, [checkNumber, receiptID]);
    } else {
      console.log(`No existing check payment found for receipt ${receiptID}. Inserting new record...`);
      // Insert new record
      const insertQuery = `
        INSERT INTO CheckPayments (ReceiptID, CheckNumber)
        VALUES ($1, $2)
        RETURNING *
      `;
      result = await client.query(insertQuery, [receiptID, checkNumber]);
    }

    console.log(`Check payment operation result:`, result.rows[0]);

    // Update the Receipt table to reflect that it's paid by check
    const updateReceiptQuery = `
      UPDATE Receipt
      SET PaymentMethod = 'Check'
      WHERE ReceiptID = $1
    `;
    await client.query(updateReceiptQuery, [receiptID]);

    await client.query('COMMIT');

    res.status(200).json({ message: 'Check number updated successfully', checkPayment: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating check number:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message, stack: error.stack });
  } finally {
    client.release();
  }
};

module.exports = exports;