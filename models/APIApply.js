var mongoose = require("mongoose");

//User스키마 정의
var APIApplySchema = mongoose.Schema({
    id : String,
    careNm : String,
    careTel : String,
    careAddr : String,
    chargeNm : String,
    officetel : String,
    name : String,
    phone : String,
    email : String,
    age : String,
    time : String,
    loc : String,
    m : String,
    s : String,
    q1 : String,
    q102 : String,
    q2 : String,
    fam : String,
    q4 : String,
    q5 : String,
    q5 : String,
    q6 : String,
    q7 : String,
    q81 : String,
    q82 : String,
    q9 : String,
    q10 : String,
    q11 : String,
    q12 : String,
    state :String,
    applidate : {type:Date, default:Date.now} 

});

var APIApply = mongoose.model('APIApply',APIApplySchema);
module.exports = APIApply;