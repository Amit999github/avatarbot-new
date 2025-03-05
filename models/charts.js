const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const consumptionSchema = new Schema({
    userId:{type:String, require:true },
    timestamp: { type: Date, required: true },
    hour: { type: Number, min: 0, max: 23, required: true },
    day: { type: Number , min: 1, max: 31, required: true },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
    total_consumption: { type: Number, required: true },
});



const consumptionData = mongoose.model('Consumption', consumptionSchema);

module.exports = {consumptionData};
