const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();

// ✅ Allow CORS from any origin (safe for testing)
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// ---------------- CONFIG ----------------
const PORT = process.env.PORT || 3000; // ✅ Render provides its own PORT
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

// ---------------- REGISTER ----------------
app.post("/auth/register", (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

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
      role,
      user: { id: newUser.id, name, email, role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- LOGIN ----------------
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
        .status(400)
        .json({ success: false, message: "User not found" });

    // Support legacy plain passwords
    let valid = false;
    if (user.passwordHash)
      valid = bcrypt.compareSync(password, user.passwordHash);
    else if (user.password && user.password === password) valid = true;

    if (!valid)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    // Upgrade to hash if needed
    if (!user.passwordHash) {
      user.passwordHash = bcrypt.hashSync(password, 10);
      delete user.password;
      writeJSON(USERS_FILE, users);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- RESET PASSWORD ----------------
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

  res.json({ success: true, message: "Temporary password sent to your email" });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
