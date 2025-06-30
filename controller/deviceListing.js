const mongoose = require('mongoose');
const Room = require('../models/listings.js');
const Device = require('../models/devices_schema.js');
const wrapAsync = require('../utils/wrapAsync.js');
const { auth, db } = require('../firebaseConfig');

// ============================================= device listings ==============================
const deviceListings = wrapAsync(async (req, res) => {
  let { roomName } = req.params;
  let { deviceType, deviceName, deviceId } = req.body;
  let rooms = await Room.find({ roomName: roomName });

  if (rooms.length === 0) {
    req.flash('error', 'Room not found');
    return res.redirect(`/c/${roomName}`);
  }

  for (const room of rooms) {
    let newDevice = new Device({
      deviceType,
      deviceName,
      deviceId,
      roomId: room._id,
    });
    await newDevice.save();
    room.devices.push(newDevice);
    await room.save();
  }

  req.flash('success', 'Devices created successfully');
  res.redirect(`/listings/${roomName}`);
});
// ============================================= button listing ==============================
const buttonListings = wrapAsync(async (req, res) => {
  let { roomName, _id, deviceType, deviceName } = req.params;
  let rooms = await Room.find({ roomName: roomName });

  let room = rooms.map((r) => r._id.toString().slice(-5));
  const id = _id.toString().slice(-5);
  const Uid = req.session.user.uid.toString().slice(-5);
  const status = req.body.status;

  await db
    .ref(`users/${req.session.user.uid}/StringIn`)
    .set(`$${Uid},${room},${id},${deviceType},${deviceName},${status}%`);

  req.flash('success', 'Request sent successfully');
  res.redirect(`/listings/${roomName}`);
});

const buttonEditListings = wrapAsync(async (req, res) => {
  let { roomName, _id, deviceId } = req.params;
  let { deviceName } = req.body;
  await Device.findByIdAndUpdate(deviceId, { deviceName });
  req.flash('success', 'Device Edit Successfully');
  res.redirect(`/listings/${roomName}`);
});
// ============================================= button Delete listing ==============================

const buttonRemoveListing = wrapAsync(async (req, res) => {
  let { roomName, _id, deviceId } = req.params;
  await Room.findByIdAndUpdate(_id, { $pull: { devices: deviceId } });
  await Device.findByIdAndDelete(deviceId);
  req.flash('success', 'Device deleted successfully');
  res.redirect(`/listings/${roomName}`);
});

module.exports = { deviceListings, buttonListings, buttonEditListings, buttonRemoveListing };
