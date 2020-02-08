var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var communityRouter = require('./routes/community');
var miroapetRouter = require('./routes/miroapet');
var leafletRouter = require('./routes/leaflet');
var chatServerRouter = require('./routes/chatServer');
var introRouter = require('./routes/intro');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
var bodyparser=require('body-parser');
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}));

app.use(session({
  secret : 'my key',//세션을 암호화 해줌
  resave : true,//세션을 항상저장할지 여부
  saveUninitialized : true//초기화되지 않은채 스토어에 저장되는 세션
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/community',communityRouter);
app.use('/miroapet', miroapetRouter);
app.use('/leaflet', leafletRouter);
app.use('/chatServer',chatServerRouter);
app.use('/intro',introRouter);

//시간형식
var moment = require('moment');
app.get('/user.html', function(req, res){
    dbConnect.collection("users").find().toArray(function(err, docsData) {
        res.render('user', {
            data: docsData,
            title: "EJS example",
            header: "Some users",
            moment: moment
        });
    });
}); 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
