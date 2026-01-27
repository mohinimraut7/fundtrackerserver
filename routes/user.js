const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  updateUser,
} = require("../controllers/user");

// ✅ Register
router.post("/register", registerUser);

// ✅ Login
router.post("/login", loginUser);

// ✅ Update user by id
router.patch("/users/:id", updateUser);

module.exports = router;
