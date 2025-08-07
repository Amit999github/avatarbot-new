const mongoose = require('mongoose');
const Room = require('../models/listings.js');
const Device = require('../models/devices_schema.js');
const wrapAsync = require('../utils/wrapAsync.js');
const { auth, db } = require('../firebaseConfig');

// ============================================= device listings ==============================
const deviceListings = wrapAsync(async (req, res) => {
  let { roomName } = req.params;
  let { deviceType, deviceName, deviceId } = req.body;
  const userId = req.session.user.uid;

  const room = await Room.findOne({ roomName, userId });

  if (!room) {
    req.flash('error', 'Room not found');
    return res.redirect(`/listings/${roomName}`);
  }

  const firebaseRoom = room.firebaseRoom;
  if (!firebaseRoom) {
    req.flash('error', 'firebaseRoom not found for this room');
    return res.redirect(`/listings/${roomName}`);
  }

  const devices = await Device.find({ roomId: room._id }).select('firebaseDevice');
  const usedNumbers = new Set();
  devices.forEach((d) => {
    const match = d.firebaseDevice.match(/^device(\d+)$/);
    if (match) {
      usedNumbers.add(parseInt(match[1], 10));
    }
  });

  let deviceNumber = 1;
  while (usedNumbers.has(deviceNumber)) {
    deviceNumber++;
  }
  const firebaseDevice = `device${deviceNumber}`;

  const newDevice = new Device({
    deviceType,
    deviceName,
    deviceId,
    roomId: room._id,
    firebaseDevice,
  });
  await newDevice.save();

  room.devices.push(newDevice._id);
  await room.save();

  const firebasePath = `users/${userId}/${firebaseRoom}/${firebaseDevice}`;
  const deviceData = {
    [`A${deviceNumber}`]: 0,
    deviceName,
    [`stateA${deviceNumber}`]: 0,
  };

  db.ref(firebasePath).set(deviceData);

  req.flash('success', 'Device created successfully');
  res.redirect(`/listings/${roomName}`);
});
// ============================================= button listing ==============================
const buttonListings = wrapAsync(async (req, res) => {
  const { roomName, _id, deviceType, deviceName } = req.params;
  const userId = req.session.user.uid;
  const status = req.body.status;

  const room = await Room.findOne({ roomName, userId });
  if (!room) {
    req.flash('error', 'Room not found');
    return res.redirect(`/listings/${roomName}`);
  }

  const firebaseRoom = room.firebaseRoom;
  if (!firebaseRoom) {
    req.flash('error', 'firebaseRoom not found');
    return res.redirect(`/listings/${roomName}`);
  }

  const device = await Device.findById(_id);
  if (!device) {
    req.flash('error', 'Device not found');
    return res.redirect(`/listings/${roomName}`);
  }

  const firebaseDevice = device.firebaseDevice;
  const match = firebaseDevice.match(/^device(\d+)$/);
  if (!match) {
    req.flash('error', 'Invalid firebaseDevice format');
    return res.redirect(`/listings/${roomName}`);
  }

  const deviceNumber = match[1];

  const firebasePath = `users/${userId}/${firebaseRoom}/${firebaseDevice}/A${deviceNumber}`;
  await db.ref(firebasePath).set(parseInt(status));

  req.flash('success', 'Device status updated');
  res.redirect(`/listings/${roomName}`);
});

// ============================================= button NameListing ==============================
const buttonEditListings = wrapAsync(async (req, res) => {
  const { roomName, _id, deviceId } = req.params;
  const { deviceName } = req.body;
  const userId = req.session.user.uid;

  const device = await Device.findByIdAndUpdate(deviceId, { deviceName }, { new: true });
  if (!device) {
    req.flash('error', 'Device not found');
    return res.redirect(`/listings/${roomName}`);
  }

  const firebaseDevice = device.firebaseDevice;
  if (!firebaseDevice) {
    req.flash('error', 'firebaseDevice not found for this device');
    return res.redirect(`/listings/${roomName}`);
  }

  const room = await Room.findOne({ roomName, userId });
  if (!room) {
    req.flash('error', 'Room not found');
    return res.redirect(`/listings/${roomName}`);
  }

  const firebaseRoom = room.firebaseRoom;
  if (!firebaseRoom) {
    req.flash('error', 'firebaseRoom not set for this room');
    return res.redirect(`/listings/${roomName}`);
  }

  const firebasePath = `users/${userId}/${firebaseRoom}/${firebaseDevice}/deviceName`;
  await db.ref(firebasePath).set(deviceName);

  req.flash('success', 'Device name updated successfully');
  res.redirect(`/listings/${roomName}`);
});

// ============================================= button Delete listing ==============================

const buttonRemoveListing = wrapAsync(async (req, res) => {
  const { roomName, _id, deviceId } = req.params;
  const userId = req.session.user.uid;

  // 1. Remove device reference from Room
  await Room.findByIdAndUpdate(_id, { $pull: { devices: deviceId } });

  // 2. Find the device to get firebaseDevice before deleting
  const device = await Device.findById(deviceId);
  if (!device) {
    req.flash('error', 'Device not found');
    return res.redirect(`/listings/${roomName}`);
  }

  const firebaseDevice = device.firebaseDevice;

  // 3. Delete device from MongoDB
  await Device.findByIdAndDelete(deviceId);

  // 4. Find the room to get firebaseRoom
  const room = await Room.findOne({ _id });
  if (!room) {
    req.flash('error', 'Room not found');
    return res.redirect(`/listings/${roomName}`);
  }

  const firebaseRoom = room.firebaseRoom;

  if (firebaseRoom && firebaseDevice) {
    const firebasePath = `users/${userId}/${firebaseRoom}/${firebaseDevice}`;
    await db.ref(firebasePath).remove(); // ✅ Remove device from Firebase
  }

  req.flash('success', 'Device deleted successfully');
  res.redirect(`/listings/${roomName}`);
});

module.exports = { deviceListings, buttonListings, buttonEditListings, buttonRemoveListing };
