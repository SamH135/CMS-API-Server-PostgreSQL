// controllers/auth.js
const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

exports.authenticateISACToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ISAC_JWT_SECRET, (err, user) => {
    if (err || !['regular', 'admin'].includes(user.userType)) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

exports.authenticateRGCToken = (req, res, next) => {
  console.log("authenticateRGCToken middleware called");
  const authHeader = req.headers['authorization'];
  console.log("Auth header:", authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) {
    console.log("No token provided");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.RGC_JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err);
      return res.sendStatus(403);
    }
    console.log("Token verified successfully");
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

exports.generateToken = (user, userType) => {
  return jwt.sign(
    { userID: user.userid, userType: userType },
    process.env.JWT_SECRET,
    { expiresIn: userType === 'rgc' ? '24h' : '1h' }
  );
};

