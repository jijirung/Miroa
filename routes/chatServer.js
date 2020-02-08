var express = require('express');
var router = express.Router();
var app = require('express')();
var server = require('http').createServer(app);
var path = require('path');
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/chat', function(req, res) {
  res.sendFile(path.resolve(__dirname, '..') +'/views/chatRoom2.html');
  //res.render('chatRoom'); __dirname +
});
app.get('/test', function(req, res) {
  res.redirect('/chat?name='+req.query.name+'&userid='+req.query.id);
});


app.get('/', function(req, res) {
  res.sendFile(path.resolve(__dirname, '..') +'/views/chatRoom2.html');
});

var usernames = {};

var rooms = ['room1','room2','room3'];
// connection event handler
// connection이 수립되면 event handler function의 인자로 socket인 들어온다
io.on('connection', function(socket) {

/*  socket.on('login',function(data){

  })*/

  // 접속한 클라이언트의 정보가 수신되면
  socket.on('login', function(data) {
    console.log('Client logged-in:\n name:' + data.name + '\n userid: ' + data.userid+'\n room:'+data.room);
    // socket에 클라이언트 정보를 저장한다
    socket.name = data.name;
    socket.userid = data.userid;
    socket.room = data.room;
    usernames[data.name] = data.room;
    var keys = Object.keys(usernames);
    console.log(keys[0]);
    socket.join(data.room);
    var nowUser =new Array();
    var num =0;

    for(let i in keys){ //현재 접속중인 유저명 저장
      if(data.room==usernames[keys[i]]){
        nowUser[num]=keys[i];
        num++;
      }
    }

  //  socket.broadcast.to('room1').emit('chat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, data.room);
    // 접속된 모든 클라이언트에게 메시지를 전송한다
    io.sockets.in(socket.room).emit('login', data.name );
    io.sockets.in(socket.room).emit('updateUser', nowUser );
  });

  // 클라이언트로부터의 메시지가 수신되면
  socket.on('chat', function(data) {
    console.log('Message from %s: %s', socket.name, data.msg);

    var msg = {
      from: {
        name: socket.name,
        userid: socket.userid
      },
      msg: data.msg
    };

    // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
    //socket.broadcast.emit('chat', msg);

    // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
    // socket.emit('s2c chat', msg);

    // 접속된 모든 클라이언트에게 메시지를 전송한다
     io.sockets.in(socket.room).emit('chat', msg);

    // 특정 클라이언트에게만 메시지를 전송한다
    // io.to(id).emit('s2c chat', data);
  });


  socket.on('switchRoom', function(newroom){
  		socket.leave(socket.room);
  		socket.join(newroom);
  		socket.emit('roomChat', 'you have connected to '+ newroom);
  		// sent message to OLD room
  		socket.broadcast.to(socket.room).emit('roomChat', socket.name+' has left this room');
  		// update socket session room title
  		socket.room = newroom;
  		socket.broadcast.to(newroom).emit('roomChat', socket.name+' has joined this room');
  		socket.emit('updaterooms', rooms, newroom);
  	});


  // force client disconnect from server
  socket.on('forceDisconnect', function() {
    socket.disconnect();
  })

  socket.on('disconnect', function() {
    delete usernames[socket.name];
    console.log('user disconnected: ' + socket.name);
    socket.leave(socket.room);

  var keys = Object.keys(usernames);
    var nowUser =new Array();
    var num =0;

    for(let i in keys){ //현재 접속중인 유저명 저장
      if(socket.room==usernames[keys[i]]){
        nowUser[num]=keys[i];
        num++;
      }
    }
    io.sockets.in(socket.room).emit('disconnect', socket.name );
      io.sockets.in(socket.room).emit('updateUser', nowUser );
  });
});

server.listen(3001, function() {
  console.log('Socket IO server listening on port 3001');
});


module.exports = router;
