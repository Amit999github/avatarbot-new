const ExpressError = require("../utils/ExpressError.js");
const {userSchema, loginSchema} = require("../schema.js")

// ============================= validate signup user middleware ============================
module.exports.validateSignupUser =  (req, res, next) =>{
  const { name, mobile_no, email, password, con_password } = req.body;
  let { error } = userSchema.validate({ name, mobile_no, email, password, con_password }, { abortEarly: false });
  if(error){
      let errMsg = error.details.map(el => el.message).join(",");
      throw new ExpressError(errMsg , 400);
  }
  else{
      next();
  }
}

// ============================ validate login user middleware ==================================
module.exports.validateloginUser = (req, res, next) =>{
  const { email, password } = req.body;
  let { error } = loginSchema.validate({ email, password }, { abortEarly: false });
  if(error){
      let errMsg = error.details.map(el => el.message).join(",");
      throw new ExpressError(errMsg , 400);
  }
  else{
      next();
  }
}

