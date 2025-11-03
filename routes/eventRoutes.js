const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const authMiddleware = require("../utils/authMiddleware");

// Create an Event (user adds event)
router.post("/create", authMiddleware, async (req, res) => {
  const { title, date, time } = req.body;
  const newEvent = new Event({
    title,
    date,
    time,
    userId: req.user.id,
    approved: false,
  });

  try {
    const event = await newEvent.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ msg: "Error saving event" });
  }
});

// Approve Event (admin approval)
router.post("/approve/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "owner")
    return res.status(403).json({ msg: "Unauthorized" });

  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ msg: "Event not found" });

  event.approved = true;
  await event.save();

  // Here, you can also send an email notification to the user

  res.status(200).json({ msg: "Event approved" });
});

module.exports = router;
