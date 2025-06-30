const ExpressError = require('../utils/ExpressError.js');
const { deviceJoiSchema, roomJoiSchema } = require('../schema.js');

// ==================================== validate device listing ==========================
const validatedeviceListings = (req, res, next) => {
  let { roomName } = req.params;
  let { error } = deviceJoiSchema.validate(req.body, { abortEarly: false });
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(',');
    req.flash('error', `${errMsg}`);
    res.redirect(`/listings/${roomName}`);
  } else {
    next();
  }
};

module.exports = { validatedeviceListings };
