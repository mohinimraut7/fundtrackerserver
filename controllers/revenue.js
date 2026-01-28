
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



// ✅ GET /api/revenue/:sanctionedOrderNo
exports.getSanctionedOrder = async (req, res) => {
  try {
    const { sanctionedOrderNo } = req.params;

    console.log("sanctionedOrderNo >>>", sanctionedOrderNo);

    if (!sanctionedOrderNo) {
      return res.status(400).json({
        success: false,
        message: "sanctionedOrderNo required ❌",
      });
    }

    let query = {};

    // 👑 Super Admin → search all
    if (req.user.role !== "Super Admin") {
      query.userId = req.user.id;
    }

    // ✅ FIXED HERE 👇
    const revenues = await Revenue.find({
      ...query,
      "activities.sanctionedOrderNo": sanctionedOrderNo,
    }).sort({ createdAt: -1 });

    if (!revenues.length) {
      return res.status(404).json({
        success: false,
        message: "Sanctioned Order No not found ❌",
      });
    }

    const result = revenues.map((rev) => {
      const matchedActivity = rev.activities.find(
        (a) => a.sanctionedOrderNo === sanctionedOrderNo
      );

      return {
        revenueId: rev._id,
        financialYear: rev.financialYear,
        role: rev.role,
        totalRevenue: rev.totalRevenue,
        allocatedAmount: rev.allocatedAmount,
        utilizedAmount: rev.utilizedAmount,
        remainingAmount: rev.remainingAmount,
        activity: matchedActivity,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log("getSanctionedOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};



// const Revenue = require("../models/revenue");

// PUT /api/revenue/:revenueId/activity/:sanctionedOrderNo

// PUT /api/revenue/activity/:sanctionedOrderNo
// exports.updateRevenueActivityByOrderNo = async (req, res) => {
//   try {
//     const { sanctionedOrderNo } = req.params;
//     const { amountSpent } = req.body;

//     if (!sanctionedOrderNo || !amountSpent) {
//       return res.status(400).json({
//         success: false,
//         message: "sanctionedOrderNo आणि amountSpent required ❌",
//       });
//     }

//     const spend = Number(amountSpent);

//     // 1️⃣ Find revenue WHICH CONTAINS this order
//     const revenue = await Revenue.findOne({
//       "activities.sanctionedOrderNo": sanctionedOrderNo,
//     });

//     if (!revenue) {
//       return res.status(404).json({
//         success: false,
//         message: "Revenue / Sanctioned Order not found ❌",
//       });
//     }

//     // 2️⃣ Find exact activity
//     const activity = revenue.activities.find(
//       (a) => a.sanctionedOrderNo === sanctionedOrderNo
//     );

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Sanctioned Order No not found ❌",
//       });
//     }

//     // 3️⃣ Validation
//     if (spend > activity.pendingAmount) {
//       return res.status(400).json({
//         success: false,
//         message: `Order pending insufficient ❌ Remaining ₹${activity.pendingAmount}`,
//       });
//     }

//     if (spend > revenue.remainingAmount) {
//       return res.status(400).json({
//         success: false,
//         message: `Revenue balance insufficient ❌ Remaining ₹${revenue.remainingAmount}`,
//       });
//     }

//     // ===============================
//     // ✅ UPDATE SAME ACTIVITY
//     // ===============================
//     activity.amountSpent += spend;
//     activity.pendingAmount -= spend;

//     // ===============================
//     // ✅ BREAKDOWN (NO REPLACE)
//     // ===============================
//     if (!activity.breakdowns) {
//       activity.breakdowns = [];
//     }

//     activity.breakdowns.push({
//       amountSpent: spend,
//       billUcUpload: req.file ? req.file.path : null,
//       spentAt: new Date(),
//     });

//     // ===============================
//     // ✅ UPDATE REVENUE TOTAL
//     // ===============================
//     revenue.utilizedAmount =
//       (revenue.utilizedAmount || 0) + spend;

//     revenue.remainingAmount =
//       revenue.allocatedAmount - revenue.utilizedAmount;

//     await revenue.save();

//     return res.status(200).json({
//       success: true,
//       message: "Amount disbursed successfully ✅",
//       data: {
//         sanctionedOrderNo,
//         updatedActivity: activity,
//         remainingAmount: revenue.remainingAmount,
//       },
//     });
//   } catch (error) {
//     console.log("updateRevenueActivityByOrderNo error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error ❌",
//     });
//   }
// };




// // PUT /api/revenue/activity/:sanctionedOrderNo
// exports.updateRevenueActivityByOrderNo = async (req, res) => {
//   try {
//     const { sanctionedOrderNo } = req.params;
//     const { amountSpent } = req.body;

//     if (!sanctionedOrderNo || !amountSpent) {
//       return res.status(400).json({
//         success: false,
//         message: "sanctionedOrderNo आणि amountSpent required ❌",
//       });
//     }

//     const spend = Number(amountSpent);

//     // 1️⃣ Find revenue containing this order
//     const revenue = await Revenue.findOne({
//       "activities.sanctionedOrderNo": sanctionedOrderNo,
//     });

//     if (!revenue) {
//       return res.status(404).json({
//         success: false,
//         message: "Revenue / Order not found ❌",
//       });
//     }

//     // 2️⃣ Find exact activity
//     const activity = revenue.activities.find(
//       (a) => a.sanctionedOrderNo === sanctionedOrderNo
//     );

//     if (!activity) {
//       return res.status(404).json({
//         success: false,
//         message: "Sanctioned Order No not found ❌",
//       });
//     }

//     // 3️⃣ Validations
//     if (spend > activity.pendingAmount) {
//       return res.status(400).json({
//         success: false,
//         message: `Order pending insufficient ❌ Remaining ₹${activity.pendingAmount}`,
//       });
//     }

//     if (spend > revenue.remainingAmount) {
//       return res.status(400).json({
//         success: false,
//         message: `Revenue balance insufficient ❌ Remaining ₹${revenue.remainingAmount}`,
//       });
//     }

//     // ===============================
//     // ✅ UPDATE MAIN TOTALS
//     // ===============================
//     activity.amountSpent += spend;
//     activity.pendingAmount -= spend;

//     // ===============================
//     // ✅ ADD INTERNAL BREAKDOWN
//     // ===============================
//     if (!activity.breakdowns) {
//       activity.breakdowns = [];
//     }

//     activity.breakdowns.push({
//       amountSpent: spend,
//       billUcUpload: req.file ? req.file.path : null,
//       spentAt: new Date(),
//     });

//     // ===============================
//     // ✅ UPDATE REVENUE TOTAL
//     // ===============================
//     revenue.utilizedAmount =
//       (revenue.utilizedAmount || 0) + spend;

//     revenue.remainingAmount =
//       revenue.allocatedAmount - revenue.utilizedAmount;

//     await revenue.save();

//     return res.status(200).json({
//       success: true,
//       message: "Amount disbursed successfully ✅",
//       data: {
//         sanctionedOrderNo,
//         activity, // 🔥 breakdowns included
//         remainingAmount: revenue.remainingAmount,
//       },
//     });
//   } catch (error) {
//     console.log("updateRevenueActivityByOrderNo error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error ❌",
//     });
//   }
// };





exports.updateRevenueActivityByOrderNo = async (req, res) => {
  try {
    const { sanctionedOrderNo } = req.params;
    const { amountSpent, vendorBeneficiaryDetails } = req.body;

    if (!sanctionedOrderNo || !amountSpent) {
      return res.status(400).json({
        success: false,
        message: "sanctionedOrderNo आणि amountSpent required ❌",
      });
    }

    const spend = Number(amountSpent);

    // 1️⃣ Find revenue containing this order
    const revenue = await Revenue.findOne({
      "activities.sanctionedOrderNo": sanctionedOrderNo,
    });

    if (!revenue) {
      return res.status(404).json({
        success: false,
        message: "Revenue not found ❌",
      });
    }

    // 2️⃣ Get sanctioned order base info (from first entry)
    const baseActivity = revenue.activities.find(
      (a) => a.sanctionedOrderNo === sanctionedOrderNo
    );

    const sanctionedAmount = baseActivity.amountSanctioned;
    const sanctionedOrderDate = baseActivity.sanctionedOrderDate;

    // 3️⃣ Calculate total spent till now
    const totalSpentTillNow = revenue.activities
      .filter(a => a.sanctionedOrderNo === sanctionedOrderNo)
      .reduce((sum, a) => sum + Number(a.amountSpent), 0);

    const pendingBefore = sanctionedAmount - totalSpentTillNow;

    // 4️⃣ Validations
    if (spend > pendingBefore) {
      return res.status(400).json({
        success: false,
        message: `Order pending insufficient ❌ Remaining ₹${pendingBefore}`,
      });
    }

    if (spend > revenue.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Revenue balance insufficient ❌ Remaining ₹${revenue.remainingAmount}`,
      });
    }

    const pendingAfter = pendingBefore - spend;

    // ===============================
    // ✅ CREATE NEW ACTIVITY ENTRY
    // ===============================
    revenue.activities.push({
      sanctionedOrderNo,
      sanctionedOrderDate,
      amountSanctioned: sanctionedAmount,
      amountSpent: spend,              // 🔥 ONLY THIS DISBURSEMENT
      pendingAmount: pendingAfter,     // 🔥 AUTO CALCULATED
      vendorBeneficiaryDetails: vendorBeneficiaryDetails || "",
      billUcUpload: req.file ? req.file.path : "",
      createdAt: new Date(),
    });

    // ===============================
    // ✅ UPDATE REVENUE TOTALS
    // ===============================
    revenue.utilizedAmount =
      (revenue.utilizedAmount || 0) + spend;

    revenue.remainingAmount =
      revenue.allocatedAmount - revenue.utilizedAmount;

    await revenue.save();

    return res.status(200).json({
      success: true,
      message: "Amount disbursed successfully ✅",
      data: {
        sanctionedOrderNo,
        disbursedAmount: spend,
        pendingAmount: pendingAfter,
        remainingAmount: revenue.remainingAmount,
      },
    });
  } catch (error) {
    console.log("updateRevenueActivityByOrderNo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error ❌",
    });
  }
};
