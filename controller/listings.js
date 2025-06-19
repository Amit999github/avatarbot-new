const mongoose = require('mongoose');
const Room = require("../models/listings.js");
const userDetails = require("../models/user.js");
const Device = require("../models/devices_schema.js");
const wrapAsync = require("../utils/wrapAsync.js");
const {auth ,db} = require('../firebaseConfig');



// ============================================= add room listings ==============================
const addRoomListings = wrapAsync(async (req, res) => {
    let userId = req.cookies.user;
    console.log(req.body)
    let user = await userDetails.findOne({ uid: userId });

    let roomExists = await Room.exists({ userId, roomName: req.body.room_name });
    if (roomExists) {
        req.flash('error', 'Room already exists');
        return res.redirect('/dashboard');
    }

    let room = await Room.create({ roomName: req.body.room_name, userId });
    user.rooms.push(room._id);
    await user.save();

    req.flash('success', 'Room created successfully');
    res.redirect(`/listings/${req.body.room_name}`);
});

const editRoomListings = wrapAsync(async (req, res) => {
    let { id } = req.params;
    let { roomName } = req.body;
    let room = await Room.findByIdAndUpdate(id, { roomName });
    req.flash('success', 'Room updated successfully');
    res.redirect(`/listings/${roomName}`);
})
// ================================= delete room listings ==============================
const deleteRoomListings = wrapAsync(async (req, res) => {
    let uid = req.cookies.user;
    let { id } = req.params;
    await userDetails.findOneAndUpdate({ uid }, { $pull: { rooms: id } });
    await Room.findByIdAndDelete(id);
    req.flash('success', 'Room deleted successfully');
    res.redirect('/dashboard');
  });

// ============================================= dashboard listings ==============================
const dashboardListings = wrapAsync( async (req, res,wss) => {
    wss.on('connection', async (ws) => {
        console.log('New WebSocket connection');
    
        const userRef = db.ref(`users/${req.cookies.user}`);
        userRef.on('value', (snapshot) => {
            const data = snapshot.val();
            ws.send(JSON.stringify({data:data}));
        });
      
        ws.on('close', () => {
            console.log('WebSocket connection closed');
        });
    });
    let rooms = await Room.find({userId:req.cookies.user});
    res.render('listings/dashboard',{rooms});    
})


// ================================== multi room===============================
const multiroom = wrapAsync(async (req, res) => {
    let { roomName } = req.params;
    let userId = req.cookies.user;

    // Fetch rooms for the logged-in user
    let rooms = await Room.find({ userId });

    // Find the specific room by name
    let selectedRoom = rooms.find(room => room.roomName === roomName);
    
    if (!selectedRoom) {
        req.flash("error", "Room not found");
        return res.redirect('/dashboard');
    }

    // Fetch devices associated with this specific room
    let allDevices = await Device.find({ roomId: selectedRoom._id });

    res.render('listings/rooms', { rooms, selectedRoom, roomName, devices: allDevices });
});

const renderRoomPage = wrapAsync(async (req, res) => {
    let userId = req.cookies.user;

    // Fetch rooms for the logged-in user
    let rooms = await Room.find({ userId });

    // Find the specific room by name


    res.render('listings/addRoom', { rooms,});
});


  

module.exports = { addRoomListings ,editRoomListings,deleteRoomListings, dashboardListings , multiroom ,renderRoomPage};