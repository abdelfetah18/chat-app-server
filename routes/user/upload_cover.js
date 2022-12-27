const { uploadCover } = require('../../database');

module.exports = async function (req,res,next){
    var { file_type,doc_id } = req.body;
    var file_name =  req.file.filename +'.'+file_type;
    var file_path = __dirname+'/../../uploads/cover_images/'+req.file.filename;
    try {
        var asset = await uploadCover(file_path,doc_id)
        res.setHeader('Access-Control-Allow-Origin','*');
        res.status(200).json({
            ...asset
        })
    } catch(err){
        console.log('err:',err)
    }
}