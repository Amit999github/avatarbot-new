const ExpressError = require('../utils/ExpressError.js');
const { roomJoiSchema } = require('../schema.js');

// ==================================== validate Room listing ==========================
const validateroomListings = (req, res, next) => {
  console.log(req.body.room_name, 'room_name validation');
  let { error } = roomJoiSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(',');
    throw new ExpressError(errMsg, 400);
  } else {
    next();
  }
};

module.exports = { validateroomListings };
