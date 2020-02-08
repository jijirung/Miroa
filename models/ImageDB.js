var mongoose = require("mongoose");

//User스키마 정의
var ImageDBSchema = mongoose.Schema({
    Kinds : String,
    path : String,
    created_at : {type:Date, default:Date.now} 
});

var ImageDB = mongoose.model('ImageDB',ImageDBSchema);
module.exports = ImageDB;