var express = require('express');
var router = express.Router();
var ImageDB = require('../models/ImageDB');
var fs = require('fs');
var bodyParser = require('body-parser')

var multer = require('multer');

var ubanneritem = [];
var abanneritem = [];

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/webimg')
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname.replace(" ", ""));
    }
});
var upload = multer({
    storage: storage,
    limits: {
        files: 10,
        fileSize: 1024 * 1024 * 1024
    }
})

router.get('/', function (req, res, next) {
    var introitem = [];
    ImageDB.find({ Kinds: 'intro' }).sort({ create_at: 'desc' }).then(items => {
        introitem = items;
        var session = false
        if (req.session.user) { //세션이 있다면
            session = req.session //session변수에 세션값 저장
        }
        res.render('intro', { header: null, introitem, session: session });
    }).catch(err => console.log(`인트로 ${err}`));
});

router.post('/upload', upload.single('imgfile'), function (req, res) {
    var kinds = req.body.kinds;
    if (!req.file) {
        console.log(`업로드 에러`)
    } else {
        var img = "/webimg/" + req.file.filename;
        console.log(`업로드 성공 ${req.file}`)
    }
    console.log(`값: ${kinds} 이미지 ${img}`)
    if (req.session.user.id) {
        ImageDB.create({
            Kinds: kinds,
            path: img,
        });
        res.redirect('/users/mypage');

    } else {
        res.status(401).send("로그인이 필요한 서비스입니다.");
    }
});
//ajax 유저 배너 이미지
router.get('/userbanner', function (req, res, next) {
    ImageDB.find({ Kinds: 'userbanner' }).sort({ create_at: 'desc' }).then(items => {
        ubanneritem = items;
        res.send(ubanneritem);
        console.log(`배너 전달`);
    }).catch(err => console.log(`배너에러는 ${err}`));
    console.log(`배너 호출`);
});
//ajax 보호소 배너 이미지
router.get('/apibanner', function (req, res, next) {
    ImageDB.find({ Kinds: 'apibanner' }).sort({ create_at: 'desc' }).then(items => {
        abanneritem = items;
        res.send(abanneritem);
        console.log(`배너 전달`);
    }).catch(err => console.log(`배너에러는 ${err}`));
    console.log(`배너 호출`);
});





module.exports = router;
