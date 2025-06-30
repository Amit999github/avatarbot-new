const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    mobile_no: {
      type: Number,
      required: true,
      match: /^[0-9]{10}$/,
    },
    rooms: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Room',
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('User', userSchema);
