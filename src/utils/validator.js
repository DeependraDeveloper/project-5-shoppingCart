const mongoose=require('mongoose')

const isValid=val=>{
    if(typeof val===undefined || typeof val===null) return false
    if(typeof val==="string" && val.trim().length<0) return false
    return true
}

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0; // it checks, is there any key is available or not in request body
};

const isValidObjectId=objectId => mongoose.Types.ObjectId.isValid(objectId)

const isValidTitle=title=>['Mr','Mrs','Miss'].indexOf(title) !== -1
  



module.exports={isValid,isValidObjectId,isValidRequestBody,isValidTitle}



