//Code by 정지형
var mongoose = require("mongoose");//MongoDB 연동 라이브러리

//User(회원)스키마 정의
var UserSchema = mongoose.Schema({
    id : String,//[아이디]
    password : String,//[비밀번호]
    name : String,//[이름]
    phone : String,//[핸드폰 번호]
    created_at : {type:Date, default:Date.now}//[가입날짜]
});

var User = mongoose.model('User',UserSchema);//UserSchema를 User라는 모델로 사용
module.exports = User;//Community 모듈 추출