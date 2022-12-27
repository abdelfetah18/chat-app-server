var { addData,getData } = require('../../database/index');
var bcrypt = require('bcrypt');

module.exports = async function ( req, res, next){
    var { username,password,first_name,last_name,birthdate,bio,profile_image,cover_image } = req.body;
    var username_res = await getData('*[_type == "users" && username == $username]',{ username });
    if(username_res.length > 0){
        res.status(200).json({
            status:'fail',
            message:'username already in use!'
        })
    }else{
        var salt = await bcrypt.genSalt();
        var hashed_password = await bcrypt.hash(password,salt);
        var user_doc = { _type:'users',username,password:hashed_password,first_name,last_name,birthdate,bio };
        try {
            var add_user = await addData(user_doc);
        } catch(err){
            console.log('add_user:',err);
            res.status(200).json({
                status:"fail",
                message:"something went wrong!",
            })
        } finally {
            res.status(200).json({
                status:"success",
                message:"user sign_up!",
                user:add_user
            });
        }
    }
}