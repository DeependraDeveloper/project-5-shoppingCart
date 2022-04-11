const userModel = require("../models/userModel");
const validator = require("../utils/validator");
const config = require("../utils/awsConfig");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

////////////////////////////////////////////////////////////////////////////////////////////////
const createUser = async (req, res) => {
  try {
    let files = req.files;
    let requestBody=req.body

    if (!validator.isValidRequestBody(req.body))
      return res.status(400).json({
        status: false,
        msg: "Invalid request parameters, please provide user details",
      });

    let { fname, lname, email, profileImage, phone, password, address } =
      requestBody;

    if (!validator.isValid(fname))
      return res.status(400).json({ status: false, msg: "fname is required" });

    if (!validator.isValid(lname))
      return res.status(400).json({ status: false, msg: "lname is required" });

    if (!validator.isValid(email))
      return res.status(400).json({ status: false, msg: "email is required" });

    let isEmailUsed = await userModel.findOne({ email });

    if (isEmailUsed)
      return res
        .status(400)
        .json({ status: false, msg: `${email} already exists` });

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
      return res
        .status(400)
        .json({ status: false, message: "Invalid Email id." });

    // if (!validator.isValid(files))
    //   return res
    //     .status(400)
    //     .json({ status: false, msg: "profileImg is required" });

    // if (files && files.length > 0) {
      profileImage = await config.uploadFile(files[0]);
    // } else {
    //   res
    //     .status(400)
    //     .send({ msg: "profile image file is not found ,please provide" });
    // }

    if (!validator.isValid(phone))
      return res.status(400).json({ status: false, msg: "phone is required" });

    let isPhoneUsed = await userModel.findOne({ phone });

    if (isPhoneUsed)
      return res
        .status(400)
        .json({ status: false, msg: `${phone} already exists` });

    if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone))
      return res.status(400).json({
        status: false,
        message: "Phone number must be a valid Indian number.",
      });

    if (!validator.isValid(password))
      return res
        .status(400)
        .json({ status: false, msg: "password is required" });

    if (password.length < 8 || password.length > 15)
      return res
        .status(400)
        .json({ status: false, msg: "password length be btw 8-15" });

    let hasedPassword = await bcrypt.hash(password, saltRounds);

    if (!validator.isValid(address))
      return res
        .status(400)
        .json({ status: false, msg: "address is required" });

    if (!validator.isValidRequestBody(req.body.address.shipping))
      return res
        .status(400)
        .json({ status: false, msg: "please provide shipping details" });

    if (address.shipping) {
      if (!validator.isValid(address.shipping.street))
        return res
          .status(400)
          .json({ status: false, msg: "please provide street details" });

      if (!validator.isValid(address.shipping.city))
        return res
          .status(400)
          .json({ status: false, msg: "please provide street details" });

      if (!validator.isValid(address.shipping.pincode))
        return res
          .status(400)
          .json({ status: false, msg: "please provide street details" });
    }

    if (!validator.isValidRequestBody(req.body.address.billing))
      return res
        .status(400)
        .json({ status: false, msg: "please provide billing details" });

    if (address.billing) {
      if (!validator.isValid(address.billing.street))
        return res
          .status(400)
          .json({ status: false, msg: "please provide street details" });

      if (!validator.isValid(address.billing.city))
        return res
          .status(400)
          .json({ status: false, msg: "please provide street details" });

      if (!validator.isValid(address.billing.pincode))
        return res
          .status(400)
          .json({ status: false, msg: "please provide street details" });
    }

    const udatedBody = {
      fname,
      lname,
      email,
      phone,
      password: hasedPassword,
      address,
      profileImage,
    };
    let user = await userModel.create(udatedBody);
    res
      .status(201)
      .send({ status: true, message: "User created successfully", data: user });
  } catch (err) {
    res.status(500).json({ status: false, msg: err.message });
  }
};



// const createUser = async (req, res) => {
//   try {
//     let files = req.files
//     let requestBody = req.body

//     if (!validator.isValidRequestBody(requestBody))
//       return res.status(400).json({status: true, msg: "Invalid request parameters ,please provide the user details",
//         });

//    let  { fname, lname, email, phone, password,address ,profileImage} = requestBody;

//     if (!validator.isValid(fname))
//      return res.status(400).json({ status: false, msg: "please provide the first name" });

//     if (!validator.isValid(lname))
//       return res.status(400).json({ status: false, msg: "please provide the last name" });

//     if (!validator.isValid(email))
//       return res.status(400).json({ status: false, msg: "please provide the email" });

//     let isEmailUsed = await userModel.findOne({ email });

//     if (isEmailUsed)
//       return res.status(400).json({ status: false, msg: `${email} is already exists` });

//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
//       return res.status(400).json({ status: false, msg: "please provide a valid email address" });
    
//        profileImage = await config.uploadFile(files[0])
//        console.log(profileImage)
     

//     if (!validator.isValid(phone))
//       return res.status(400).json({ status: false, msg: "please provide the  phone number" });

//     if (!/^[6789]\d{9}$/.test(phone))
//       return res.status(400).json({ status: true, msg: "please enter a valid 10 digit phone number",
//         });
        
//     let isPhoneUsed = await userModel.findOne({ phone });

//     if (isPhoneUsed)
//       return res.status(400).json({ status: false, msg: `${phone} is already exists` });

//     //The Phone Numbers will be of 10 digits, and it will start from 6,7,8 and 9 and remaing 9 digits

//     if (!validator.isValid(password))
//       return res.status(400).json({ status: false, msg: "please provide the password" });

//     if (!(password.length > 8 && password.length < 15 ))
//       return res.status(400).json({status: false, msg: "please ensure password length is 8-15??",
//         });
//          let saltRounds = 10;
//          let hashed = await bcrypt.hash(password,saltRounds)

// if (!validator.isValid(address))
// return res.status(400).json({ status: false, msg: "address is required" });

// if (!validator.isValidRequestBody(req.body.address.shipping))
// return res.status(400).json({ status: false, msg: "please provide shipping details" });

// if (address.shipping) {
// if (!validator.isValid(address.shipping.street))
//   return res.status(400).json({ status: false, msg: "please provide street details" });

// if (!validator.isValid(address.shipping.city))
//   return res.status(400).json({ status: false, msg: "please provide street details" });

// if (!validator.isValid(address.shipping.pincode))
//   return res.status(400).json({ status: false, msg: "please provide street details" });
// }

// if (!validator.isValidRequestBody(req.body.address.billing))
// return res.status(400).json({ status: false, msg: "please provide billing details" });

// if (address.billing) {
// if (!validator.isValid(address.billing.street))
//   return res.status(400).json({ status: false, msg: "please provide street details" });

// if (!validator.isValid(address.billing.city))
//   return res.status(400).json({ status: false, msg: "please provide street details" });

// if (!validator.isValid(address.billing.pincode))
//   return res.status(400).json({ status: false, msg: "please provide street details" });
// }

//         const updatedBody = { fname, lname, email,phone, password:hashed, address ,profileImage}
//         let user = await userModel.create(updatedBody)
//         res.status(201).send({ status: true, message: 'User created successfully', data: user })
//   } catch (err) {
//     res.status(500).json({ status: false, msg: err.message });
//   }
// };

////////////////////////////////////////////////////////////////////////////////////////////////

const login = async (req, res) => {
  try {
    if (!validator.isValidRequestBody(req.body))
      return res.status(400).json({
        status: false,
        msg: "invalid paramaters please provide email-password",
      });

    let { email, password } = req.body;

    if (!validator.isValid(email))
      return res.status(400).json({ status: false, msg: "email is required" });

    const findUser = await userModel.findOne({ email });

    if (!findUser) {
      return res
        .status(401)
        .send({ status: false, message: `Login failed! email is incorrect.` });
    }

    if (!validator.isValid(password))
      return res
        .status(400)
        .json({ status: false, msg: "password is required" });

    let encryptedPassword = findUser.password;

    const findUserr = await bcrypt.compare(password, encryptedPassword);

    if (!findUserr) {
      return res.status(401).send({
        status: false,
        message: `Login failed! password is incorrect.`,
      });
    }

    let userId = findUser._id;

    let token = await jwt.sign(
      {
        userId: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
      },
      "project-5"
    );

    res.status(200).json({
      status: true,
      msg: "loggedin successfully",
      data: { userId, token },
    });
  } catch (err) {
    res.status(500).json({ status: false, msg: err.message });
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////

const getProfile = async (req, res) => {
  try {
  } catch (error) {}
};
////////////////////////////////////////////////////////////////////////////////////////////////

const updateProfile = async (req, res) => {
  try {
  } catch (error) {}
};

////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = { createUser, login, getProfile, updateProfile };
