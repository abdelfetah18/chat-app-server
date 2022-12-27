const sanityClient = require('@sanity/client');
var { basename } = require('path');
var { createReadStream } = require('fs');

const client = sanityClient({
  projectId: 'ytxpcwtq',
  dataset: 'production',
  apiVersion: '2022-06-20',
  token: process.env.ACCESS_TOKEN,
  useCdn: false,
});

const query = '*[_type == "users" && username >= $username]'
const params = {username: 'abdelfetah'}

async function deleteData(query,params){
    return await client.delete({ query,params });
}

async function getData(query,params){
    return await client.fetch(query, params);
}

async function addData(doc){
    return await client.create(doc);
}

async function updateData(doc_id,new_doc){
    return await client.patch(doc_id).set(new_doc).commit();
}

async function uploadProfile(filePath,doc_id){
    try {
        var imageAsset = await client.assets.upload('image', createReadStream(filePath),{ filename: basename(filePath) });
    } catch(err) {
        console.log('db_error:',err)
    }
    var doc_info = await client.patch(doc_id).set({
        profile_image: {
          _type: 'image',
          asset: {
            _type: "reference",
            _ref: imageAsset._id
          }
        }
    }).commit()
    return { ...doc_info,profile_image:imageAsset }
}

async function uploadCover(filePath,doc_id){
    try {
        var imageAsset = await client.assets.upload('image', createReadStream(filePath),{ filename: basename(filePath) });
    } catch(err) {
        console.log('db_error:',err)
    }
    var doc_info = await client.patch(doc_id).set({
        cover_image: {
          _type: 'image',
          asset: {
            _type: "reference",
            _ref: imageAsset._id
          }
        }
    }).commit()
    return { ...doc_info,cover_image:imageAsset }
}


module.exports = {
    updateData,getData,addData,deleteData,uploadProfile,uploadCover
};