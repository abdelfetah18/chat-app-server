const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var routes = require('./routes');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var privateKEY  = fs.readFileSync(__dirname+'/secret/private.key', 'utf8');

/*
const https = require("https");
var fs = require("fs");
var server = https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
},app);
*/


const http = require("http");
var server = http.createServer(app);

const WebSocketServer = require('ws');
const wss = new WebSocketServer.Server({ server },() => {
    console.log('WebSocket running!');
});

var { getData, deleteData, addData } = require('./database');
var CLIENTS = new Map();
var ROOMS = new Map();

getData('*[_type == "rooms"]').then((rooms) => {
    rooms.forEach((room,index) => {
        ROOMS.set(room.room_name,[]);
    });
});

wss.on('connection',(socket,request) => {
    socket.access_token = request.url.substring(1,request.url.length);
    jwt.verify(socket.access_token,privateKEY,{ algorithms:'RS256' },async ( err, data) => {
        if(err){
            console.log({ status:200, message:"something went wrong!", err });
            socket.close(socket.CLOSING,"not authenticated!");
        }else{
            socket.user_info = data;
            CLIENTS.set(socket.user_info.username,socket);
            getData('*[_type=="pending_requests" && user->username==$username]',{ username:socket.user_info.username }).then((result) => {
                if(result.length > 0){
                    console.log('you have some pending requests!');
                    for(var i=0;i<result.length;i++){
                        socket.broadcast(result[i].eventName,JSON.parse(result[i].payload));
                    }
                    deleteData('*[_type=="pending_requests" && user->username==$username]',{ username }).then((result) => {
                        console.log('done with pending requests!');
                    }).catch((err) => {
                        console.log('err:',err);
                    });
                }
            }).catch((err) => {
                console.log('err:',err);
            });
        }
    });
    
    socket.broadcast = function (eventName,payload){
        socket.send(JSON.stringify({ eventName, payload }));
    }

    socket.on('message',(data,isBinary) => {
        var { eventName,payload } = JSON.parse(data.toString());
        console.log('eventName:',eventName);
        console.log('payload:',payload);
        socket.emit(eventName,payload);
    });

    socket.on('open',() => {
        console.log('new user connected!')
    });
    socket.on('close',() => {
        CLIENTS.delete(socket.user_info.username);
        console.log('user left!');
    });
    socket.on('error',() => console.log('user went wrong!'));

    socket.on('msg',(payload) => {
        console.log('msg:',payload);
        var user = CLIENTS.get(payload.username);
        if(user != undefined){
            user.broadcast('msg',payload);
        }else{
            getData('*[_type=="users" && username==$username]',{ username:payload.username }).then((result) => {
                if(result.length > 0){
                    addData({ _type:"pending_requests",user:{ _ref:result[0]._id },eventName:"msg",payload:JSON.stringify(payload) }).then((result) => {
                        console.log('message added to pending requests!');
                    }).catch((err) => {
                        console.log("err:",err);
                    });
                }
            }).catch((err) => {
                console.log("err:",err);
            });
        }
    });

    socket.on('room-msg',(payload) => {
        var room = ROOMS.get(payload.room_name);
        if(room != undefined){
            room.broadcast('room-msg',payload);
        }else{
            getData('*[_type=="users" && username==$username]',{ username:payload.username }).then((result) => {
                if(result.length > 0){
                    addData({ _type:"pending_requests",user:{ _ref:result[0]._id },eventName:"room-msg",payload:JSON.stringify(payload) }).then((result) => {
                        console.log('message added to pending requests!');
                    }).catch((err) => {
                        console.log("err:",err);
                    });
                }
            }).catch((err) => {
                console.log("err:",err);
            });
        }
    });
});

module.exports = wss;

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/', routes);
app.use((error,req,res,next)=>{
    res.status(error.status || 500);
    res.json({
        status:"error",
        error:{
            message: error.message
        }
    });
    console.log(error);
});

server.listen(PORT,() => console.log('Server running on',PORT,'!'));