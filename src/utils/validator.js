const mongoose=require("mongoose")
// const { isValid } = require("shortid")
 



let isValid=function(value){
    if(typeof value==="undefined" || typeof value===null) return false
    if(typeof value==="string" && value.trim().length===0) return false
    return true
}

let isValidrequestBody = function (requestBody) {
    return Object.keys(requestBody).length !== 0
}
let isValidObjectId=function(objectId){
    return mongoose.Types.ObjectId.isValid(objectId)
}

const validstring=function(value){
    if(typeof value==="string" && value.trim().length===0) return false
    return true
}



const validstatus=function(status){
    return["pending","completed","cancelled"].indexOf(status)!==-1
}
const isvalidInteger=function isInteger(value){
    return value % 1==0
}



const validInstallment = value=> {
    if (value < 0) return false
    if (value % 1 == 0) return true;
  }

module.exports={
     isValid,
    isvalidInteger,
    validstatus,
    validstring,
    isValidObjectId,
     isValidrequestBody,
     validInstallment

}
