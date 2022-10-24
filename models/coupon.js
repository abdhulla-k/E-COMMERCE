const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const couponSchema = new Schema({
    coupon: {
        type: String,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    maxDiscount: {
        type: Number,
        required: true
    },
    minAmount: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model("Coupon", couponSchema);