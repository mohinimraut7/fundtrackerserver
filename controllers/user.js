const User = require("../models/user");
const jwt = require("jsonwebtoken");



exports.registerUser = async (req, res) => {
  try {
    const { name, username, password, role, region, collectorOffice, district, municipality } = req.body;

    // ✅ basic validation
    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Username आणि Password required आहे ❌",
      });
    }

    // ✅ username unique check
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "हा Username आधीच वापरलेला आहे ❌",
      });
    }

    // ✅ create new user
    const newUser = await User.create({
      name,
      username,
      password,
      role,
      region,
      collectorOffice,
      district,
      municipality,
    });

    return res.status(201).json({
      success: true,
      message: "User Registered Successfully ✅",
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        region: newUser.region,
        collectorOffice: newUser.collectorOffice,
        district: newUser.district,
        municipality: newUser.municipality,
      },
    });
  } catch (error) {
    console.log("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error ❌",
    });
  }
};



// ✅ POST /api/login
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ basic validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username आणि Password required आहे ❌",
      });
    }

    // ✅ find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found ❌",
      });
    }

    // ✅ password match
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password ❌",
      });
    }

    // ✅ token generate
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ login success
    return res.status(200).json({
      success: true,
      message: "Login Success ✅",
      token, // ✅ added token
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        region: user.region,
        collectorOffice: user.collectorOffice,
        district: user.district,
        municipality: user.municipality,
      },
    });
  } catch (error) {
    console.log("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error ❌",
    });
  }
};


// ✅ PATCH /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = req.body;

    const user = await User.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found ❌",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User Updated ✅",
      user,
    });
  } catch (error) {
    console.log("Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error ❌",
    });
  }
};
