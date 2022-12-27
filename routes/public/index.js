const public = require('express').Router();
var fs = require('fs');
var publicKEY  = fs.readFileSync(__dirname+'/../../secret/public.key', 'utf8');

public.get('/',(req,res) => {
    res.status(200).json({
        PublicKey:Buffer.from(publicKEY).toString('base64')
    })
});

module.exports = public;