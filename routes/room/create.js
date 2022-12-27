var getData = require("../../database");

module.exports = async function(req,res){
    var { name,privacy,password,profile_image,cover_image,bio } = req.body;
    var result = await getData("select * from rooms where name='"+name+"';"); 
    if(result.length > 0){
        res.status(200).json({
            status:"fail",
            message:"name already in use!"
        });
    }else{
        await getData("insert into rooms (name,privacy,password,admin,creator,profile_image,cover_image,bio) values ('"+name+"','"+privacy+"','"+password+"',"+0+","+0+",'"+profile_image+"','"+cover_image+"','"+bio+"');");
        res.status(200).json({
            status:"success",
            message:"room created successufly!",
            data:{ ...req.body }
        });
    }
}