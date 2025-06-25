const mongoose = require("mongoose");
const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} = require("firebase/auth");
const { auth, db } = require("../firebaseConfig");
const userDetails = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");

module.exports.renderSignupForm = (req, res) =>
  res.render("auth-forms/signup.ejs");

// =========================================== create users ============================
module.exports.signup = wrapAsync(async (req, res) => {
  const { name, mobile_no, email, password, con_password } = req.body;

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // Save user details in Firebase Realtime Database
  await db.ref(`users/${user.uid}`).set({
    name,
    email: user.email,
    uid: user.uid,
    mobile: mobile_no,
    StringIn: "#$$%%$",
    StringOut: "#$$%%$",
    dashboard: [
      {
        Humidity: "45",
        Temp: "43",
        voltage: "34",
        current: "23",
        TotalCusm: "678",
      },
    ],
  });

  // Save user in MongoDB
  await new userDetails({
    name,
    email,
    password,
    uid: user.uid,
    mobile_no,
  }).save();

  // ✅ Store UID or other info in session
  req.session.user = {
    uid: user.uid,
    email: user.email,
  };
  req.flash("success", "Welcome to Avatarbot");
  res.redirect("/dashboard");
});

module.exports.renderSigninForm = (req, res) =>
  res.render("auth-forms/login.ejs");

//  =================================== login route =====================
module.exports.signin = wrapAsync(async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // ✅ Store UID or other info in session
  req.session.user = {
    uid: user.uid,
    email: user.email,
  };
  req.flash("success", "Login successfully");
  res.redirect("/dashboard");
});

// ============================== reset password ==============================

module.exports.renderResetCredentialForm = (req, res) =>
  res.render("auth-forms/forgot-pass.ejs");

module.exports.resetCredential = wrapAsync(async (req, res) => {
  const { email } = req.body;
  await sendPasswordResetEmail(auth, email);

  req.flash("success", "Password reset email sent successfully.");
  res.redirect("/auth/signin");
});
//  =================================== logout ==================================
module.exports.signout = async (req, res) => {
  await signOut(auth);
  req.session.destroy((err) => {
    if (err) {
      console.log("Logout error:", err);
      return res.redirect("/dashboard");
    }
    res.clearCookie("connect.sid"); // default session cookie name
    req.flash("success", "Logged out successfully");
    res.redirect("/auth/signin");
  });
};
