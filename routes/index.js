//Code by 정지형
var express = require('express');
var router = express.Router();
var Aban = require('../models/Aban');//유저분양모델
var Leaflet = require('../models/Leaflet');//실종신고/발견제보 모델
var moment = require('moment');//date 가공 모듈


/*index 페이지*/
router.get('/', function(req, res, next) { 
  var session = false
  if(req.session.user){ //세션이 있다면
    session = req.session //session변수에 세션값 저장
  }
  Aban.find({}).sort('-time').limit(3).exec(function(err,deliver){//유저분양게시판 최신순 3개의 게시글을 찾음.
    if (err) throw err;
    if (deliver){
      console.log(deliver);

      Leaflet.find({type: 'lost'}).sort('-created_at').limit(3).exec(function(err,lost){//실종신고/발견제보 게시판 최신순 3개의 게시글을 찾음.
        if (err) throw err;
        if (lost){
          console.log(lost);

          Leaflet.find({type: 'find'}).sort('-created_at').limit(3).exec(function(err,find){//실종신고/발견제보 게시판 최신순 3개의 게시글을 찾음.
            if (err) throw err;
            if (find){
              console.log(find);
              res.render('index', {header: false, session: session, deliver: deliver, lost: lost, find: find, moment: moment});
              //index.ejs 페이지 이동과 header,session,lost(실종신고),find(발견제보),moment(날짜가공)변수전달
            }
          });
          
        }
      });

    }
  });
   
});

module.exports = router;
