const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// ✅ AUTH ROUTES
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
