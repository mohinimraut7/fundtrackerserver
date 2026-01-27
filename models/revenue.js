const mongoose = require("mongoose");

const revenueSchema = new mongoose.Schema(
  {
    // ✅ User ने टाकलेला total revenue
    totalRevenue: {
      type: Number,
      required: true,
    },

    // ✅ Allocation calculation (3% / 5%)
    allocatedAmount: {
      type: Number,
      required: true,
    },

    // ✅ Saved Date (DD/MM/YYYY)
    date: {
      type: String,
      required: true,
    },

    // ✅ Role wise save (Collector Office / Corporation / Grampanchayat)
    role: {
      type: String,
      required: true,
      trim: true,
    },
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

    // ✅ Uploaded file path (optional)
    attachmentUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // ✅ createdAt, updatedAt auto
  }
);

module.exports = mongoose.model("revenue", revenueSchema);
