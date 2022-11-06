const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const WatchlistSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    products: []
})

module.exports = mongoose.model("Wishlist", WatchlistSchema);