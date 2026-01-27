
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
    const { totalRevenue, allocatedAmount,financialYear, role } = req.body;

    if (!totalRevenue || !allocatedAmount || !financialYear || !role) {
      return res.status(400).json({
        success: false,
        message: "totalRevenue, allocatedAmount, role required आहे ❌",
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
      financialYear,
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





// exports.addRevenueActivity = async (req, res) => {
//   try {
//     const {
//       revenueId,
//       sanctionedOrderNo,
//       sanctionedOrderDate,
//       amountSanctioned,
//       amountSpent,
//       vendorBeneficiaryDetails,
//     } = req.body;

//     // 🔴 Basic validation
//     if (
//       !revenueId ||
//       !sanctionedOrderNo ||
//       !sanctionedOrderDate ||
//       !amountSanctioned ||
//       !amountSpent
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All required fields are mandatory ❌",
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Bill / UC document required ❌",
//       });
//     }

//     // 1️⃣ Find Revenue
//     const revenue = await Revenue.findById(revenueId);

//     if (!revenue) {
//       return res.status(404).json({
//         success: false,
//         message: "Revenue not found ❌",
//       });
//     }

//     const allocatedAmount = revenue.allocatedAmount;
//     const utilizedAmount = revenue.utilizedAmount || 0;
//     const remainingAmount = allocatedAmount - utilizedAmount;

//     // 2️⃣ Overspending validation
//     if (Number(amountSpent) > remainingAmount) {
//       return res.status(400).json({
//         success: false,
//         message: `Insufficient balance ❌ Remaining amount is ₹${remainingAmount}`,
//       });
//     }

//     // 3️⃣ PUSH activity inside revenue document
//     revenue.activities.push({
//       sanctionedOrderNo,
//       sanctionedOrderDate,
//       amountSanctioned,
//       amountSpent,
//       vendorBeneficiaryDetails,
//       billUcUpload: req.file.path,
//     });

//     // 4️⃣ Update balances
//     revenue.utilizedAmount = utilizedAmount + Number(amountSpent);
//     revenue.remainingAmount =
//       allocatedAmount - revenue.utilizedAmount;

//     await revenue.save();

//     return res.status(201).json({
//       success: true,
//       message: "Revenue activity added successfully ✅",
//       data: {
//         revenueId: revenue._id,
//         allocatedAmount,
//         utilizedAmount: revenue.utilizedAmount,
//         remainingAmount: revenue.remainingAmount,
//         activitiesCount: revenue.activities.length,
//         latestActivity:
//           revenue.activities[revenue.activities.length - 1],
//       },
//     });
//   } catch (error) {
//     console.log("addRevenueActivity error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error ❌",
//     });
//   }
// };




exports.addRevenueActivity = async (req, res) => {
  try {
    const {
      revenueId,
      sanctionedOrderNo,
      sanctionedOrderDate,
      amountSanctioned,
      amountSpent,
      vendorBeneficiaryDetails,
    } = req.body;

    // 🔴 Basic validation
    if (
      !revenueId ||
      !sanctionedOrderNo ||
      !sanctionedOrderDate ||
      !amountSanctioned ||
      !amountSpent
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory ❌",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Bill / UC document required ❌",
      });
    }

    // 1️⃣ Find Revenue
    const revenue = await Revenue.findById(revenueId);

    if (!revenue) {
      return res.status(404).json({
        success: false,
        message: "Revenue not found ❌",
      });
    }

    const allocatedAmount = revenue.allocatedAmount;
    const utilizedAmount = revenue.utilizedAmount || 0;
    const remainingAmount = allocatedAmount - utilizedAmount;

    // 2️⃣ Revenue-level overspending validation
    if (Number(amountSpent) > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance ❌ Remaining amount is ₹${remainingAmount}`,
      });
    }

    // ===============================
    // 🆕 ORDER-WISE PENDING LOGIC
    // ===============================

    // 👉 Same order वर आतापर्यंत किती खर्च झाला
    const orderSpentTillNow = revenue.activities
      .filter(
        (a) => a.sanctionedOrderNo === sanctionedOrderNo
      )
      .reduce((sum, a) => sum + Number(a.amountSpent), 0);

    // 👉 Order-level pending BEFORE this spend
    const orderPendingBefore =
      Number(amountSanctioned) - orderSpentTillNow;

    // 🔴 Order-level overspending check
    if (Number(amountSpent) > orderPendingBefore) {
      return res.status(400).json({
        success: false,
        message: `Order balance insufficient ❌ Remaining ₹${orderPendingBefore}`,
      });
    }

    // 👉 Order-level pending AFTER this spend
    const orderPendingAfter =
      orderPendingBefore - Number(amountSpent);

    // 3️⃣ PUSH activity inside revenue document
    revenue.activities.push({
      sanctionedOrderNo,
      sanctionedOrderDate,
      amountSanctioned,
      amountSpent,
      pendingAmount: orderPendingAfter, // ✅ ONLY NEW FIELD
      vendorBeneficiaryDetails,
      billUcUpload: req.file.path,
    });

    // 4️⃣ Update Revenue balances (UNCHANGED LOGIC)
    revenue.utilizedAmount = utilizedAmount + Number(amountSpent);
    revenue.remainingAmount =
      allocatedAmount - revenue.utilizedAmount;

    await revenue.save();

    return res.status(201).json({
      success: true,
      message: "Revenue activity added successfully ✅",
      data: {
        revenueId: revenue._id,
        allocatedAmount,
        utilizedAmount: revenue.utilizedAmount,
        remainingAmount: revenue.remainingAmount,
        activitiesCount: revenue.activities.length,
        latestActivity:
          revenue.activities[revenue.activities.length - 1],
      },
    });
  } catch (error) {
    console.log("addRevenueActivity error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};
