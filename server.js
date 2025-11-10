const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ✅ (Optional) Firebase — import only if Firestore or Firebase Auth is used
// If your firebaseConfig.js is located one level up from backend folder:
// const { db } = require("../firebaseConfig.js");

// ---------------- INIT APP ----------------
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*", // Allow all origins for testing; restrict later if needed
  })
);

// ---------------- CONFIG ----------------
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ankush@cyberwebhotels.com";
const ADMIN_APP_PASSWORD =
  process.env.ADMIN_APP_PASSWORD || "YOUR_GMAIL_APP_PASSWORD";
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-change-this";
const USERS_FILE = path.join(__dirname, "users.json");

// ---------------- FILE HELPERS ----------------
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

if (!fs.existsSync(USERS_FILE)) writeJSON(USERS_FILE, []);

// ---------------- AUTH HELPERS ----------------
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ---------------- AUTH ROUTES ----------------

// ✅ Register new user
app.post("/auth/register", (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    const users = readJSON(USERS_FILE);
    if (users.find((u) => u.email === email))
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });

    const passwordHash = bcrypt.hashSync(password, 10);
    const role = email === ADMIN_EMAIL ? "admin" : "user";
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      role,
      passwordHash,
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    res.json({
      success: true,
      message: "User registered successfully",
      user: { id: newUser.id, name, email, role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Login existing user
app.post("/auth/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });

    const users = readJSON(USERS_FILE);
    const user = users.find((u) => u.email === email);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });

    const token = createToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Reset password (email temporary password)
app.post("/auth/reset-password", async (req, res) => {
  const { email } = req.body || {};
  const users = readJSON(USERS_FILE);
  const user = users.find((u) => u.email === email);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  const tempPassword = Math.random().toString(36).slice(-8);
  user.passwordHash = bcrypt.hashSync(tempPassword, 10);
  writeJSON(USERS_FILE, users);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: ADMIN_EMAIL, pass: ADMIN_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: ADMIN_EMAIL,
    to: email,
    subject: "HCSWNY App - Password Reset",
    html: `<p>Your new temporary password is <b>${tempPassword}</b></p>`,
  });

  res.json({
    success: true,
    message: "Temporary password sent to your email.",
  });
});

// ---------------- ENQUIRY FORM ROUTE ----------------
app.post("/send-enquiry", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, membershipType, message } =
      req.body;

    if (!firstName || !lastName || !email || !membershipType || !message) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: ADMIN_EMAIL,
        pass: ADMIN_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Enquiry from ${firstName} ${lastName}`,
      text: `
New enquiry received:

Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || "N/A"}
Membership Type: ${membershipType}
Message: ${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Enquiry email sent successfully!");
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Email send failed:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to send enquiry email" });
  }
});

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.send("✅ HCSWNY backend running successfully!");
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
