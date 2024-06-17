const { Pool } = require("pg");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOSTNAME,
  port: process.env.POSTGRES_SERVER_PORT,
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  max: 10,
});

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
    const { rows: results } = await pool.query("SELECT * FROM \"User\" WHERE UserID = $1", [userID]);
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

exports.updateClient = async (req, res) => {
  const { clientID, clientName, clientLocation } = req.body;
  try {
    await updateClient(clientID, clientName, clientLocation);
    res.status(200).json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Error updating client:', error);
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

async function getUsers() {
  const { rows } = await pool.query('SELECT * FROM "User"');
  return rows;
}

async function getUserByID(userID) {
  const { rows } = await pool.query('SELECT * FROM "User" WHERE UserID = $1', [userID]);
  return rows[0];
}

async function updateClient(clientID, clientName, clientLocation) {
  await pool.query('UPDATE Client SET ClientName = $1, ClientLocation = $2 WHERE ClientID = $3', [clientName, clientLocation, clientID]);
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


