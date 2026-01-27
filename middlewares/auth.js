const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token Missing ❌",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ✅ { id, username, role }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token ❌",
    });
  }
};

module.exports = authMiddleware;
