const mongoose = require('mongoose');
const Room = require('../models/listings.js');
const userDetails = require('../models/user.js');
const Device = require('../models/devices_schema.js');
const wrapAsync = require('../utils/wrapAsync.js');
const { auth, db } = require('../firebaseConfig');

// ============================================= add room listings ==============================
const addRoomListings = wrapAsync(async (req, res) => {
  let userId = req.session.user.uid;
  let user = await userDetails.findOne({ uid: userId });

  let roomExists = await Room.exists({ userId, roomName: req.body.room_name });
  if (roomExists) {
    req.flash('error', 'Room already exists');
    return res.redirect('/dashboard');
  }

  const userRooms = await Room.find({ userId }).select('firebaseRoom');
  const usedNumbers = new Set();
  userRooms.forEach((r) => {
    const match = r.firebaseRoom.match(/^room(\d+)$/);
    if (match) usedNumbers.add(parseInt(match[1], 10));
  });

  let roomNumber = 1;
  while (usedNumbers.has(roomNumber)) roomNumber++;
  const firebaseRoom = `room${roomNumber}`;

  let room = await Room.create({ roomName: req.body.room_name, userId, firebaseRoom });
  user.rooms.push(room._id);
  await user.save();

  const roomRef = db.ref(`users/${userId}/${firebaseRoom}`);
  await roomRef.set({
    roomName: req.body.room_name,
  });

  req.flash('success', 'Room created successfully');
  res.redirect(`/listings/${req.body.room_name}`);
});

// ================================= Edit room listings ==============================
const editRoomListings = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { roomName } = req.body;

  // Step 1: Update roomName in MongoDB
  const room = await Room.findByIdAndUpdate(id, { roomName }, { new: true });

  if (!room) {
    req.flash('error', 'Room not found');
    return res.redirect('/dashboard');
  }

  // Step 2: Get userId and firebaseRoom from updated document
  const userId = req.session.user.uid;
  const firebaseRoom = room.firebaseRoom;

  // Step 3: Update roomName in Firebase under users/{userId}/{firebaseRoom}/roomName
  const firebasePath = `users/${userId}/${firebaseRoom}/roomName`;
  await db.ref(firebasePath).set(roomName);

  req.flash('success', 'Room updated successfully');
  res.redirect(`/listings/${roomName}`);
});

// ================================= delete room listings ==============================
const deleteRoomListings = wrapAsync(async (req, res) => {
  const uid = req.session.user.uid;
  const { id } = req.params;

  // Step 1: Find the Room to get firebaseRoom
  const room = await Room.findById(id);
  if (!room) {
    req.flash('error', 'Room not found');
    return res.redirect('/dashboard');
  }

  const firebaseRoom = room.firebaseRoom;

  // Step 2: Remove room reference from userDetails
  await userDetails.findOneAndUpdate({ uid }, { $pull: { rooms: id } });

  // Step 3: Delete room from MongoDB
  await Room.findByIdAndDelete(id);

  // Step 4: Delete room from Firebase
  const firebasePath = `users/${uid}/${firebaseRoom}`;
  await db.ref(firebasePath).remove();

  req.flash('success', 'Room deleted successfully');
  res.redirect('/dashboard');
});

// ============================================= dashboard listings ==============================
const dashboardListings = wrapAsync(async (req, res) => {
  let rooms = await Room.find({ userId: req.session.user.uid });
  res.render('listings/dashboard', { rooms });
});

// ================================== multi room===============================
const multiroom = wrapAsync(async (req, res) => {
  let { roomName } = req.params;
  let userId = req.session.user.uid;

  // Fetch rooms for the logged-in user
  let rooms = await Room.find({ userId });

  // Find the specific room by name
  let selectedRoom = rooms.find((room) => room.roomName === roomName);

  if (!selectedRoom) {
    req.flash('error', 'Room not found');
    return res.redirect('/dashboard');
  }

  // Fetch devices associated with this specific room
  let allDevices = await Device.find({ roomId: selectedRoom._id });

  res.render('listings/rooms', { rooms, selectedRoom, roomName, devices: allDevices });
});

const renderRoomPage = wrapAsync(async (req, res) => {
  let userId = req.session.user.uid;

  // Fetch rooms for the logged-in user
  let rooms = await Room.find({ userId });

  // Find the specific room by name

  res.render('listings/addRoom', { rooms });
});

module.exports = {
  addRoomListings,
  editRoomListings,
  deleteRoomListings,
  dashboardListings,
  multiroom,
  renderRoomPage,
};
