const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,   // ✅ username unique
      trim: true,
      lowercase: true // ✅ optional (same username duplicate टाळायला)
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "",
    },

    region: {
      type: String,
      default: "",
    },

    collectorOffice: {
      type: String,
      default: "",
    },

    district: {
      type: String,
      default: "",
    },

    municipality: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
