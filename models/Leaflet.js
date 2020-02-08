var mongoose = require("mongoose");

//User스키마 정의
var LeafletSchema = mongoose.Schema({
    id : String,
    date : String, //find or lost date
    title : String,
    location : String,
    kinds : String,
    distinction : String,
    state : String,
    type : String, //find or lost
    img : String,
    created_at : {type:Date, default:Date.now}
});

var Leaflet = mongoose.model('Leaflet',LeafletSchema);
module.exports = Leaflet;
