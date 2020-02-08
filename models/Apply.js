var mongoose = require("mongoose");

//User스키마 정의
var ApplySchema = mongoose.Schema({
    ano : Number,
    aid : String,
    aphone : String,
    id : String,
    name : String,
    phone : String,
    vday : String,
    vtime : String,
    msg : String,
    state : String, 
    applidate : {type:Date, default:Date.now} 
});

var Apply = mongoose.model('Apply',ApplySchema);
module.exports = Apply;