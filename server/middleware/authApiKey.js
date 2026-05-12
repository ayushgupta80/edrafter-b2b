const User = require("../models/User");

const apiAuth = async (req, res, next) => {
  // Check for API key in header or query parameter
  const apiKey = req.headers["x-api-key"] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({ message: "API key is required" });
  }

  const user = await User.findOne({ api_key: apiKey, api_enabled: true });

  if (!user) {
    return res.status(403).json({ message: "Invalid or disabled API key" });
  }

  req.apiUser = user;
  next();
};

module.exports = { apiAuth };
