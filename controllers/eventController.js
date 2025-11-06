const fs = require("fs");
const path = require("path");

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

// 🟢 Public — get all events
exports.getAllEvents = (req, res) => {
  try {
    const events = readJSON(EVENTS_FILE);
    res.json({ success: true, events });
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

    if (!title || !date) {
      return res
        .status(400)
        .json({ success: false, message: "Title and date are required." });
    }

    const events = readJSON(EVENTS_FILE);
    const newEvent = {
      id: Date.now(),
      title,
      date,
      time: time || "",
      userEmail,
      createdAt: new Date().toISOString(),
    };

    events.push(newEvent);
    writeJSON(EVENTS_FILE, events);

    res.json({
      success: true,
      message: "Event added successfully.",
      event: newEvent,
    });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
