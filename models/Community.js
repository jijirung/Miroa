//Code by 정지형
var mongoose = require("mongoose"); //MongoDB 연동 라이브러리
var User = require("./User"); 

/*Community(커뮤니티)스키마 정의*/
var CommunitySchema = mongoose.Schema({
    ctype : String, //[커뮤니티 카테고리 타입] 값이 1=찾은 후기 2=분양후기 3=소통/잡담
    title : String,//[제목]
    image: String, //[사진]
    type : String, //[동물종류 카테고리] 찾은 후기와 분양후기라면 동물종류 카테고리가 있어야 함.
    contents : String,//[내용]
    writer : { //[작성자]
        type : mongoose.Schema.Types.ObjectId,//타입은 objectId
        ref : 'User'//User의 스키마를 참조
    },
    comments : [{//[댓글]
        writer : {//[댓글의 작성자]
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User'
        },
        contents : String,//[댓글 내용]
        created_at : {type:Date, default:Date.now} //[댓글 작성날짜]         
    }],
    created_at : {type:Date, default:Date.now} //[작성 날짜]
});

var Community = mongoose.model('Community',CommunitySchema);//CommunitySchema를 Community라는 모델로 사용
module.exports = Community; //Community 모듈 추출