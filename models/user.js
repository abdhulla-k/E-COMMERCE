const mongoose = require( "mongoose" );

const Schema = mongoose.Schema;

const addressScema = new Schema({
    home: {
        type: String,
        required: true
    },
    street: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    zip: {
        type: String,
        require: true
    }

})

const productsSchema = new Schema({
    productId: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    }
})

const ordersSchema = new Schema({
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    address: {
        type: Object,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        required: true
    },
    products: [productsSchema]

})

const applyedCoupon = new Schema({
    year: {
        type: Date,
        required: true
    },
    coupon: {
        type: String,
        required: true
    }
})

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true
    },
    address: [addressScema],
    orders: [ordersSchema],
    couponsAppied: [applyedCoupon]
})

module.exports = mongoose.model( "User", userSchema );