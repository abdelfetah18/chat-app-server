var room = require('express').Router();
var getData = require('../../database');

const room_create = require('./create');
const room_edit = require("./edit");

room.post("/create", room_create);
room.post("/edit", room_edit);

room.get('/:name',async ( req, res) => {
    var { name } = req.params;
    var rooms = await getData("select * from rooms where name='"+name+"';");
    if(rooms.length > 0){
        res.status(200).json({
            status:"success",
            data:rooms[0]
        });
    }else{
        res.status(200).json({
            status:"fail",
            message:"room no exist!"
        })
    }
});

room.get('/',async (req,res) => {
    var rooms = await getData("select * from rooms;");
    if(rooms.length > 0){
        res.status(200).json({
            status:"success",
            data:rooms
        });
    }else{
        res.status(200).json({
            status:"fail",
            message:"room no exist!"
        })
    }
});

module.exports = room;