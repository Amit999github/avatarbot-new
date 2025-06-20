const express = require('express');
const router = express.Router({mergeParams : true});
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js")
const {isLoggedIn} = require("../middleware.js");
const {validateroomListings} = require("../middleware/roomValidation.js");
const {addRoomListings, editRoomListings ,deleteRoomListings, multiroom ,renderRoomPage} = require("../controller/listings.js");
const {ListingSanitize} = require("../sanitize_Input/listings.js");
// ============================== Room create route ==========================
router.get('/add-credentials',isLoggedIn,renderRoomPage)

router.post('/add-credentials',isLoggedIn,ListingSanitize,validateroomListings, addRoomListings);

// =============================== Room Edit route ==========================
router.put('/:id/edit',isLoggedIn,ListingSanitize, editRoomListings);

// ============================== delete Room route ==========================
router.delete('/:id/delete',isLoggedIn, deleteRoomListings);

// ================================== multi room===============================
router.get('/:roomName', isLoggedIn, multiroom);




module.exports = router;