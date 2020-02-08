//Code by 정지형
var express = require('express');
var router = express.Router();
var User = require('../models/User');
var moment = require('moment');
var Apply = require('../models/Apply');
var APIApply = require('../models/APIApply');
var mongo = require('mongodb');
var Aban = require('../models/Aban');

var item = [];
var as = [];
var aa = [];
var adminapply=[];

/* 회원가입 페이지 */
router.get('/join', function(req, res, next) {
  res.render('join');//join.ejs 페이지 이동
});

/* 회원가입 처리 */
router.post('/join', function(req, res, next) {
  //POST 방식으로 넘어오는 User파라미터 값 저장
  var id = req.body.id;
  var password = req.body.password;
  var name = req.body.name;
  var phone = req.body.phone;
  User.create({//User생성
    id : id,
    password : password,
    name : name,
    phone: phone
  });
  console.log('회원가입 성공');
  res.redirect('/users/login');//login.ejs 페이지 이동
});

/* 로그인 페이지*/
router.get('/login', function(req, res, next) {
  res.render('login');//login.ejs 페이지 이동
});

/* 로그인 처리 */
router.post('/login', function(req, res, next) {
  User.findOne({ //입력한 아이디와 비밀번호 값이 User에 존재하는지 검색
    id : req.body.id,
    password : req.body.password
  },function(err,exists){
    if(err) throw err;
    if(exists) { //해당 User가 존재한다면
      req.session.user = { //user세션 생성
        objId : exists._id,
        id : exists.id,
        password : exists.password,
        name : exists.name,
        phone : exists.phone,
        autorized : true
      };
      console.log('세션생성'); 
      res.redirect('/'); //index페이지 이동
    }else{//존재하지 않는다면
      res.send('<script type="text/javascript">alert("회원정보가 맞지 않습니다."); location.href = "/users/login"</script>');
      //회원정보가 맞지않는다는 알림창을 띄운뒤 login 페이지로 이동
    }
  });
});

/* 로그아웃 처리 */
router.get('/logout', function (req, res, next) {
  req.session.destroy(function (err) {//user세션 삭제
    if (err) throw err;
    console.log('세션을 삭제하고 로그아웃되었습니다.');
    res.redirect('/');//index페이지 이동
  });
});

/* 마이페이지 업데이트 기능 */
router.post('/mypage/update', function (req, res, next) {
  var name = req.body.name;
  var phone = req.body.phone;
  var objId = req.session.user._id;
  var id = req.session.user.id;
  var password = req.session.user.password;
  //마이페이지에서 수정한 값을 업데이트
  User.update({id: req.session.user.id},{name: name, phone : phone},function (err, result) {
    if(err) throw err;
    if(result){//수정된 값이 있다면
      console.log("-------");    
      console.log(result);
      
      req.session.user = { //user세션 재생성
        objId : objId,
        id : id,
        password : password,
        name : name,
        phone : phone,
        autorized : true
      };      
      res.redirect('/users/mypage');//mypage.ejs로 페이지 이동                
    }
  });
  
});
//Code by 김서현
router.get('/mypage', function (req, res, next) {
  if (req.session.user) {
    var sid = req.session.user.id;
    Apply.find({ id: sid })
      .then((result) => {
        item = result;
        console.log(`result ${item}`);
        return Apply.find({ aid: sid });
      }).then((findResult) => {
        as = findResult;
        console.log(`findResult ${as}`);
        return APIApply.find({ id: sid });
      }).then((aaresult) => {
        aa = aaresult;
        console.log(`aaresult ${aa}`);
        if(sid=='admin'){
          return APIApply.find({}).then((adminresult)=>{
            adminapply=adminresult;
            console.log(`adminresult ${adminapply}`);
          });
        }
      }).then(() => {
        if(sid=='admin'){
          res.render('mypage', { header: null, session: req.session, item: item, as: as, moment, aa: aa , adminapply });
        }else
          res.render('mypage', { header: null, session: req.session, item: item, as: as, moment, aa: aa });
        as = [];
        item = [];
        aa = [];
      });
  }
  else { //세션이 없으면 
    res.send('<script type="text/javascript">alert("로그인 후 이용해주세요."); location.href = "/users/login"</script>');
  }
});
router.post('/mypage/adelete', function (req, res, next) {
  var applyid = req.body.applyid;
  Apply.remove({ _id: applyid }, function (err) {
    res.redirect('/users/mypage');
  });
});
router.post('/mypage/aaccept', function (req, res, next) {
  var applyid = req.body.applyid;
  Apply.updateOne({ _id: applyid }, { $set: { state: '승인' } }, function () {
    res.redirect('/users/mypage');
  });
});
router.post('/mypage/acancel', function (req, res, next) {
  var applyid = req.body.applyid;
  Apply.updateOne({ _id: applyid }, { $set: { state: '등록자취소' } }, function () {
    res.redirect('/users/mypage');
  });
});
router.post('/mypage/acomplete', function (req, res, next) {
  var applyid = req.body.applyid;
  var ano = req.body.ano;
  Apply.updateOne({ _id: applyid }, { $set: { state: '분양완료' } }, function () {
    Aban.updateOne({ano:parseInt(ano)},{$set: {state:'end'}}).then(()=>{
      res.redirect('/users/mypage');
    });

  });
});
router.post('/mypage/aadelete', function (req, res, next) {
  var apiapplyid = req.body.apiapplyid;
  APIApply.remove({ _id: apiapplyid }, function (err) {
    res.redirect('/users/mypage');
  });
});
router.post('/mypage/adminaccept', function (req, res, next) {
  var apiapplyid = req.body.apiapplyid;
  APIApply.updateOne({ _id: apiapplyid }, { $set: { state: '승인' } }, function () {
    res.redirect('/users/mypage');
  });
});
router.post('/mypage/admincancel', function (req, res, next) {
  var apiapplyid = req.body.apiapplyid;
  APIApply.updateOne({ _id: apiapplyid }, { $set: { state: '거절(사유)' } }, function () {
    res.redirect('/users/mypage');
  });
});

router.get('/mypage/applysangse', function (req, res) {
  var aas;
  var noid=req.query.noid;
  var noid=new mongo.ObjectID(noid);
  console.log(`${noid}되니 ?`)
  if (req.session.user) {
    APIApply.findOne({ _id:noid }).then((result) => {
      aas=result;
      console.log(`머임?${result}`)
      res.render('miroapet/apipetapplysangse', { title: '상세보기', session: req.session, moment, aa: aas });
      
    });
  } else {
    res.send('<script type="text/javascript">alert("로그인이 필요한 서비스입니다."); location.href = "/users/login"</script>');
  }
});

router.get('/close', function (req, res, next) {
  res.render('miroapet/close');
});


module.exports = router;
