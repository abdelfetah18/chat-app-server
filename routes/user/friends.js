const { getData,addData,updateData } = require('../../database');
const friends = require('express').Router();
var jwt = require('jsonwebtoken');
var fs = require('fs');

var privateKEY  = fs.readFileSync(__dirname+'/../../secret/private.key', 'utf8');
var publicKEY  = fs.readFileSync(__dirname+'/../../secret/public.key', 'utf8');

friends.get('/',async function (req,res,next){
    var { user_id,username } = req.user_info;
    getData(`
    *[_type=="users" && _id != $user_id && (_id in *[_type=="friends" && state == "accept" && (inviter_id._ref == $user_id)].user_id._ref ||  _id in *[_type=="friends" && state == "accept" && (user_id._ref == $user_id)].inviter_id._ref) ]{
        _id,
        username,
        first_name,
        last_name,
        "profile_image":profile_image.asset->url,
        "cover_image":cover_image.asset->url,
        bio,
        "friends":*[_type=="users" && _id != _id && (_id in *[_type=="friends" && state == "accept" && (inviter_id._ref == _id)].user_id._ref ||  _id in *[_type=="friends" && state == "accept" && (user_id._ref == _id)].inviter_id._ref) ]{_id,username,first_name,last_name,"profile_image":profile_image.asset->url,"cover_image":cover_image.asset->url,bio,}
    }`,{ user_id }).then((suggestions) => {
        res.status(200).json({
            status:'success',
            data:suggestions
        })
    }).catch((_err) => {
        res.status(200).json({
            status:'fail',
            err:_err
        });
    });
});

friends.get("/requests",async function (req,res,next){
    var { user_id,username } = req.user_info;
    getData(`
    *[_type=="users" && _id != $user_id && _id in *[_type=="friends" && state == "request" && (user_id._ref == $user_id)].inviter_id._ref ]{
        _id,
        username,
        first_name,
        last_name,
        "profile_image":profile_image.asset->url,
        "cover_image":cover_image.asset->url,
        bio,
        "doc_id":*[_type=="friends" && user_id._ref==$user_id && inviter_id._ref == ^._id][0]._id,
    }`,{ user_id }).then((f_requests) => {
        res.status(200).json({
            status:'success',
            data:f_requests
        });
    });
});

friends.get("/invite/:user_id",async function (req,res,next){
    var { user_id } = req.params;
    var { authorization } = req.headers;
    jwt.verify(authorization,privateKEY,{ algorithms:'RS256' },async (err,data) => {
        try {
            var is_exist = await getData('*[ _type=="friends" && (inviter_id._ref == $inviter_id && user_id._ref == $user_id) || (inviter_id._ref == $user_id && user_id._ref == $inviter_id) ]{"inviter": *[_type=="users" && @._id == ^.inviter_id._ref]{ _id,username,first_name,last_name,"profile_image":profile_image.asset->url,"cover_image":cover_image.asset->url,bio }[0],"user":*[_type=="users" && @._id == ^.user_id._ref]{ _id,username,first_name,last_name,"profile_image":profile_image.asset->url,"cover_image":cover_image.asset->url,bio }[0],state,updated_at,created_at}',{ inviter_id:data.user_id,user_id })
        } catch(err){
            res.send(err);
        } finally {
            if(is_exist.length == 0){
                var doc = {
                    _type:'friends',
                    inviter_id:{ _type:'reference', _ref:data.user_id },
                    user_id:{ _type:'reference', _ref:user_id },
                    state:'request'
                }
                addData(doc).then((friend_request) => {
                    res.status(200).json({
                        status:'success',
                        message:'request success!',
                        data:friend_request
                    })
                });
            }else{
                res.status(200).json({
                    status:'fail',
                    message:'already done!',
                    data:is_exist[0]
                });
            }
        }
    });
});

friends.get("/accept/:doc_id",async function (req,res,next){
    var { doc_id } = req.params;
    var { authorization } = req.headers;
    jwt.verify(authorization,privateKEY,{ algorithms:'RS256' },async (err,data) => {
        var { user_id } = data;
        getData('*[_type == "friends" && _id==$doc_id && inviter_id._ref == $user_id]{ state }',{ doc_id,user_id }).then(async (result) => {
            if(result.length == 0){
                try {
                    var accepted = await updateData(doc_id,{ state:"accept" });
                } catch(err){
                    res.status(200).json({ status:'fail',err });
                } finally {
                    res.status(200).json({
                        status:'success',
                        message:'user added to friends list!'
                    });
                }
            }else{
                res.status(200).json({
                    status:'failed!',
                    message:'you cant do that!'
                })
            }
        })
        
    });
});

friends.get("/reject/:doc_id",async function (req,res,next){
    var { doc_id } = req.params;
    var { authorization } = req.headers;
    jwt.verify(authorization,privateKEY,{ algorithms:'RS256' },async (err,data) => {
        var { user_id } = data;
        getData('*[_type == "friends" && _id==$doc_id && inviter_id._ref == $user_id]{ state }',{ doc_id,user_id }).then(async (result) => {
            if(result.length == 0){
                try {
                    var accepted = await updateData(doc_id,{ state:"reject" });
                } catch(err){
                    res.status(200).json({ status:'fail',err });
                } finally {
                    res.status(200).json({
                        status:'success',
                        message:'user added to friends list!'
                    });
                }
            }else{
                res.status(200).json({
                    status:'failed!',
                    message:'you cant do that!'
                })
            }
        })
        
    });
});


friends.get('/suggestions',async (req,res) => {
    var { user_id,username } = req.user_info;
    getData('*[_type=="users" && _id != $user_id && !(_id in *[_type=="friends" && inviter_id._ref==$user_id].user_id._ref) && !(_id in *[_type=="friends" && user_id._ref==$user_id].inviter_id._ref)]{_id,username,first_name,last_name,"profile_image":profile_image.asset->url,"cover_image":cover_image.asset->url,bio}',{ user_id }).then((suggestions) => {
        res.status(200).json({
            status:'success',
            data:suggestions
        })
    }).catch((_err) => {
        res.status(200).json({
            status:'fail',
            err:_err
        });
    });
});


module.exports = friends;