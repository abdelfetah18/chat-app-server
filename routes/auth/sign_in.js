var { getData } = require('../../database/index');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var fs = require('fs');

var privateKEY  = fs.readFileSync(__dirname+'/../../secret/private.key', 'utf8');
var publicKEY  = fs.readFileSync(__dirname+'/../../secret/public.key', 'utf8');

module.exports = async function ( req, res, next){
    var { username,password } = req.body;
    console.log(req.body)
	var user_query = '*[_type == "users" && username == $username]';
	var result = await getData(user_query,{ username });
	console.log('result:',result);
	if(result.length > 0){
		var { _id:user_id,username,password:encrypted_pwd } = result[0];
		try {
			var is_true = await bcrypt.compare(password,encrypted_pwd);
		} catch (err) {
			res.status(200).json({
				status:'error',
				message:'hash error!',
				err
			});
		}
		if(is_true){
			var token = jwt.sign({
				user_id,username
			},privateKEY,{
				algorithm:"RS256",
				issuer:"http://127.0.0.1:3000/public/",
				expiresIn:1000*60*60,
			});
			res.status(200).json({
				status:"success",
				message:"user sign_in!",
				token,
				user_info:result[0]
			});
		}else{
			res.status(200).json({
				status:'error',
				message:'bad password!'
			})
		}
		
	}else{
		res.status(200).json({
			status:'error',
			message:'user not found!'
		})
	}
}