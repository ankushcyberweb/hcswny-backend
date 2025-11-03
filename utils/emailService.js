const nodemailer = require("nodemailer");

const ADMIN_EMAIL = "ankush@cyberwebhotels.com";
const ADMIN_APP_PASSWORD = "bndp parv pvzn dqwy"; // Gmail App Password (not normal password)

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ADMIN_EMAIL,
    pass: ADMIN_APP_PASSWORD,
  },
});

// 🔹 Send Reset Password Email
exports.sendResetPasswordEmail = async (to, tempPassword) => {
  const mailOptions = {
    from: ADMIN_EMAIL,
    to,
    subject: "HCSWNY App - Password Reset",
    html: `
      <h3>Namaste 🙏</h3>
      <p>You requested to reset your password.</p>
      <p>Your new temporary password is:</p>
      <div style="font-size:18px;font-weight:bold;color:#f58220;margin:10px 0">
        ${tempPassword}
      </div>
      <p>Please log in using this password and change it after login.</p>
      <hr/>
      <p>HCSWNY App Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Password reset email sent to ${to}`);
};

// 🔹 Generic Send Function (for other notifications)
exports.sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: ADMIN_EMAIL,
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent to ${to}`);
};
