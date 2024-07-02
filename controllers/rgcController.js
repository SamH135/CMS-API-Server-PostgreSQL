// rgcController.js
const pool = require("../db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


exports.rgcLogin = async (req, res) => {
  console.log('RGC Login attempt');
  console.log('Request body:', req.body);
  const { passcode } = req.body;
  if (passcode === process.env.RGC_PASSCODE) {
    console.log('Passcode correct, generating token');
    const token = jwt.sign({}, process.env.RGC_JWT_SECRET, { expiresIn: '12h' });
    console.log('Token generated');
    res.json({ token });
  } else {
    console.log('Invalid passcode');
    res.status(401).json({ message: 'Invalid passcode' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT Username FROM "User"');
    res.json(rows.map(row => row.username));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.createUser = async (req, res) => {
  const { userID, username, password } = req.body;
  console.log('Create user request received:', { userID, username });

  try {
    // Check if User ID already exists
    const { rows: existingUserID } = await pool.query('SELECT UserID FROM "User" WHERE UserID = $1', [userID]);
    if (existingUserID.length > 0) {
      return res.status(400).json({ success: false, message: 'User ID already exists' });
    }

    // Check if Username already exists
    const { rows: existingUsername } = await pool.query('SELECT Username FROM "User" WHERE Username = $1', [username]);
    if (existingUsername.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    let hashedPassword = await bcrypt.hash(password, 8);
    console.log('Hashed password created');

    await pool.query('INSERT INTO "User" (UserID, Username, UserType, Password) VALUES ($1, $2, $3, $4)', [userID, username, 'regular', hashedPassword]);
    console.log('New user inserted');

    return res.status(200).json({ success: true, message: 'User created successfully', username });
  } catch (error) {
    console.log('Error during user creation:', error);
    return res.status(500).json({ success: false, message: 'An error occurred during user creation' });
  }
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

exports.searchClients = async (req, res) => {
  const { term } = req.query;
  try {
    const clients = await searchClientsByTerm(term);
    res.status(200).json({ clients });
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Helper functions
async function getClients() {
  const { rows } = await pool.query('SELECT ClientID, ClientName, ClientLocation FROM Client');
  return rows;
}

async function searchClientsByTerm(term) {
  const { rows } = await pool.query(`
    SELECT ClientID, ClientName, ClientLocation 
    FROM Client
    WHERE ClientName ILIKE $1 OR ClientID::text ILIKE $1 OR ClientLocation ILIKE $1
  `, [`%${term}%`]);
  return rows;
}


exports.getMetalPrices = async (req, res) => {
  const { clientType } = req.query;
  try {
    let query;
    switch (clientType.toLowerCase()) {
      case 'auto':
        query = 'SELECT * FROM AutoMetalPrices';
        break;
      case 'hvac':
        query = 'SELECT * FROM HVACMetalPrices';
        break;
      case 'insulation':
        query = 'SELECT * FROM InsulationMetalPrices';
        break;
      default:
        return res.status(400).json({ message: 'Invalid client type' });
    }
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching metal prices' });
  }
};

exports.createReceipt = async (req, res) => {
  const { clientID, createdBy, totalPayout, metals, catalyticConverters, userDefinedMetals } = req.body;
  const client = await pool.query('SELECT * FROM Client WHERE ClientID = $1', [clientID]);
  
  try {
    await pool.query('BEGIN');
    
    // Insert receipt
    const { rows } = await pool.query(
      'INSERT INTO Receipt (ClientID, PaymentMethod, TotalPayout, PickupDate, PickupTime, CreatedBy) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIMESTAMP, $4) RETURNING ReceiptID',
      [clientID, client.rows[0].paymentmethod, totalPayout, createdBy]
    );
    const receiptID = rows[0].receiptid;

    // Insert metals based on client type
    if (client.rows[0].clienttype === 'auto') {
      await pool.query(`
        INSERT INTO AutoReceiptMetals (
          ReceiptID, DrumsRotorsWeight, DrumsRotorsPrice, ShortIronWeight, ShortIronPrice,
          SteelShredWeight, SteelShredPrice, AluminumRadiatorsWeight, AluminumRadiatorsPrice,
          BrassCopperRadiatorsWeight, BrassCopperRadiatorsPrice, AluminumWeight, AluminumPrice,
          BatteriesWeight, BatteriesPrice
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        receiptID,
        metals.DrumsRotors.weight, metals.DrumsRotors.price,
        metals.ShortIron.weight, metals.ShortIron.price,
        metals.SteelShred.weight, metals.SteelShred.price,
        metals.AluminumRadiators.weight, metals.AluminumRadiators.price,
        metals.BrassCopperRadiators.weight, metals.BrassCopperRadiators.price,
        metals.Aluminum.weight, metals.Aluminum.price,
        metals.Batteries.weight, metals.Batteries.price
      ]);

      // Update AutoClientTotals
      await pool.query(`
        UPDATE AutoClientTotals
        SET 
          TotalDrumsRotors = TotalDrumsRotors + $1,
          TotalShortIron = TotalShortIron + $2,
          TotalSteelShred = TotalSteelShred + $3,
          TotalAluminumRadiators = TotalAluminumRadiators + $4,
          TotalBrassCopperRadiators = TotalBrassCopperRadiators + $5,
          TotalAluminum = TotalAluminum + $6,
          TotalBatteries = TotalBatteries + $7,
          TotalPayout = TotalPayout + $8
        WHERE ClientID = $9
      `, [
        metals.DrumsRotors.weight,
        metals.ShortIron.weight,
        metals.SteelShred.weight,
        metals.AluminumRadiators.weight,
        metals.BrassCopperRadiators.weight,
        metals.Aluminum.weight,
        metals.Batteries.weight,
        totalPayout,
        clientID
      ]);
    }
    // Similar logic for HVAC and Insulation clients

    // Insert user-defined metals
    for (const metal of userDefinedMetals) {
      await pool.query('INSERT INTO UserDefinedMetal (ReceiptID, MetalName, Weight, Price) VALUES ($1, $2, $3, $4)', [receiptID, metal.name, metal.weight, metal.price]);
    }

    // Insert catalytic converters
    for (const converter of catalyticConverters) {
      await pool.query('INSERT INTO CatalyticConverter (ReceiptID, PartNumber, Price, PercentFull) VALUES ($1, $2, $3, $4)', [receiptID, converter.partNumber, converter.price, converter.percentFull]);
    }

    // Update daily totals
    for (const [metalName, metalData] of Object.entries(metals)) {
      await pool.query(
        'INSERT INTO DailyMetalTotals (UserID, Date, MetalName, TotalWeight) VALUES ($1, CURRENT_DATE, $2, $3) ON CONFLICT (UserID, Date, MetalName) DO UPDATE SET TotalWeight = DailyMetalTotals.TotalWeight + $3',
        [createdBy, metalName, metalData.weight]
      );
    }
    for (const metal of userDefinedMetals) {
      await pool.query(
        'INSERT INTO DailyMetalTotals (UserID, Date, MetalName, TotalWeight) VALUES ($1, CURRENT_DATE, $2, $3) ON CONFLICT (UserID, Date, MetalName) DO UPDATE SET TotalWeight = DailyMetalTotals.TotalWeight + $3',
        [createdBy, metal.name, metal.weight]
      );
    }

    await pool.query('COMMIT');
    res.json({ message: 'Receipt created successfully', receiptID });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating receipt', error: error.message });
  }
};

exports.getDailyTotals = async (req, res) => {
  const { date } = req.query;
  try {
    const { rows } = await pool.query('SELECT * FROM DailyMetalTotals WHERE Date = $1', [date]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily totals' });
  }
};