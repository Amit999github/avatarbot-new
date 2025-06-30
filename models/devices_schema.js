const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deviceSchema = new Schema({
  deviceType: {
    type: String,
    required: true,
  },
  deviceName: {
    type: String,
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  roomId: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Device', deviceSchema);
