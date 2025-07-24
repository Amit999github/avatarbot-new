// No need to require dotenv here, already loaded globally
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Otp = require('../models/otp');
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');

const saltRounds = 10;

module.exports.sendmail = wrapAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw new ExpressError('Email is required', 400);

  const otp = Math.floor(100000 + Math.random() * 900000);
  const hashedOtp = await bcrypt.hash(otp.toString(), saltRounds);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min from now

  await Otp.findOneAndUpdate({ email }, { otp: hashedOtp, expiresAt }, { upsert: true, new: true });

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
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
    subject: 'Please verify your Email for Sign up',
    text: `This is your OTP (One Time Password): ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`OTP sent`);
  next();
});

module.exports.verifyOtp = wrapAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    req.flash('error', 'Email and OTP are required');
  }

  const otpRecord = await Otp.findOne({ email });
  if (!otpRecord) {
    req.flash('error', 'OTP not found for the given email');
  }

  if (otpRecord.expiresAt < Date.now()) {
    await Otp.deleteOne({ email });
    req.flash('error', 'OTP has expired');
  }

  const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp);
  if (!isMatch) {
    req.flash('error', 'Invalid OTP');
  }

  // Valid OTP — cleanup
  await Otp.deleteOne({ email });
  next(); // Proceed to next middleware (e.g., user registration or login)
});
