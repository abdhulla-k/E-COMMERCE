const mongoose = require("mongoose");

const Schema = mongoose.Schema;

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

const cartSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    products: [productsSchema]
})

module.exports = mongoose.model("Cart", cartSchema);