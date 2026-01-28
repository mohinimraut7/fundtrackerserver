// const mongoose = require("mongoose");

// const revenueSchema = new mongoose.Schema(
//   {
//     // ✅ User ने टाकलेला total revenue
//     totalRevenue: {
//       type: Number,
//       required: true,
//     },

//     // ✅ Allocation calculation (3% / 5%)
//     allocatedAmount: {
//       type: Number,
//       required: true,
//     },

//     // ✅ Saved Date (DD/MM/YYYY)
//     date: {
//       type: String,
//       required: true,
//     },

//     // ✅ Role wise save (Collector Office / Corporation / Grampanchayat)
//     role: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     userId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "user",
//   required: true,
// },


//     // ✅ Attachment info
//     attachmentName: {
//       type: String,
//       default: "",
//     },

//     // ✅ Uploaded file path (optional)
//     attachmentUrl: {
//       type: String,
//       default: "",
//     },
//   },
//   {
//     timestamps: true, // ✅ createdAt, updatedAt auto
//   }
// );

// module.exports = mongoose.model("revenue", revenueSchema);

// =====================================

const mongoose = require("mongoose");

const revenueSchema = new mongoose.Schema(
  {
    // ✅ User ने टाकलेला total revenue
    totalRevenue: {
      type: Number,
      required: true,
    },

    // ✅ Allocation calculation (3% / 5% / 10%)
    allocatedAmount: {
      type: Number,
      required: true,
    },

    // 🆕 किती amount वापरला आहे
    utilizedAmount: {
      type: Number,
      default: 0,
    },

    // 🆕 उरलेला amount (auto managed)
    remainingAmount: {
      type: Number,
      default: function () {
        return this.allocatedAmount;
      },
    },

    financialYear:{
      type: String,
      required: true,
    },

    
    // date: {
    //   type: String,
      
    // },

   
    role: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ Logged in user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // ✅ Attachment info
    attachmentName: {
      type: String,
      default: "",
    },

    // ✅ Uploaded file path
    attachmentUrl: {
      type: String,
      default: "",
    },

    // 🆕 ACTIVITIES ARRAY (inside revenue itself)
    activities: [
      {
        sanctionedOrderNo: {
          type: String,
          required: true,
        },

        sanctionedOrderDate: {
          type: Date,
          required: true,
        },

        amountSanctioned: {
          type: Number,
          required: true,
        },

        amountSpent: {
          type: Number,
          required: true,
        },
          disburseDate: {
         type: Date,
           default: Date.now,   // ✅ optional, fallback
        },
        activityName: {
          type: String,
          default: "",
        },

           pendingAmount: {          // ✅ THIS WAS MISSING
      type: Number,
      required: true,
    },

        vendorBeneficiaryDetails: {
          type: String,
          default: "",
        },

        billUcUpload: {
          type: String, // file path
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("revenue", revenueSchema);

