const express = require("express");
const router = express.Router();
const authMiddleware = require("../utils/authMiddleware");
const eventController = require("../controllers/eventController");

// 🟢 Public — anyone can view all events
router.get("/", eventController.getAllEvents);

// 🟠 Admin — only admin can create events
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access only" });
    }
    next();
  },
  eventController.createEvent
);

module.exports = router;
