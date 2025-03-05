require("dotenv").config();
const nodemailer = require("nodemailer");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

const otps = {}; 
module.exports.sendmail = wrapAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw new ExpressError("Email is required", 400);

  const otp = Math.floor(100000 + Math.random() * 900000);
  otps[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    secure: true,
    port: 465,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Please verify your Email for Sign up",
    text: `This is your OTP (One Time Password): ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`OTP sent to ${email}: ${otp}`);
  next();
});

module.exports.verifyOtp = wrapAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) req.flash("error","Email and OTP are required");

  const otpData = otps[email];
  if (!otpData) req.flash("error","OTP not found for the given email");

  if (otpData.expiresAt < Date.now()) {
    delete otps[email]; 
    req.flash("error", "OTP has expired");
  }

  if (otpData.otp !== parseInt(otp, 10)) {
    req.flash("error", "Invalid OTP");
  }

  delete otps[email];
 next();
});
