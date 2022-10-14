const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orders = new Schema({
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        require: true
    },
    address: {
        type: Object,
        required: true
    }

})

const orderSchema = new Schema({
    sellerId: {
        type: String,
        required: true
    },
    orders: []
})

module.exports = mongoose.model('order', orderSchema);