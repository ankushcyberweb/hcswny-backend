const express = require("express");
const router = express.Router();
const authMiddleware = require("../utils/authMiddleware");
const eventController = require("../controllers/eventController");

// 🟢 Public — anyone can view approved events
router.get("/", eventController.getAllApprovedEvents);

// 🟠 Admin — only admin can create new events
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

// 🟣 Admin — view pending/unapproved events
router.get("/admin/pending", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
  eventController.getPendingEvents(req, res);
});

// 🔵 Admin — approve/reject event
router.post("/admin/approve", authMiddleware, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
  eventController.updateEventApproval(req, res);
});

module.exports = router;
