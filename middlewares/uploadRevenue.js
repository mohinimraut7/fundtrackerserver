const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ uploads folder exist नसेल तर create कर
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// ✅ Only pdf/jpg/jpeg/png allow
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only pdf / jpg / jpeg / png allowed ❌"), false);
  }
};

const uploadRevenue = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // ✅ 10MB
});

module.exports = uploadRevenue;
