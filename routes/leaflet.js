var express = require('express');
var router = express.Router();
var Leaflet = require('../models/Leaflet');
const multer = require('multer');
const path = require("path");
var os = require('os');
var fs = require('fs');
var ip = require("ip");

let storage = multer.diskStorage({
    destination: function(req, file ,callback){
        callback(null, "uploads/")
    },
    filename: function(req, file, callback){
        let extension = path.extname(file.originalname.replace(" ", ""));
        let basename = path.basename(file.originalname.replace(" ", ""), extension);

        callback(null, basename + "-" + Date.now() + extension);
    }
});

function getServerIp() {
    var ifaces = os.networkInterfaces();
    var result = '';
    for (var dev in ifaces) {
        var alias = 0;
        ifaces[dev].forEach(function(details) {
            console.log(details.address);
            if (details.family == 'IPv4' && details.internal === false) {
                result = details.address;
                ++alias;
            }
        });
    }

    return result;
}

// const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });
let upload = multer({
    storage: storage
});

router.get('/view', function(req, res, next) {
  var session = false
  if(req.session.user){ 
    session = req.session;
  }
  Leaflet.find({},function(err,leaflet){
      res.render('leafletList',{header: false, session:session, leaflet:leaflet});
      
  })

});
router.get('/chat',function(req, res, next){
  console.log(req.hostname);
  console.log('****************************');
  var session = false
  if(req.session.user){ 
    session = req.session;
  }
  console.log(req.session);
  var serverIp = req.hostname;
  var url = "http://"+serverIp+":3001/chat?name="
  res.redirect(url+req.session.user.name+"&userid="+req.session.user.id+"&room="+req.session.user.name);
})
router.get('/chatWith',function(req, res, next){
  console.log(req.session);
  var serverIp = req.hostname;
  var url = "http://"+serverIp+":3001/chat?name="
  res.redirect(url+req.session.user.name+"&userid="+req.session.user.id+"&room="+req.query.room);
})

router.get('/add', function(req, res, next) {
  var session = false
  if(req.session.user){ 
    session = req.session;
  }
  res.render('leafletAdd',{header: false,session:session});
});

router.get('/detail',function(req,res,next){
  var session = false
  if(req.session.user){ 
    session = req.session;
  }
  Leaflet.findOne({
    _id : req.query._id
  },function(err,exists){
    if(err) throw err;
    if(exists) {
      console.log(exists);
        res.render('leafletdetail',{header: false,leaflet:exists,session:session});
      }


    else {
      res.send('존재하지 않습니다.');
    }
  })
})
router.get('/delete',function(req,res,next){
  var _id = req.query._id;
  var imgPath ;
  Leaflet.findOne({
    _id : req.query._id
  },function(err,exists){
    if(exists){
        imgPath = exists.img;
        console.log(imgPath);
    }
  });

  Leaflet.deleteOne({_id:_id},function(err){
    if(err)
      console.log(err);
    else {
      fs.unlink(imgPath.replace("../",""),(err)=>{ if(err)console.log("에러다 뿅"+ err); else console.log("에러는 안났다 뿅") });
      res.send("<script language=\"javascript\">alert('삭제되었습니다.')</script> <script language=\"javascript\">window.location=\"/leaflet/view\"</script>");
    }
  })

//


    // res.redirect('/leaflet/view');
})
router.get('/update',function(req,res,next){
  var session = false
  if(req.session.user){ 
    session = req.session;
  }
  Leaflet.findOne({
    _id : req.query._id
  },function(err,exists){
    if(err) throw err;
    if(exists) {
      console.log(exists);
        res.render('leafletUpdate',{header: false,leaflet:exists,session:session});
      }
    else {
      res.send('존재하지 않습니다.');
    }
  })
})
router.post('/newUpdate',upload.single('img'),function(req,res,next){
  var date = req.body.date;
  var title = req.body.title;
  var location = req.body.location;
  var kinds = req.body.kinds;
  var distinction = req.body.distinction;
  var state = req.body.state;
  var type = req.body.type;
  console.log("사실 여기가 오류야",req.body._id);
  if(req.file!=null){
    var img = "../"+req.file.path;
    var update = {
      date:date,
      title:title,
      location:location,
      kinds:kinds,
      distinction :distinction,
      stae : state,
      type :type,
      img :img
    };
    Leaflet.findOne({
      _id : req.query._id
    },function(err,exists){
      if(err)
        console.log("사실 여기가 오류야",err);
      if(exists){
          imgPath = exists.img.replace("../","");
          console.log("왜 값 안보여주냐 이놈아"+ imgPath);
          fs.unlink(imgPath,(err)=>{ if(err)console.log("에러다 뿅"+ err); else console.log("에러는 안났다 뿅") });
      }
    });


  }
  else {
    var update = {
      date:date,
      title:title,
      location:location,
      kinds:kinds,
      distinction :distinction,
      stae : state,
      type :type,
    };
  }
  console.log(update);
  console.log("머냐규",req.body._id);
  const filter = {_id:req.body._id};
  console.log(filter);
  Leaflet.updateOne(filter, update,{new: true},function(err,ret){
  if(err)
    console.log(err);
  else if(ret){
    console.log(ret);
    res.redirect('/leaflet/detail?_id=' +  req.body._id);
  }

  });

});


router.post('/insert',upload.single('img'), function(req, res, next) {
  var id = req.body.id;
  var date = req.body.date;
  var title = req.body.title;
  var location = req.body.location;
  var kinds = req.body.kinds;
  var distinction = req.body.distinction;
  var state = req.body.state;
  var type = req.body.type;
  var img = "../"+req.file.path;

  console.log(img);

  Leaflet.create({
    id : id,
    date : date,
    title : title,
    location : location,
    kinds : kinds,
    distinction : distinction,
    state : state,
    type : type,
    img : img
  })
  console.log('등록 성공');
  res.redirect('/leaflet/view');
});

module.exports = router;