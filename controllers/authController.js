const fs = require("fs");
const path = require("path");
const { sendResetPasswordEmail } = require("../utils/emailService");

const USERS_FILE = path.join(__dirname, "../users.json");
const ADMIN_EMAIL = "ankush@cyberwebhotels.com";

// helper to read/write JSON
const readUsers = () => {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
};
const writeUsers = (data) =>
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));

exports.register = (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Missing fields" });

  const users = readUsers();
  if (users.find((u) => u.email === email))
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });

  const role = email === ADMIN_EMAIL ? "admin" : "user";
  const newUser = { id: Date.now(), name, email, password, role };
  users.push(newUser);
  writeUsers(users);

  res.json({
    success: true,
    message: "Registered successfully",
    token: "mockToken",
    role,
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });

  res.json({
    success: true,
    message: "Login successful",
    token: "mockToken",
    role: user.role,
  });
};

// ✅ Reset password route
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });

    const users = readUsers();
    const userIndex = users.findIndex((u) => u.email === email);
    if (userIndex === -1)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    // Update user’s password in JSON
    users[userIndex].password = tempPassword;
    writeUsers(users);

    // Send email with temp password
    await sendResetPasswordEmail(email, tempPassword);

    res.json({
      success: true,
      message: "Temporary password sent to your email",
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send reset email" });
  }
};
