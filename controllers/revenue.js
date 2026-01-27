
const Revenue = require("../models/revenue");

// ✅ GET /api/revenue
// exports.getRevenue = async (req, res) => {
//   try {
//     const data = await Revenue.find({ userId: req.user.id }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     console.log("GET revenue error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };



exports.getRevenue = async (req, res) => {
  try {
    let query = {};

    // 👑 Super Admin → ALL DATA
    if (req.user.role !== "Super Admin") {
      query.userId = req.user.id;
    }

    const data = await Revenue.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log("GET revenue error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




// ✅ POST /api/revenue/add
exports.addRevenue = async (req, res) => {
  try {
    const { totalRevenue, allocatedAmount, date, role } = req.body;

    if (!totalRevenue || !allocatedAmount || !date || !role) {
      return res.status(400).json({
        success: false,
        message: "totalRevenue, allocatedAmount, date, role required आहे ❌",
      });
    }

    let attachmentName = "";
    let attachmentUrl = "";

    if (req.file) {
      attachmentName = req.file.originalname;
      attachmentUrl = `/uploads/${req.file.filename}`;
    }

    const newRevenue = await Revenue.create({
      userId: req.user.id,   // ✅ logged user id
      totalRevenue: Number(totalRevenue),
      allocatedAmount: Number(allocatedAmount),
      date,
      role,
      attachmentName,
      attachmentUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Revenue saved ✅",
      data: newRevenue,
    });
  } catch (error) {
    console.log("POST revenue error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
