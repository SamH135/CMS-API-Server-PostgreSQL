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
    console.log("Sending client list:", clients); // log for debugging
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
    console.log("Sending search results:", clients); // log for debugging
    res.status(200).json({ clients });
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Helper functions
async function getClients() {
  const { rows } = await pool.query('SELECT ClientID, ClientName, ClientLocation, ClientType FROM Client WHERE ClientType != \'insulation\'');
  return rows;
}

async function searchClientsByTerm(term) {
  const { rows } = await pool.query(`
    SELECT ClientID, ClientName, ClientLocation, ClientType
    FROM Client
    WHERE (ClientName ILIKE $1 OR ClientID::text ILIKE $1 OR ClientLocation ILIKE $1)
    AND ClientType != 'insulation'
  `, [`%${term}%`]);
  console.log("Search results:", rows); // log for debugging
  return rows;
}







const metalLabels = {
  'auto': {
    'drumsrotors': "Drums & Rotors",
    'shortiron': "Short Iron",
    'shredsteel': "Shred Steel",
    'aluminumbreakage': "Aluminum Breakage",
    'dirtyaluminumradiators': "Dirty Aluminum Radiators",
    'wiringharness': "Wiring Harness",
    'accompressor': "A/C Compressor",
    'alternatorstarter': "Alternator/Starter",
    'aluminumrims': "Aluminum Rims",
    'chromerims': "Chrome Rims",
    'brasscopperradiator': "Brass Copper Radiator"
  },
  'hvac': {
    'shredsteel': "Shred Steel",
    'dirtyalumcopperradiators': "Dirty Alum/Copper Radiators",
    'cleanaluminumradiators': "Clean Aluminum Radiators",
    'coppertwo': "#2 Copper",
    'compressors': "Compressors",
    'dirtybrass': "Dirty Brass",
    'electricmotors': "Electric Motors",
    'aluminumbreakage': "Aluminum Breakage"
  }
};

exports.getMetalPrices = async (req, res) => {
  console.log("Backend - getMetalPrices called with query:", req.query);
  const { clientType } = req.query;
  try {
    let query;
    let table;
    switch (clientType.toLowerCase()) {
      case 'auto':
        table = 'SetAutoPrices';
        break;
      case 'hvac':
        table = 'SetHVACPrices';
        break;
      default:
        console.log("Backend - Invalid client type:", clientType);
        return res.status(400).json({ message: 'Invalid client type' });
    }

    query = `
      SELECT * FROM ${table}
      WHERE EffectiveDate <= CURRENT_DATE
      ORDER BY EffectiveDate DESC
      LIMIT 1
    `;

    console.log("Backend - Executing query:", query);
    const { rows } = await pool.query(query);
    console.log("Backend - Query result:", rows);

    if (rows.length === 0) {
      console.log("Backend - No prices found for the given client type");
      return res.status(404).json({ message: 'No prices found for the given client type' });
    }

    const labels = metalLabels[clientType.toLowerCase()];
    const formattedPrices = {};
    Object.entries(rows[0]).forEach(([key, value]) => {
      if (key !== 'priceid' && key !== 'effectivedate') {
        const baseKey = key.replace(/price$/i, '').toLowerCase();
        const label = labels[baseKey] || baseKey; // Use the mapped label if available, otherwise use the original key
        formattedPrices[label] = value;
      }
    });

    console.log("Backend - Sending formatted response:", formattedPrices);
    res.json(formattedPrices);
  } catch (error) {
    console.error('Backend - Error fetching metal prices:', error);
    res.status(500).json({ message: 'Error fetching metal prices' });
  }
};




// rgcController.js

exports.createReceipt = async (req, res) => {
  const { 
    clientID, 
    createdBy, 
    totalPayout, 
    totalVolume,
    metals, 
    userDefinedMetals, 
    catalyticConverters 
  } = req.body;

  const client = await pool.query('SELECT * FROM Client WHERE ClientID = $1', [clientID]);
  
  try {
    await pool.query('BEGIN');
    
    // Insert receipt
    const { rows } = await pool.query(
      'INSERT INTO Receipt (ClientID, PaymentMethod, TotalPayout, TotalVolume, PickupDate, PickupTime, CreatedBy) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_TIMESTAMP, $5) RETURNING ReceiptID',
      [clientID, client.rows[0].paymentmethod, totalPayout, totalVolume, createdBy]
    );
    const receiptID = rows[0].receiptid;

    // Insert metals based on client type
    if (client.rows[0].clienttype === 'auto') {
      await pool.query(`
        INSERT INTO AutoReceiptMetals (
          ReceiptID, DrumsRotorsWeight, DrumsRotorsPrice, ShortIronWeight, ShortIronPrice,
          ShredSteelWeight, ShredSteelPrice, AluminumBreakageWeight, AluminumBreakagePrice,
          DirtyAluminumRadiatorsWeight, DirtyAluminumRadiatorsPrice, WiringHarnessWeight, WiringHarnessPrice,
          ACCompressorWeight, ACCompressorPrice, AlternatorStarterWeight, AlternatorStarterPrice,
          AluminumRimsWeight, AluminumRimsPrice, ChromeRimsWeight, ChromeRimsPrice,
          BrassCopperRadiatorWeight, BrassCopperRadiatorPrice
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      `, [
        receiptID,
        metals['Drums & Rotors'].weight, metals['Drums & Rotors'].price,
        metals['Short Iron'].weight, metals['Short Iron'].price,
        metals['Shred Steel'].weight, metals['Shred Steel'].price,
        metals['Aluminum Breakage'].weight, metals['Aluminum Breakage'].price,
        metals['Dirty Aluminum Radiators'].weight, metals['Dirty Aluminum Radiators'].price,
        metals['Wiring Harness'].weight, metals['Wiring Harness'].price,
        metals['A/C Compressor'].weight, metals['A/C Compressor'].price,
        metals['Alternator/Starter'].weight, metals['Alternator/Starter'].price,
        metals['Aluminum Rims'].weight, metals['Aluminum Rims'].price,
        metals['Chrome Rims'].weight, metals['Chrome Rims'].price,
        metals['Brass Copper Radiator'].weight, metals['Brass Copper Radiator'].price
      ]);

      // Update AutoClientTotals
      await pool.query(`
        UPDATE AutoClientTotals
        SET 
          TotalDrumsRotors = TotalDrumsRotors + $1,
          TotalShortIron = TotalShortIron + $2,
          TotalShredSteel = TotalShredSteel + $3,
          TotalAluminumBreakage = TotalAluminumBreakage + $4,
          TotalDirtyAluminumRadiators = TotalDirtyAluminumRadiators + $5,
          TotalWiringHarness = TotalWiringHarness + $6,
          TotalACCompressor = TotalACCompressor + $7,
          TotalAlternatorStarter = TotalAlternatorStarter + $8,
          TotalAluminumRims = TotalAluminumRims + $9,
          TotalChromeRims = TotalChromeRims + $10,
          TotalBrassCopperRadiator = TotalBrassCopperRadiator + $11,
          TotalPayout = TotalPayout + $12
        WHERE ClientID = $13
      `, [
        metals['Drums & Rotors'].weight,
        metals['Short Iron'].weight,
        metals['Shred Steel'].weight,
        metals['Aluminum Breakage'].weight,
        metals['Dirty Aluminum Radiators'].weight,
        metals['Wiring Harness'].weight,
        metals['A/C Compressor'].weight,
        metals['Alternator/Starter'].weight,
        metals['Aluminum Rims'].weight,
        metals['Chrome Rims'].weight,
        metals['Brass Copper Radiator'].weight,
        totalPayout,
        clientID
      ]);
    } else if (client.rows[0].clienttype === 'hvac') {
      await pool.query(`
        INSERT INTO HVACReceiptMetals (
          ReceiptID, ShredSteelWeight, ShredSteelPrice, DirtyAlumCopperRadiatorsWeight, DirtyAlumCopperRadiatorsPrice,
          CleanAluminumRadiatorsWeight, CleanAluminumRadiatorsPrice, CopperTwoWeight, CopperTwoPrice,
          CompressorsWeight, CompressorsPrice, DirtyBrassWeight, DirtyBrassPrice,
          ElectricMotorsWeight, ElectricMotorsPrice, AluminumBreakageWeight, AluminumBreakagePrice
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        receiptID,
        metals['Shred Steel'].weight, metals['Shred Steel'].price,
        metals['Dirty Alum/Copper Radiators'].weight, metals['Dirty Alum/Copper Radiators'].price,
        metals['Clean Aluminum Radiators'].weight, metals['Clean Aluminum Radiators'].price,
        metals['#2 Copper'].weight, metals['#2 Copper'].price,
        metals['Compressors'].weight, metals['Compressors'].price,
        metals['Dirty Brass'].weight, metals['Dirty Brass'].price,
        metals['Electric Motors'].weight, metals['Electric Motors'].price,
        metals['Aluminum Breakage'].weight, metals['Aluminum Breakage'].price
      ]);

      // Update HVACClientTotals
      await pool.query(`
        UPDATE HVACClientTotals
        SET 
          TotalShredSteel = TotalShredSteel + $1,
          TotalDirtyAlumCopperRadiators = TotalDirtyAlumCopperRadiators + $2,
          TotalCleanAluminumRadiators = TotalCleanAluminumRadiators + $3,
          TotalCopperTwo = TotalCopperTwo + $4,
          TotalCompressors = TotalCompressors + $5,
          TotalDirtyBrass = TotalDirtyBrass + $6,
          TotalElectricMotors = TotalElectricMotors + $7,
          TotalAluminumBreakage = TotalAluminumBreakage + $8,
          TotalPayout = TotalPayout + $9
        WHERE ClientID = $10
      `, [
        metals['Shred Steel'].weight,
        metals['Dirty Alum/Copper Radiators'].weight,
        metals['Clean Aluminum Radiators'].weight,
        metals['#2 Copper'].weight,
        metals['Compressors'].weight,
        metals['Dirty Brass'].weight,
        metals['Electric Motors'].weight,
        metals['Aluminum Breakage'].weight,
        totalPayout,
        clientID
      ]);
    }

    // Insert user-defined metals
    for (const metal of userDefinedMetals) {
      await pool.query('INSERT INTO UserDefinedMetal (ReceiptID, MetalName, Weight, Price) VALUES ($1, $2, $3, $4)', [receiptID, metal.name, metal.weight, metal.price]);
    }

    // Insert catalytic converters
    for (const converter of catalyticConverters) {
      await pool.query('INSERT INTO CatalyticConverter (ReceiptID, PartNumber, Price, PercentFull) VALUES ($1, $2, $3, $4)', [receiptID, converter.partNumber, converter.price, converter.percentFull]);
    }

    // Update Client's LastPickupDate
    await pool.query('UPDATE Client SET LastPickupDate = CURRENT_DATE WHERE ClientID = $1', [clientID]);

    await pool.query('COMMIT');
    res.json({ message: 'Receipt created successfully', receiptID });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating receipt:', error);
    res.status(500).json({ message: 'Error creating receipt', error: error.message });
  }
};

module.exports = exports;