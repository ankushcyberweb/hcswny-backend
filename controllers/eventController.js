// backend/controllers/eventController.js
const {
  db,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} = require("../firestore");

// 🟢 Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "events"));
    const events = snapshot.docs.map((doc) => doc.data());

    res.json({ success: true, events });
  } catch (err) {
    console.error("🔥 Error fetching events:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

// 🟠 Create new event (admin only)
exports.createEvent = async (req, res) => {
  try {
    const { title, date, time } = req.body;
    const userEmail = req.user?.email || "admin@system";

    if (!title || !date) {
      return res
        .status(400)
        .json({ success: false, message: "Title and date are required." });
    }

    const newEvent = {
      id: Date.now(),
      title,
      date,
      time: time || "",
      userEmail,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "events"), newEvent);

    res.json({
      success: true,
      message: "Event added successfully!",
      event: newEvent,
    });
  } catch (err) {
    console.error("🔥 Error creating event:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add event",
    });
  }
};
