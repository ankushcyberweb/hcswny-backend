const fs = require("fs");
const path = require("path");
const { sendEmail } = require("../utils/emailService");

const EVENTS_FILE = path.join(__dirname, "..", "events_data.json");

function readJSON(file, fallback = []) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// 🟢 Public — get all approved events
exports.getAllApprovedEvents = (req, res) => {
  try {
    const events = readJSON(EVENTS_FILE);
    const approved = events.filter((e) => e.approved === true);
    res.json({ success: true, events: approved });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🟠 Admin — create event
exports.createEvent = (req, res) => {
  try {
    const { title, date, time } = req.body || {};
    const userEmail = req.user?.email || "admin@system";

    if (!title || !date)
      return res.status(400).json({
        success: false,
        message: "Title and date are required.",
      });

    const events = readJSON(EVENTS_FILE);
    const newEvent = {
      id: Date.now(),
      title,
      date,
      time: time || "",
      userEmail,
      approved: true, // auto-approved since admin adds it
    };

    events.push(newEvent);
    writeJSON(EVENTS_FILE, events);

    res.json({
      success: true,
      message: "Event added successfully (visible to all users).",
      event: newEvent,
    });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🟣 Admin — view pending (if you want moderation later)
exports.getPendingEvents = (req, res) => {
  try {
    const events = readJSON(EVENTS_FILE);
    const pending = events.filter((e) => !e.approved);
    res.json({ success: true, events: pending });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔵 Admin — approve event and notify user
exports.updateEventApproval = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId)
      return res
        .status(400)
        .json({ success: false, message: "Missing eventId." });

    const events = readJSON(EVENTS_FILE);
    const index = events.findIndex((e) => e.id == eventId);
    if (index === -1)
      return res
        .status(404)
        .json({ success: false, message: "Event not found." });

    events[index].approved = true;
    writeJSON(EVENTS_FILE, events);

    try {
      await sendEmail({
        to: events[index].userEmail,
        subject: "Your Event Approved",
        html: `<p>Your event <b>${events[index].title}</b> on <b>${events[index].date}</b> has been approved and is now visible publicly.</p>`,
      });
    } catch (emailErr) {
      console.error("Email failed:", emailErr);
    }

    res.json({ success: true, message: "Event approved successfully." });
  } catch (err) {
    console.error("Approve event error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
