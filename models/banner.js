const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bannerSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image : {
        type: String,
        require: true
    }
})

module.exports = mongoose.model("Banner", bannerSchema);