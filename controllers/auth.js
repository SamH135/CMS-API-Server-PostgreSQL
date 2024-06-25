// controllers/auth.js

const pool = require("../db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
    const clients = await getClientsWithPickupInfo();
    res.status(200).json({ clients });
  } catch (error) {
    console.error('Error retrieving pickup information:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

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
  const { userID, username, userType } = req.body;
  try {
    await updateUserInfo(userID, username, userType);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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

exports.searchClients = async (req, res) => {
  const searchTerm = req.query.term;
  try {
    const clients = await searchClientsByTerm(searchTerm);
    res.status(200).json({ clients });
  } catch (error) {
    console.error('Error searching clients:', error);
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

exports.getClientMetals = async (req, res) => {
  console.log('In getClientMetals controller');
  const clientID = req.params.clientID;
  try {
    const client = await getClientByID(clientID);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    const metals = await getClientMetals(client.clienttype, clientID);
    res.status(200).json({ metals });
  } catch (error) {
    console.error('Error retrieving client metals:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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


// Receipt Control Functions
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

    console.log(`Fetching metals for client type: ${receipt.clienttype}`);
    const metals = await getReceiptMetals(receipt.clienttype, receiptID);
    console.log('Metals data:', metals);

    res.status(200).json({ metals });
  } catch (error) {
    console.error('Error retrieving receipt metals:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

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









// Helper functions for database queries
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

async function getUsers() {
  const { rows } = await pool.query('SELECT * FROM "User"');
  return rows;
}

async function getUserByID(userID) {
  const { rows } = await pool.query('SELECT * FROM "User" WHERE UserID = $1', [userID]);
  return rows[0];
}

async function updateUserInfo(userID, username, userType) {
  await pool.query('UPDATE "User" SET Username = $1, UserType = $2 WHERE UserID = $3', [username, userType, userID]);
}

async function deleteUser(userID) {
  await pool.query('DELETE FROM "User" WHERE UserID = $1', [userID]);
}

async function searchClientsByTerm(term) {
  const { rows } = await pool.query(`
    SELECT * FROM Client
    WHERE ClientName ILIKE $1 OR ClientID ILIKE $1 OR ClientLocation ILIKE $1
  `, [`%${term}%`]);
  return rows;
}

async function searchUsersByTerm(term) {
  const { rows } = await pool.query(`
    SELECT * FROM "User"
    WHERE Username ILIKE $1 OR UserID::text ILIKE $1
  `, [`%${term}%`]);
  return rows;
}

async function getClientMetals(clientType, clientID) {
  let query;
  switch (clientType.toLowerCase()) {
    case 'auto':
      query = `SELECT 
        TotalDrumsRotors as "Drums & Rotors",
        TotalShortIron as "Short Iron",
        TotalSteelShred as "Steel Shred",
        TotalAluminumRadiators as "Aluminum Radiators",
        TotalBrassCopperRadiators as "Brass/Copper Radiators",
        TotalAluminum as "Aluminum",
        TotalBatteries as "Batteries"
      FROM AutoClientTotals WHERE ClientID = $1`;
      break;
    case 'hvac':
      query = `SELECT 
        TotalSteelShred as "Steel Shred",
        TotalCopper as "Copper",
        TotalBrass as "Brass",
        TotalCompressors as "Compressors",
        TotalCopperCoils as "Copper Coils",
        TotalAluminumCoils as "Aluminum Coils",
        TotalWire as "Wire",
        TotalBrassCopperBreakage as "Brass/Copper Breakage",
        TotalElectricMotors as "Electric Motors"
      FROM HVACClientTotals WHERE ClientID = $1`;
      break;
    case 'insulation':
      query = `SELECT 
        TotalSteelShred as "Steel Shred",
        TotalLoadsOfTrash as "Loads of Trash"
      FROM InsulationClientTotals WHERE ClientID = $1`;
      break;
    default:
      throw new Error('Invalid client type');
  }
  
  const { rows } = await pool.query(query, [clientID]);
  return rows[0] || {};
}

async function getClientTotals(clientType, clientID) {
  let query;
  switch (clientType.toLowerCase()) {
    case 'auto':
      query = `
        SELECT act.TotalPayout, 
               (act.TotalDrumsRotors + act.TotalShortIron + act.TotalSteelShred + act.TotalAluminumRadiators + 
                act.TotalBrassCopperRadiators + act.TotalAluminum + act.TotalBatteries) as TotalVolume, 
               c.LastPickupDate 
        FROM AutoClientTotals act
        JOIN Client c ON c.ClientID = act.ClientID
        WHERE act.ClientID = $1
      `;
      break;
    case 'hvac':
      query = `
        SELECT hct.TotalPayout, 
               (hct.TotalSteelShred + hct.TotalCopper + hct.TotalBrass + hct.TotalCompressors + 
                hct.TotalCopperCoils + hct.TotalAluminumCoils + hct.TotalWire + 
                hct.TotalBrassCopperBreakage + hct.TotalElectricMotors) as TotalVolume, 
               c.LastPickupDate 
        FROM HVACClientTotals hct
        JOIN Client c ON c.ClientID = hct.ClientID
        WHERE hct.ClientID = $1
      `;
      break;
    case 'insulation':
      query = `
        SELECT ict.TotalPayout, 
               (ict.TotalSteelShred + ict.TotalLoadsOfTrash) as TotalVolume, 
               c.LastPickupDate 
        FROM InsulationClientTotals ict
        JOIN Client c ON c.ClientID = ict.ClientID
        WHERE ict.ClientID = $1
      `;
      break;
    default:
      throw new Error('Invalid client type');
  }
  
  const { rows } = await pool.query(query, [clientID]);
  return rows[0] || {};
}





// Helper functions
async function getReceipts() {
  const { rows } = await pool.query('SELECT * FROM Receipt ORDER BY PickupDate DESC');
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



async function getReceipts(term, date) {
  let query = `
    SELECT r.*, c.ClientName 
    FROM Receipt r
    JOIN Client c ON r.ClientID = c.ClientID
    WHERE 1=1
  `;
  const queryParams = [];

  if (term) {
    query += ` AND c.ClientName ILIKE $${queryParams.length + 1}`;
    queryParams.push(`%${term}%`);
  }

  if (date) {
    query += ` AND r.PickupDate::date = $${queryParams.length + 1}`;
    queryParams.push(date);
  }

  query += ' ORDER BY r.PickupDate DESC';

  const { rows } = await pool.query(query, queryParams);
  return rows;
}



async function getReceiptMetals(clientType, receiptID) {
  if (!clientType) {
    throw new Error('Client type is undefined');
  }

  let query;
  switch (clientType.toLowerCase()) {
    case 'auto':
      query = `SELECT * FROM AutoReceiptMetals WHERE ReceiptID = $1`;
      break;
    case 'hvac':
      query = `SELECT * FROM HVACReceiptMetals WHERE ReceiptID = $1`;
      break;
    case 'insulation':
      query = `SELECT * FROM InsulationReceiptMetals WHERE ReceiptID = $1`;
      break;
    default:
      throw new Error('Invalid client type: ' + clientType);
  }

  console.log('Executing metals query:', query);
  console.log('With parameter:', receiptID);

  const { rows } = await pool.query(query, [receiptID]);
  console.log('Metals query result:', rows);

  return rows[0] || {};
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