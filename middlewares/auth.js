const jwt = require("jsonwebtoken");

exports.auth = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).send("Access denied. No token provided.");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded._id;
    next();
  } catch (err) {
    return res.status(400).send("Invalid token.");
  }
};

exports.optionalAuth = function (req, res, next) {
  try {
    const token = req.header("x-auth-token");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded._id !== "anonymous") {
        req.user = decoded._id;
      }
    }

    next();
  } catch (err) {
    return res.status(400).send("Invalid token.");
  }
};
