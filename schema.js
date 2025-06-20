const joi = require('joi');
const myCustomJoi = joi.extend(require('joi-phone-number'));

 module.exports.userSchema = myCustomJoi.object({
        name : myCustomJoi.string().min(3).max(50).required().messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 3 characters long',
            'string.max': 'Name must be at most 50 characters long'
        }),
        mobile_no : myCustomJoi.string().phoneNumber({ defaultCountry: 'IN', format: 'e164' }).required(),
        email : myCustomJoi.string().email().required(),
        password : myCustomJoi.string().min(6).max(32).required().messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.empty': 'Password is required'
        }),
        con_password: myCustomJoi.string().valid(myCustomJoi.ref('password')).required().messages({
            'any.only': 'Confirm password must match the password',
            'string.empty': 'Confirm password is required'
        })
});

module.exports.loginSchema = myCustomJoi.object({
    email : myCustomJoi.string().email().required(),
    password : myCustomJoi.string().min(6).max(32).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.empty': 'Password is required'
    }),
})

module.exports.deviceJoiSchema = myCustomJoi.object({
    deviceType : myCustomJoi.string().valid('on_off_switch', 'fan_switch', 'others')
    .required()
    .messages({
        'any.only': 'Invalid device type selected',
        'string.empty': 'Device type is required'
    }),
    deviceName: myCustomJoi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Device name is required',
            'string.min': 'Device name must be at least 3 characters long',
            'string.max': 'Device name must be at most 10 characters long'
        }),
    deviceId: myCustomJoi.string()
    .min(2)
    .max(50)
    .messages({
        'string.empty': 'Device Id is required',
        'string.min': 'Device Id must be at least 3 characters long',
        'string.max': 'Device Id must be at most 10 characters long'
    }),

    selectedType : myCustomJoi.string().allow("", null),
    _csrf: myCustomJoi.string().optional(),
})

module.exports.roomJoiSchema = myCustomJoi.object({
    room_name: myCustomJoi.string().trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Room name is required',
            'string.min': 'Room name must be at least 2 characters long',
            'string.max': 'Room name must be at most 50 characters long'
        }),

    userId: myCustomJoi.string()
        .allow("", null),
    _csrf: myCustomJoi.string().optional(),
});