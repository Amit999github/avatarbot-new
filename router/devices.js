const express = require('express');
const router = express.Router({mergeParams : true});
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js")
const {isLoggedIn} = require("../middleware.js");
const { validatedeviceListings} = require("../middleware/deviceMiddleware.js");
const {deviceListings, buttonListings, buttonEditListings, buttonRemoveListing} = require("../controller/deviceListing.js");

// ================================ device listings ==========================
router.post('/create',isLoggedIn,validatedeviceListings, deviceListings);

router.put('/:_id/buttons/:deviceId/edit', isLoggedIn, buttonEditListings);

// ============================== device route ==========================
router.delete('/:_id/buttons/:deviceId/delete',isLoggedIn,buttonRemoveListing);

// ============================== button route ==========================
router.post('/:_id/:deviceType/:deviceName',isLoggedIn, buttonListings);


module.exports = router;