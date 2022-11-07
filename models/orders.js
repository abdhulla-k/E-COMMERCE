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
    userName: {
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
    userOrderId: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    address: {
        type: Object,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    productId: {
        type: mongoose.Types.ObjectId,
        required: true
    }

})

const orderSchema = new Schema({
    sellerId: {
        type: String,
        required: true
    },
    orders: [orders]
})

module.exports = mongoose.model('order', orderSchema);