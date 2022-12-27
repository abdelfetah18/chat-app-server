const user = require('express').Router();
var { getData, updateData } = require('../../database')
var jwt = require('jsonwebtoken');
var fs = require('fs');
var privateKEY  = fs.readFileSync(__dirname+'/../../secret/private.key', 'utf8');

var multer = require('multer');
const upload_cover = require('./upload_cover');
const upload_profile = require('./upload_profile');
var upload_profile_image = multer({ dest:'./uploads/profile_images' });
var upload_cover_image = multer({ dest:'./uploads/cover_images' });

var friends = require('./friends');

user.use('/', async ( req, res, next) => {
    var token = req.headers['authorization'];
    if(!token){
        next({ status:405, message:"authentication is missed!"});
    }else{
        jwt.verify(token,privateKEY,{ algorithms:'RS256' },async ( err, data) => {
            if(err){
                next({ status:200, message:"something went wrong!", err });
            }else{
                req.user_info = data;
                next();
            }
        });
    }
});

user.use('/friends', friends);
user.post('/upload_profile',upload_profile_image.single('profile_image'),upload_profile);
user.post('/upload_cover',upload_cover_image.single('cover_image'),upload_cover);

user.get('/presence', async ( req, res, next) => {
    var user_info = req.user_info;
    try {
        var updateState = await updateData(user_info.user_id,{ last_activity_at: (new Date()).toISOString() });
        var data = await getData(`
        *[_type=="users" && (dateTime(_updatedAt) > dateTime(now()) - 60*4) && _id != $user_id && (_id in *[_type=="friends" && state == "accept" && (inviter_id._ref == $user_id)].user_id._ref ||  _id in *[_type=="friends" && state == "accept" && (user_id._ref == $user_id)].inviter_id._ref) ]{
            _id,
            username,
            first_name,
            last_name,
            "profile_image":profile_image.asset->url,
            "cover_image":cover_image.asset->url,
            bio,
            "friends":*[_type=="users" && _id != _id && (_id in *[_type=="friends" && state == "accept" && (inviter_id._ref == _id)].user_id._ref ||  _id in *[_type=="friends" && state == "accept" && (user_id._ref == _id)].inviter_id._ref) ]{_id,username,first_name,last_name,"profile_image":profile_image.asset->url,"cover_image":cover_image.asset->url,bio,},
        }`,{ user_id:user_info.user_id });
        res.status(200).json({ status:"success",data });
    } catch(err){
        next(err);
    }
});

user.get('/',async (req,res) => {
    var { username } = req.user_info;
    try {
        var result = await getData('*[_type == "users" && username == $username]{ _id,username,first_name,last_name,"profile_image":profile_image.asset->url,"cover_image":cover_image.asset->url,bio }',{ username });
        res.status(200).json({
            status:'success',
            message:'welcom!',
            user_info:result[0]
        })
    } catch (e) {
        res.status(200).json({
            status:'error',
            message:'query error!',
            error:e
        }) 
    }
});

user.get('/:username',async (req,res) => {
    var { username } = req.params;
    try {
        var result = await getData('*[_type == "users" && username == $username]{ _id,username,first_name,last_name,"profile_image":profile_image.asset->url,"cover_image":cover_image.asset->url,bio,"isOnline":(dateTime(_updatedAt) > dateTime(now()) - 60*4), }',{ username });
        res.status(200).json({
            status:'success',
            message:'user_info!',
            user_info:result[0]
        })
    } catch (e) {
        res.status(200).json({
            status:'error',
            message:'query error!',
            error:e
        }) 
    }
});

module.exports = user;