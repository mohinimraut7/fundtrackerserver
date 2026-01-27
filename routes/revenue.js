const express = require("express");
const router = express.Router();

const { getRevenue, addRevenue,addRevenueActivity } = require("../controllers/revenue");
const uploadRevenue = require("../middlewares/uploadRevenue");
const authMiddleware = require("../middlewares/auth");

// ✅ GET (http://localhost:5000/api/revenue)
router.get("/revenue",authMiddleware,getRevenue);

// ✅ POST (http://localhost:5000/api/addRevenue)
// router.post("/addRevenue",authMiddleware,uploadRevenue.single("attachment"), addRevenue);

router.post(
  "/addRevenue",
  authMiddleware, // ✅ MUST (req.user मिळेल)
  (req, res, next) => {
    uploadRevenue.single("attachment")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size जास्त आहे ❌ (Max 50MB allowed)",
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed ❌",
        });
      }
      next();
    });
  },
  addRevenue
);

// ================= ADD REVENUE ACTIVITY =================

// ADD revenue activity
router.post(
  "/revenue/addActivity",
  authMiddleware,
  (req, res, next) => {
    uploadRevenue.single("billUcUpload")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size जास्त आहे ❌ (Max 50MB allowed)",
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed ❌",
        });
      }
      next();
    });
  },
  addRevenueActivity
);


module.exports = router;
