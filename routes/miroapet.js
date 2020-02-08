var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var User = require('../models/User');
var moment = require('moment');
var fs = require('fs');
//분양신청
var Apply = require('../models/Apply');
var APIApply = require('../models/APIApply');
var item = [];

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//api관련변수
var url = 'http://openapi.animal.go.kr/openapi/service/rest/abandonmentPublicSrvc/abandonmentPublic';
var KEY = 'WQ8ZvZ8flxZKjE6xC22EY7PW7%2F80zwCNM%2FciJmvNd7cVLX5e%2BmjdolgE0V76hSCblnI5KIr7a%2BSgMCyHZNUkmQ%3D%3D';
var api_url = url + '?serviceKey=' + KEY + '&numOfRows=12';
var listitem = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
var apilist = {};
var api;
var totalcnt;
var pagenum;

//유저리스트 
var Aban = require('../models/Aban');
var userlistitem = [];
var utotalcnt;
var upagenum = 1;

//상세정보

//파일 업로드
var multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/images')
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '-' + req.session.user.id + '-' + file.originalname.replace(" ", ""));
    }
});
var upload = multer({
    storage: storage,
    limits: {
        files: 10,
        fileSize: 1024 * 1024 * 1024
    }
})


// var sido_url='http://openapi.animal.go.kr/openapi/service/rest/abandonmentPublicSrvc/sido?serviceKey=WQ8ZvZ8flxZKjE6xC22EY7PW7%2F80zwCNM%2FciJmvNd7cVLX5e%2BmjdolgE0V76hSCblnI5KIr7a%2BSgMCyHZNUkmQ%3D%3D';
// var sidolist = [{orgCds:'0',orgdownNms:'전체'}];
// for (var i = 1; i < 18; i++){
//     sidolist.push({});
// }




router.get('/list', function (req, res) {
    if (req.query.pageNo) {
        var page = req.query.pageNo;
        console.log(`있어? ${page}`);
        pagenum = page;
        api_url = url + '?serviceKey=' + KEY + '&numOfRows=12&pageNo=' + pagenum;
    }
    //api 페이지 자체 속도가 느려서 화면이 뜨지 않아서 promise사용
    reload().then(function () {
        if (req.session.user) { //로그인 세션이 있고 로드 완료일 때
            res.render('miroapet/alist', { header: 'miroapet', session: req.session, item: listitem, tc: totalcnt, pn: pagenum,header:'miroapet' });
            listitem = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
        }
        else { //로그인 세션이 없고 로드 완료일 때
            res.render('miroapet/alist', { header: 'miroapet', session: false, item: listitem, tc: totalcnt, pn: pagenum,header:'miroapet' });
            listitem = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
        }
    }).catch(function (e) {
        res.status(401).send("api 정보를 불러오는 것에 실패하였습니다.");
    });

});
router.get('/list/read', function (req, res) {
    if (req.query.param) {
        apilist = req.query.param;
        apilist = JSON.parse(apilist);
        console.log(`흠${apilist}`);
    }
    if (req.session.user) { //로그인 세션이 있고 로드 완료일 때
        res.render('miroapet/apilistread', { header: 'miroapet', session: req.session, item: apilist, pn: pagenum });
    }
    else { //로그인 세션이 없고 로드 완료일 때
        res.render('miroapet/apilistread', { header: 'miroapet', session: false, item: apilist, pn: pagenum });
    }
});
router.get('/userlist', function (req, res) {
    if (req.query.pageNo) {
        var page = req.query.pageNo;
        console.log(`페이지넘버? ${page}`);
        upagenum = page;
    } else {
        upagenum = 1;
    }
    Aban.count({}, function (err, count) {
        utotalcnt = Math.ceil(parseInt(count) / 12);
    });
    Aban.find({}).sort({ ano: 'desc' }).limit(12).skip(parseInt(upagenum - 1) * 12).then(items => {
        userlistitem = items;
        if (req.session.user) { //로그인 세션이 있고 로드 완료일 때
            res.render('miroapet/useralist', { header: false, session: req.session, userlistitem, tc: utotalcnt, pn: upagenum, moment,searchType:'1',searchStr:null });

        }
        else { //로그인 세션이 없고 로드 완료일 때
            res.render('miroapet/useralist', { header: false, session: false, userlistitem, tc: utotalcnt, pn: upagenum, moment,searchType:'1',searchStr:null });
        }
    }).catch(err => console.log(err));
});
router.get('/userlist/write', function (req, res) {
    if (req.session.user) {
        res.render('miroapet/alistwrite', { header: 'miroapet', session:req.session, id: req.session.user.id, phone: req.session.user.phone, ano: null });
    } else {
        res.status(401).send("로그인이 필요한 서비스입니다.");
    }
});
router.get('/userlist/read', function (req, res) {
    var pn = upagenum;
    var ano;
    var readitem;
    if (req.query.ano) {
        ano = req.query.ano;
        console.log(`게시글번호 ${ano}`);
    } else {
        //ano=1;
    }

    Aban.updateOne({ ano: parseInt(ano) }, { $inc: { views: 1 } }, function () {
    });
    Aban.findOne({ ano: parseInt(ano) }).then(items => {
        readitem = items;
        console.log(`제목 ${readitem.title}`);
        if (req.session.user) { //로그인 세션이 있고 로드 완료일 때
            res.render('miroapet/alistread', { header: 'miroapet', session: req.session, readitem, moment, sessionid: req.session.id, pn: pn });

        }
        else { //로그인 세션이 없고 로드 완료일 때
            res.render('miroapet/alistread', { header: 'miroapet', session: false, readitem, moment, pn: pn });
        }
    }).catch(err => console.log(err));

});
router.post('/userlist/write', upload.single('imgfile'), function (req, res) {
    var kinds = req.body.kinds;
    var title = req.body.title;
    var petgender = req.body.petgender;
    var place = req.body.place;
    var contents = req.body.contents;
    var state = req.body.state;
    console.log(`파일 ${req.body.thumbnail}`)
    if (!req.file) {
        var img = "/images/noimage.png";
        console.log(`이미지 미첨부`)
    } else {
        var img = "/images/" + req.file.filename;
        console.log(`업로드 성공 ${req.file}`)
    }
    console.log(`값: ${kinds} ${title} ${petgender} ${place} ${contents} ${state} 이미지 ${img}`)
    if (req.session.user.id) {
        Aban.create({
            id: req.session.user.id,
            kinds: kinds,
            title: title,
            phone: req.session.user.phone,
            petgender: petgender,
            place: place,
            contents: contents,
            img: img,
            state: state,
            views: 0
        });
        res.redirect('/miroapet/userlist');

    } else {
        res.status(401).send("로그인이 필요한 서비스입니다.");
    }
});

router.get('/userlist/update', function (req, res, next) {
    if (req.session.user) {
        var ano = req.query.ano;
        console.log(ano);

        Aban.findOne({ ano: ano }, function (err, result) {
            console.log(result);
            res.render('miroapet/alistwrite', { header:'miroaper',ano: result,session:req.session, id: req.session.user.id, phone: req.session.user.phone });

        });
    } else {
        res.status(401).send("로그인이 필요한 서비스입니다.");
    }
});

router.post('/userlist/update', upload.single('imgfile'), function (req, res) {
    var ano = req.body.ano;
    var kinds = req.body.kinds;
    var title = req.body.title;
    var petgender = req.body.petgender;
    var place = req.body.place;
    var contents = req.body.contents;
    var state = req.body.state;
    console.log(`파일 ${req.body.thumbnail}`)
    if (!req.file) {
        var img = "/images/noimage.png";
        console.log(`이미지 미첨부`);
        if (req.session.user.id) {
            Aban.update({ ano: ano }, {
                id: req.session.user.id,
                kinds: kinds,
                title: title,
                phone: req.session.user.phone,
                petgender: petgender,
                place: place,
                contents: contents,
                state: state,
                views: 0
            }, function (err, result) {
                if (!err) {
                    res.redirect('/miroapet/userlist/read?ano=' + ano);
                } else {
                    console.log(`업데이트 에러`);
                }
            });
        } else {
            res.status(401).send("로그인이 필요한 서비스입니다.");
        }
    } else {
        var img = "/images/" + req.file.filename;
        console.log(`업로드 성공 ${req.file}`);
        if (req.session.user.id) {
            Aban.update({ ano: ano }, {
                id: req.session.user.id,
                kinds: kinds,
                title: title,
                phone: req.session.user.phone,
                petgender: petgender,
                place: place,
                contents: contents,
                img: img,
                state: state,
                views: 0
            }, function (err, result) {
                if (!err) {
                    res.redirect('/miroapet/userlist/read?ano=' + ano);
                } else {
                    console.log(`업데이트 에러`);
                }
            });
        } else {
            res.status(401).send("로그인이 필요한 서비스입니다.");
        }
    }
    console.log(`값: ${kinds} ${title} ${petgender} ${place} ${contents} ${state} 이미지 ${img}`)
    
});

router.post('/userlist/delete', function (req, res, next) {
    var ano = req.body.ano;
    var imgPath;
    Aban.findOne({
        ano: ano
    }, function (err, exists) {
        if (exists) {
            imgPath = exists.img;
            console.log(imgPath);
        }
    });
    Aban.remove({ ano: ano }, function (err) {
        if(imgPath!='/images/noimage.png')
            fs.unlink(imgPath.replace("/", "./public/"), (err) => { if (err) console.log("에러다" + err); else console.log("에러는 안났다") });

        res.redirect('/miroapet/userlist');
    });
});

router.get('/userlist/search', function (req, res, next) {
    var session = false
    if (req.session.user) { //세션이 있으면 index페이지로
        session = req.session
    }
    var page = req.query.pageNo;
    if (page == null) { page = 1; }

    var searchStr = req.query.searchStr;
    var searchType = req.query.searchType;
    var id;

    console.log('str: ' + searchStr);
    console.log('pn: ' + page);

    var skipSize = (page - 1) * 12;
    var limitSize = 12;
    var pageNum = 1;
    if (searchType == 1) {
        Aban.count({ title: { $regex: searchStr } }, function (err, totalCount) {
            if (err) throw err;
            pageNum = Math.ceil(totalCount / limitSize);
            Aban.find({ title: { $regex: searchStr } }).sort('-time').skip(skipSize).limit(limitSize).exec(function (err, result) {
                if (err) throw err;
                if (result) {
                    console.log("========");
                    console.log(result);
                    res.render('miroapet/useralist', { header: 'miroapet', page: page, searchType: searchType, searchStr: searchStr, session: session, userlistitem: result, moment: moment, pn: page, skipSize: skipSize, tc: Math.ceil(totalCount/12) });
                }
            });
        });
    } else {
        Aban.count({ id: { $in: searchStr } }, function (err, totalCount) {
            if (err) throw err;
            pageNum = Math.ceil(totalCount / limitSize);
            Aban.find({ id: { $in: searchStr } }).sort('-time').skip(skipSize).limit(limitSize).exec(function (err, result) {
                if (err) throw err;
                if (result) {
                    console.log("========");
                    console.log(result);
                    res.render('miroapet/useralist', { header: 'miroapet', page: page, searchType: searchType, searchStr: searchStr, session: session, userlistitem: result, moment: moment, pn: page, skipSize: skipSize, tc: Math.ceil(totalCount/12) });
                }
            });
        });
    }

});

//댓글 작성
router.post('/userlist/comment/write', function (req, res, next) {
    if (req.session.user) {
        var ano = req.query.ano;
        console.log(req.body.content);
        var commentObj = { writer: req.session.user.id, content: req.body.content };
        Aban.update({ ano: ano }, { $push: { comments: commentObj } }, function (err, result) {
            res.redirect('/miroapet/userlist/read?ano=' + ano);
        });
    } else {
        res.status(401).send("로그인이 필요한 서비스입니다.");
    }
});
//댓글삭제
router.post('/userlist/comment/delete', function (req, res, next) {
    var ano = req.query.ano;
    var read_id = req.body.read_id;
    var commentId = req.body.commentId;
    console.log(`${ano}엄..코멘트삭제`)
    Aban.update({ _id: read_id }, { $pull: { comments: { "_id": commentId } } }, function (err, result) {
        if (err) {
            console.log(err)
        } else
            res.redirect('/miroapet/userlist/read?ano=' + ano);
    });
});
//댓글수정
router.post('/userlist/comment/save', function (req, res, next) {
    var ano = req.query.ano;
    var read_id = req.body.read_id;
    var commentId = req.body.commentId;
    var updateCo = req.body.updateCo;
    Aban.update({ '_id': read_id, 'comments._id': commentId }, { '$set': { 'comments.$.content': updateCo } }, function (err, result) {
        if (result) {
            res.redirect('/miroapet/userlist/read?ano=' + ano);
        }
    });
});

router.get('/userlist/apply', function (req, res) {
    var ano = req.query.ano;
    var aid = req.query.aid;
    if (req.session.user) {
        res.render('miroapet/petapply', { header: 'miroapet', session: req.session, ano: null, date: Date.now(), ano: ano, aid: aid });
    } else {
        res.status(401).send("로그인이 필요한 서비스입니다.");
    }
});
router.get('/list/apply', function (req, res) {
    var apiitem;
    if (req.query.param) {
        apiitem = req.query.param;
        apiitem = JSON.parse(apiitem);
    }
    if (req.session.user) {
        res.render('miroapet/apipetapply', { header: 'miroapet', session: req.session, date: Date.now(), apiitem });
    } else {
        res.status(401).send("로그인이 필요한 서비스입니다.");
    }
});


router.post('/userlist/apply', function (req, res, next) {
    var ano = req.body.ano;
    var aid = req.body.aid;
    var vday = req.body.vday;
    var vtime = req.body.vtime;
    var msg = req.body.msg;
    var aphone;
    var name = req.session.user.name;
    var phone = req.session.user.phone;

    console.log(`${ano}글번호/${aid}랑 ${vtime}이랑 ${msg}`)
    User.findOne({ id: aid }).then(result => {
        aphone = result.phone;
    }).then(() => {
        if (req.session.user) {
            Apply.create({
                aid: aid,
                ano: parseInt(ano),
                aphone: aphone,
                id: req.session.user.id,
                name: name,
                phone: phone,
                vday: vday,
                vtime: vtime,
                msg: msg,
                state: '신청중'
            });
            res.redirect('/users/close');

        } else {
            res.status(401).send("로그인이 필요한 서비스입니다.");
        }
    });

    console.log(`포스트 됐음`);
});

router.post('/list/apply', function (req, res, next) {
    var s = req.body.s;
    var age = req.body.age;
    var name = req.session.user.name;
    var id = req.session.user.id;
    var phone = req.session.user.phone;
    var email = req.body.email;
    var time = req.body.time;
    var loc = req.body.loc;
    var m = req.body.m;
    var q1 = req.body.q1;
    var q102 = req.body.q102;
    var q2 = req.body.q2;
    var fam = req.body.fam;
    var q4 = req.body.s;
    var q5 = req.body.q5;
    var q6 = req.body.q6;
    var q7 = req.body.q7;
    var q81 = req.body.q81;
    var q82 = req.body.q82;
    var q9 = req.body.q9;
    var q10 = req.body.q10;
    var q11 = req.body.q11;
    var q12 = req.body.q12;
    var careNm = req.body.careNm;
    var careTel = req.body.careTel;
    var careAddr = req.body.careAddr;
    var chargeNm = req.body.chargeNm;
    var officetel = req.body.officetel;
    console.log(`포스트 됐음`);
    if (req.session.user) {
        APIApply.create({
            id: id,
            s: s,
            age: age,
            name: name,
            phone: phone,
            email: email,
            time: time,
            loc: loc,
            m: m,
            q1: q1,
            q102: q102,
            q2: q2,
            fam: fam,
            q4: q4,
            q5: q5,
            q6: q6,
            q7: q7,
            q81: q81,
            q82: q82,
            q9: q9,
            q10: q10,
            q11: q11,
            q12: q12,
            careNm: careNm,
            careTel: careTel,
            careAddr: careAddr,
            chargeNm: chargeNm,
            officetel: officetel,
            state: '심사중'
        });
        console.log(`api 분양신청`);
        res.redirect('/users/close');

    } else {
        res.status(401).send("로그인이 필요한 서비스입니다.");
    }


});

//api 페이지 자체 속도가 느려서 화면이 뜨지 않아서 promise사용
function reload(callback) {
    // new Promise() 추가
    return new Promise(function (resolve, reject) {
        request(api_url, function (err, res, body) {
            if (err) {
                console.log(`err => ${err}`)
            }
            else {
                if (res.statusCode == 200) {
                    var $ = cheerio.load(body);
                    $('item').each(function (idx) {
                        listitem[idx].popfile = $(this).find('popfile').text();
                        listitem[idx].happenDt = $(this).find('happenDt').text();
                        listitem[idx].noticeSdt = $(this).find('noticeSdt').text();
                        listitem[idx].noticeEdt = $(this).find('noticeEdt').text();
                        listitem[idx].orgNm = $(this).find('orgNm').text();
                        listitem[idx].kindCd = $(this).find('kindCd').text();
                        listitem[idx].specialMark = $(this).find('specialMark').text();
                        listitem[idx].happenPlace = $(this).find('happenPlace').text();
                        listitem[idx].processState = $(this).find('processState').text();
                        listitem[idx].colorCd = $(this).find('colorCd').text();
                        listitem[idx].weight = $(this).find('weight').text();
                        listitem[idx].age = $(this).find('age').text();
                        listitem[idx].sexCd = $(this).find('sexCd').text();
                        listitem[idx].neuteryn = $(this).find('neuteryn').text();
                        listitem[idx].careNm = $(this).find('careNm').text();
                        listitem[idx].careTel = $(this).find('careTel').text();
                        listitem[idx].careAddr = $(this).find('careAddr').text();
                        listitem[idx].chargeNm = $(this).find('chargeNm').text();
                        listitem[idx].officetel = $(this).find('officetel').text();
                        //console.log(`${idx}번째 popfile= ${listitem[idx].popfile} `);

                    });
                    $(body).each(function () {
                        totalcnt = $(this).find('totalCount').text();
                        totalcnt = Math.ceil(parseInt(totalcnt) / 12);
                        pagenum = $(this).find('pageNo').text();

                    });
                    resolve('불러오기 성공!');
                }
            }
        });
    });
};




module.exports = router;
