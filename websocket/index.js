const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ port: 4000 },() => {
    console.log('WebSocket running on port 4000 !');
});

var { getData } = require('../database');
var CLIENTS = new Map();
var ROOMS = new Map();
getData('*[_type == "rooms"]').then((rooms) => {
    rooms.forEach((room,index) => {
        ROOMS.set(room.room_name,[]);
    });
});

wss.on('connection',(socket,request) => {
    socket.broadcast = function (eventName,payload){
        socket.send(JSON.stringify({ eventName, payload }));
    }
    socket.on('message',(data,isBinary) => {
        var { eventName,payload } = JSON.parse(data.toString());
        socket.emit(eventName,payload);
    });

    socket.on('user_info',({ user_id,username }) => {
        socket.user_info = { user_id,username };
        CLIENTS.set(user_id,socket);
    });

    socket.on('open',() => console.log('new user connected!'));
    socket.on('close',() => console.log('user left!'));
    socket.on('error',() => console.log('user went wrong!'));

    socket.on('msg',(data) => {
        var user = CLIENTS.get(data.user_id);
        if(user != undefined){
            user.broadcast('msg',data);
        }
    });

    socket.on('room-msg',(data) => {
        var room = ROOMS.get(data.room_name);
        if(room != undefined){
            room.broadcast('room-msg',data);
        }
    });
    
});

module.exports = wss;