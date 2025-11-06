const fs = require("fs");
const path = require("path");

// ✅ Use absolute path from current working directory
const EVENTS_FILE = path.resolve(__dirname, "../events_data.json");

// 🧩 Helper functions
function readJSON(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const data = fs.readFileSync(file, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("❌ Error reading JSON:", err);
    return fallback;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    console.log("✅ Event data saved successfully!");
  } catch (err) {
    console.error("❌ Error writing JSON:", err);
  }
}

// 🟢 Public - anyone can get events
exports.getAllEvents = (req, res) => {
  try {
    const events = readJSON(EVENTS_FILE);
    res.json({ success: true, events });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🟠 Admin - create event
exports.createEvent = (req, res) => {
  try {
    const { title, date, time } = req.body;
    const userEmail = req.user?.email || "admin@system";

    if (!title || !date) {
      return res
        .status(400)
        .json({ success: false, message: "Title and date required" });
    }

    // 🧾 Read existing events
    const events = readJSON(EVENTS_FILE);

    const newEvent = {
      id: Date.now(),
      title,
      date,
      time: time || "",
      userEmail,
      createdAt: new Date().toISOString(),
    };

    // ✍️ Save to file
    events.push(newEvent);
    writeJSON(EVENTS_FILE, events);

    console.log("✅ New event added:", newEvent.title);

    res.json({
      success: true,
      message: "Event added successfully",
      event: newEvent,
    });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
