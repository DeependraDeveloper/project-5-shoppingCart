const express = require("express");
const router = express.Router();
const userController = require("../controllers/userContoller");

const mid=require('../middleware/auth')



//User API's

router.post("/register", userController.createUser);   //CreateUser
router.post("/login", userController.login);          //LoginUser
router.get("/user/:userId/profile",mid.auth, userController.getProfile);      //getProfile
router.put("/user/:userId/profile",mid.auth, userController.updateProfile);    //updateProfile

module.exports=router