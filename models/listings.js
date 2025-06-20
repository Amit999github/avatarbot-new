const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Device  = require("./devices_schema.js");

const roomSchema = new Schema({
    roomName: { 
        type: String, 
        required: true ,
        minlength : 2,
        maxlength : 50
    },
    userId: { 
        type: String, 
        required: true
    },
    devices :[
        {
            type: Schema.Types.ObjectId,
            ref: 'Device'
        }
    ]
});

roomSchema.post('findOneAndDelete', async function (doc){
    if (doc) {
        await Device.deleteMany({
            _id : {
                $in : doc.devices,
            }
        })
    }
});

module.exports = mongoose.model('Room', roomSchema);