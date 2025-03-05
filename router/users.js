const express = require('express');
const router = express.Router();
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js")
const {isLoggedIn} = require("../middleware.js");
const users = require("../controller/users.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const verifyEmail = require("../controller/verifyEmail.js");


router.route('/signup')
.get( users.renderSignupForm)
.post(verifyEmail.verifyOtp, authMiddleware.validateSignupUser, users.signup);

router.post('/send-mail', verifyEmail.sendmail , (req, res) => res.send("otp send"));

router.route("/signin")
.get( users.renderSigninForm)
.post( authMiddleware.validateloginUser, users.signin);

router.route('/reset-credentials')
.get(users.renderResetCredentialForm)
.post( users.resetCredential); 

router.post('/signout', isLoggedIn, users.signout);

module.exports = router;