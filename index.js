const express = require('express') //引入express模块
const app = require('express')() //实例express
const http = require('http') //引入http模块
const server = http.createServer(app) //引入HTTP模块并启动服务
const PORT =3000
const io = require('socket.io')(server, {
  maxHttpBufferSize: 1e9
})
/**
 * @description 自动获取本地ip
 * @returns 
 */
function getIPAdress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}
/**
 * @description 服务器引用资源配置
 */
app.use('/', express.static(__dirname + '/asstes'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})
app.get('/chats', (req, res) => {
  res.sendFile(__dirname + '/public/chats.html')
})
app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/public/test.html')
})
// 保存每个房间的信息
let roomObj={}
//监听服务器
server.listen(PORT, getIPAdress(), () => {
  console.log('服务器已经启动。。。', `${server.address().address}:${server.address().port}`)
})
io.on('connection', socket => {
  roomObj[socket.handshake.query.roomId]?++roomObj[socket.handshake.query.roomId].number:roomObj[socket.handshake.query.roomId]={number:1}
  //加入一个房间Id
  socket.join(socket.handshake.query.roomId)
// 向同一个房间内所有在线广播
  io.to(socket.handshake.query.roomId).emit('SEND_ALL_USER', {
    type: 'USER_ENTER',
    userNum: roomObj[socket.handshake.query.roomId].number,
    msgObj: {
      name: socket.handshake.query.name
    }
  })
  socket.on('CLIENT_SEND', (data, fn) => {
    io.to(socket.handshake.query.roomId).emit('SEND_ALL_USER', {
      type: 'USER_MESSAGE',
      msgObj: {
        name: socket.handshake.query.name,
        userId: socket.id,
        content: data.content,
        time: data.time,
        type: data.type,
        imgType: data.imgType
      }
    })
    fn({code: 200}) //成功回调
  })
  //disconnect
  socket.on('disconnecting', (reason) => {
    socket.leave(socket.handshake.query.roomId)
   --roomObj[socket.handshake.query.roomId].number
    io.to(socket.handshake.query.roomId).emit('SEND_ALL_USER', {
      type: 'USER_LEAVA',
      userNum: roomObj[socket.handshake.query.roomId].number,
      msgObj: {
        name: socket.handshake.query.name
      }
    })
  })

})
































// -----------------------------------------------------------------------------------------

// const io = require('socket.io')(server, {
//   maxHttpBufferSize: 1e9
// })

// 命名空间
var testIo= io.of('/test')
var roomId=''
testIo.on('connection',socket=>{
  console.log('连接成功。。。')

  socket.on('senderEvent',data=>{
    const {type}=data
    switch(type){
      case 0:
        socket.emit('sendClient',data)
        break;
      case 1:
        socket.broadcast.emit('sendClient',data)
        break;
      case 2:
        testIo.emit('sendClient',data)
        break;
      case 4:
        socket.broadcast.to(roomId).emit('sendClient',data)
        break;
      case 5:
       testIo.to(roomId).emit('sendClient',data)
        break;

    }
  })
  // 监听进入房间
  socket.on('joinRoom',data=>{
    roomId=data.roomId
    socket.join(roomId)
  })
  // 离开房间
  socket.on('leaveRoom',data=>{
    socket.leave(roomId)
  })
  socket.on('disconnect',data=>{
    console.log('服务器断开。。。')
  })
})