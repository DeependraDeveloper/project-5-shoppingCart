const mongoose=require('mongoose')

const isValid=val=>{
    if(typeof val===undefined || typeof val===null) return false
    if(typeof val==="string" && val.trim().length<0) return false
    return true
}

const isValidRequestBody = requestBody=> {
    return Object.keys(requestBody).length > 0; // it checks, is there any key is available or not in request body
};

const isValidObjectId=objectId => mongoose.Types.ObjectId.isValid(objectId)

const validString = value=> {
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
}

module.exports={isValid,isValidObjectId,isValidRequestBody,validString}



