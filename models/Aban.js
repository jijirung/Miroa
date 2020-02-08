var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.createConnection("mongodb://localhost/miroa_pet",{useNewUrlParser:true, useUnifiedTopology:true});
mongoose.set('useCreateIndex', true);
autoIncrement.initialize(connection);
//유저 리스트 스키마 정의
var AbanSchema = new Schema({
    ano : Number,
    id : String,
    kinds : String,
    title : String,
    phone : String,
    petgender : String,
    place : String,
    contents : String,
    time : {type:Date, default:Date.now},
    img : {type:String,default:"../public/images/noimage.png"},
    state : String,
    views : Number,
    comments: [{
        writer: String,
        content: String,
        createdAt: {type:Date,default:Date.now}
    }]
});

AbanSchema.plugin(autoIncrement.plugin,{ 
        model : 'Aban',
        field : 'ano',
        startAt : 1,    
});



var Aban = mongoose.model('Aban',AbanSchema);
module.exports = Aban;