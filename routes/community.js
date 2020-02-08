//Code by 정지형
var express = require('express');//express 모듈
var router = express.Router();//라우팅 모듈
var multer = require('multer');//file 업로드 모듈
var moment = require('moment');//date 가공 모듈
var User = require('../models/User');//유저 모델
var Community = require('../models/Community');//커뮤니티모델

const upload = multer({//사진 업로드를 위해 file 업로드 모듈인 multer 사용
  storage: multer.diskStorage({
    destination: function (req, file, cb) { //파일이 저장될 경로(destination)
      cb(null, 'public/images/');
    },
    filename: function (req, file, cb) { // 파일명(filename)
      cb(null, new Date().valueOf() + file.originalname); //파일명중복되지않게 타임스탬프.확장자 형식으로 지정
    }
  }),
});

/*community 페이지*/
router.get('/', function(req, res, next) {
  var session = false
  if(req.session.user){ 
    session = req.session
  }
  var ctype = req.param('ctype');//커뮤니티 카테고리 타입
  var page = req.param('page');
  if(page == null) {page =1;}//페이지가 없을 경우 1의 기본값
  var skipSize = (page-1)*5;//스킵할 리스트 수
  var limitSize = 5; //최대 리스트 수
  var pageNum = 1; //페이지 번호

  Community.count({ctype:ctype}, function(err, totalCount){//community의 리스트수
    if(err) throw err;
    pageNum = Math.ceil(totalCount/limitSize); //페이지 수 계산
    Community.find({ctype:ctype}).populate('writer').sort('-created_at').skip(skipSize).limit(limitSize).exec( function (err, result) {
      /*어떤 카테고리인지 검색,
       writer의 _id값이 같은 User의 정보를 json형태로 받아오고 
       작성날짜가 최신인게 제일 위로 정렬되게함.
       스킵할 리스트의 수와 최대 리스트 수를 보내 페이징 함. */
      if(err) throw err;
      if(result){//검색된 값 전달
        res.render('community/community_list',{ctype: ctype, page: page, header: 'community', searchType:1, searchStr: '', session: session, posts: result, moment: moment, pagination: pageNum, skipSize: skipSize, totalCount: totalCount});
        //community_list.ejs페이지로 이동
        /*
        ctype: 카테고리, page: 페이지, header: 내비게이션(소개,분양신청,...)에서 누른 값, searchType:검색 타입 초기값 1=제목,2=작성자 
        searchStr: 검색창에 입력한 값 , session: user세션, posts: cummunity리스트값, moment: 날짜를 내가 원하는 형식으로 변환, 
        pagination: 페이지 번호 , skipSize: 스킵할 리스트 수, totalCount: community의 리스트 갯수
        */
      }
    });   
  }); 
});

/*community 생성페이지*/
router.get('/create',  function(req, res, next) {
  var ctype = req.param('ctype');
  if(req.session.user){ //세션이 있으면 community 생성페이지이동 
    res.render('community/community_write', {ctype: ctype, header: 'community',session: req.session, posts: null});
  }else{ //세션이 없으면 alert창을 띄운 후 로그인 페이지로 이동
    res.send('<script type="text/javascript">alert("작성권한이 없습니다."); location.href = "/users/login"</script>');
  }
});

router.post('/create', upload.single('image'), function(req, res, next) {
  console.log('ctype: ' + req.body.ctype);
  if(req.file){//이미지 파일을 올렸다면 업로드
    if(req.body.type){//type(강아지, 고양이, 기타 반려동물)값이 있다면 찾은 후기와 분양 후기 커뮤니티카테고리이므로 type값 저장
      Community.create({
        image: "/images/"+req.file.filename,
        ctype : req.body.ctype,
        type: req.body.type,
        title : req.body.title,
        contents : req.body.contents,
        writer: req.session.user.objId
      });
    }else{//type이 없다면 소통/잡담 커뮤니티카테고리이므로 type을 저장하지 않음.
      Community.create({
        image: "/images/"+req.file.filename,
        ctype : req.body.ctype,
        title : req.body.title,
        contents : req.body.contents,
        writer: req.session.user.objId
      });
    }
  }else{//이미지 파일을 업로드 하지 않았다면 파일을 저장하지 않음.
    if(req.body.type){//type(강아지, 고양이, 기타 반려동물)값이 있다면 찾은 후기와 분양 후기 이므로 type값 저장
      Community.create({
        ctype : req.body.ctype,
        type: req.body.type,
        title : req.body.title,
        contents : req.body.contents,
        writer: req.session.user.objId
      });
    }else{
      Community.create({//type이 없다면 소통/잡담이므로 type을 저장하지 않음.
        ctype : req.body.ctype,
        title : req.body.title,
        contents : req.body.contents,
        writer: req.session.user.objId
      });
    }
  }
  res.redirect('/community?ctype=' + req.body.ctype);//community페이지 이동과 주소값에 카테고리 값 전달
});

/*community 상세페이지*/
router.get('/detail',  function(req, res, next) {
  var session = false;
  if(req.session.user){ 
    session = req.session
  }
  Community.findOne({_id:req.query.communityId}).populate(['writer', 'comments.writer']).exec(function (err, result) {
    // 누른 리스트의 오브젝트 아이디값으로 검색. writer,comments.writer의 _id값이 같은 User의 정보를 json형태로 받아옴
    if(err) throw err;
    if(result){//결과 값이 있다면 그 값들을 POST에 담아서 community_detail.ejs페이지로 이동
      res.render('community/community_detail', {ctype:req.query.ctype, header: 'community', session: session, posts: result, moment: moment});
    }
  });
});

/*community 수정페이지*/
router.get('/update',  function(req, res, next) {
  if(req.session.user){ 
    Community.findOne({_id: req.query.communityId}, function(err, result){//오브젝트 아이디값으로 검색
      if(err) throw err;
      if(result){//세션이 있으면 community_write.ejs 이동 . 값 전달
        res.render('community/community_write', {ctype:req.query.ctype, header: 'community', session: req.session, posts: result});
      }
    });
  }else{//세션이 없으면 alert창 후 로그인 페이지 이동
    res.send('<script type="text/javascript">alert("수정권한이 없습니다."); location.href = "/users/login"</script>');
  }
});

/*community 수정처리*/
router.post('/update', upload.single('image'), function(req, res, next) {
  if(req.file){//이미지 파일을 수정했을 경우 값이 들어옴. 
    Community.update({_id: req.body.communityId},{image: "/images/"+req.file.filename, type : req.body.type, title : req.body.title, contents : req.body.contents },function (err, result) {
      if(err) throw err;
      if(result){//community 상세페이지 이동         
        res.redirect('/community/detail?communityId=' +  req.body.communityId +'&ctype=' + req.body.ctype);
      }
    });
  }else{//수정하지 않았다면 기존 이미지 사용
    Community.update({_id: req.body.communityId},{type : req.body.type, title : req.body.title, contents : req.body.contents },function (err, result) {
      if(err) throw err;
      if(result){//community 상세페이지 이동      
        res.redirect('/community/detail?communityId=' +  req.body.communityId +'&ctype=' + req.body.ctype);
      }
    });
  }
});

/*community 삭제처리*/
router.post('/delete', function (req, res, next) {
  Community.deleteOne({ _id: req.body.communityId}, function(err,result) {
    if(err) throw err;//community 페이지 이동 ctype의 값에 따라 카테고리 진입
      res.redirect('/community?ctype=' + req.body.ctype);   
  });
});
 
/*community 검색처리*/  
router.get('/search', function (req, res, next) {
  var session = false
  if(req.session.user){ 
    session = req.session
  }
  var page = req.query.page;
  if(page == null) {page =1;}
  var searchStr = req.query.searchStr;//검색창에 입력한 값
  var searchType = req.query.searchType;//검색 타입. 제목 또는 작성자
  var ctype = req.query.ctype;//커뮤니티 카테고리 찾은 후기, 분양후기, 소통 잡담
  var skipSize = (page-1)*5;//스킵할 리스트 수. 한페이지에 5개씩 리스트를 올린다면 페이지 수 1일경우 0 2일경우 5 3일경우 10까지 스킵
  var limitSize = 5;//최대 리스트 수 
  var pageNum = 1;//페이지 번호

  if(searchType == 1){//제목 검색
    Community.count({title:{$regex:searchStr}, ctype:ctype}, function(err, totalCount){//검색창에 입력한 값을 포함한 리스트 검색. 
      if(err) throw err;
      pageNum = Math.ceil(totalCount/limitSize);//페이지 번호
      Community.find({title:{$regex:searchStr}, ctype:ctype}).populate('writer').sort('-created_at').skip(skipSize).limit(limitSize).exec( function (err, result) {
        //searchStr의 문자열이 포함된 제목을 가진 디비값 추출. Writer에 적힌 User의 값을 제이슨 형태로 추출. 작성이 제일 나중에 된 것 먼저 나열.페이징 
        if(err) throw err;
        if(result){//community_list 페이지 이동 ctype의 값에 따라 카테고리 진입
          res.render('community/community_list',{ctype: ctype, header: 'community', page: page, searchType: searchType, searchStr: searchStr, session: session, posts: result, moment: moment, pagination: pageNum, skipSize: skipSize, totalCount: totalCount});
        }
      });
    });
  }else{//작성자 이름 검색. 익명 커뮤니티라 아이디가 아닌 이름으로 검색
    User.find({name:{$regex:searchStr}},function(err, UserList){
      Community.count({writer:{$in:UserList}, ctype:ctype}, function(err, totalCount){
        if(err) throw err;
        pageNum = Math.ceil(totalCount/limitSize);
        Community.find({writer:{$in:UserList}, ctype:ctype}).populate('writer').sort('-created_at').skip(skipSize).limit(limitSize).exec( function (err, result) {
          //searchStr의 문자열이 포함된 이름을 가진 디비값 추출. Writer에 적힌 User의 값을 제이슨 형태로 추출. 작성이 제일 나중에 된 것 먼저 나열.페이징 
          if(err) throw err;
          if(result){//community_list 페이지 이동 ctype의 값에 따라 카테고리 진입
            res.render('community/community_list',{ctype: ctype, header: 'community', page: page, searchType: searchType, searchStr: searchStr, session: session, posts: result, moment: moment, pagination: pageNum, skipSize: skipSize, totalCount: totalCount});
          }
        });
      });
    });
  }
});


/*댓글 기능*/

/*댓글 추가 기능*/
router.post('/comment/create', function(req, res, next) {
  var commentObj = {writer: req.session.user.objId, contents: req.body.contents};
  Community.update({_id: req.body.communityId},{$push:{comments:commentObj}}, function (err, result) {
    //해당 오브젝트아이디를 가진 게시글에 댓글값 추가
    res.redirect('/community/detail?communityId=' +  req.body.communityId);//들어간 community 상세페이지 이동
  });
});

/*댓글 수정 기능*/
router.post('/comment/update', function(req, res, next){
  Community.update({'_id': req.body.communityId, 'comments._id': req.body.commentId},{'$set':{'comments.$.contents': req.body.content}},function (err, result) {
  //해당 오브젝트아이디를 가진 게시글과 댓글의 내용부분 업로드
    if(err) throw err;
    if(result){
      Community.find({_id: req.body.communityId}).populate('comments.writer').exec(function(err, result){
        //해당 오브젝트아이디를 가진 댓글의 오브젝트아이디값 검색
        if(err) throw err;
        if(result){//해당 오브젝트가 있다면
          res.redirect('/community/detail?communityId=' +  req.body.communityId);//검색된 디비값을 가지고 community_detail 상세페이지 이동
        }
      });
    }
  });
});

/*댓글 삭제 기능*/
router.post('/comment/delete', function(req, res, next) {
  Community.update({_id: req.body.communityId}, {$pull:{comments: {"_id": req.body.commentId}}}, function(err,result) {
    //해당 오브젝트아이디를 가진 댓글의 오브젝트아이디값을 없앰.
    if(err) throw err;
    if(result){//해당 오브젝트가 있다면
      res.redirect('/community/detail?communityId=' +  req.body.communityId);//검색된 디비값을 가지고 community_detail 상세페이지 이동
    }
  });
});

module.exports = router;
