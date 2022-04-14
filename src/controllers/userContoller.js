const userModel = require("../models/Usermodel");
const jwt = require("jsonwebtoken");
const validator = require("../validators/validator");
const aws = require("../validators/aws");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//1-Api-registerNewUser~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const registerUser = async (req, res) => {
  try {
    //checking requestBody
    if (!validator.isValidrequestBody(req.body))
      return res.status(400).json({
        status: false,
        msg: "Invalid request parameters, please provide user details",
      });

    //extracting property through destructuring from req.body object
    let { fname, lname, email, profileImage, phone, password, address } =
      req.body;

    //validations begins
    if (!validator.isValid(fname))
      return res.status(400).json({ status: false, msg: "fname is required" });

    if (!validator.isValid(lname))
      return res.status(400).json({ status: false, msg: "lname is required" });

    if (!validator.isValid(email))
      return res.status(400).json({ status: false, msg: "email is required" });

    //inique email validation
    let isEmailUsed = await userModel.findOne({ email });

    if (isEmailUsed)
      return res
        .status(400)
        .json({ status: false, msg: `${email} already exists` });

    //regex pattern for valid email address
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
      return res
        .status(400)
        .json({ status: false, message: "Invalid Email id." });

    //validating req.files in body
    if (!validator.isValidrequestBody(req.files))
      return res
        .status(400)
        .json({ status: false, msg: "profileImg is required" });

    if (req.files && req.files.length > 0)
      profileImage = await aws.uploadFile(req.files[0]);

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

    //hassing password using bycrpt
    let hasedPassword = await bcrypt.hash(password, saltRounds);

    if (!validator.isValid(address))
      return res
        .status(400)
        .send({ status: false, msg: "Address is mandatory" });

    //validation address object
    if (!validator.isValid(address.shipping))
      return res.status(400).send({
        status: false,
        msg: "Shipping address is missing mandatory fields",
      });

    if (
      !validator.isValid(
        address.shipping.street &&
          address.shipping.city &&
          address.shipping.pincode
      )
    )
      return res.status(400).send({
        status: false,
        msg: "Some shipping address details are missing???",
      });

    if (!validator.isValid(address.billing))
      return res.status(400).send({
        status: false,
        msg: "Billing address is missing mandatory fields",
      });

    if (
      !validator.isValid(
        address.billing.street &&
          address.billing.city &&
          address.billing.pincode
      )
    )
      return res.status(400).send({
        status: false,
        msg: "Some billing address details are missing???",
      });

    const newUser = {
      fname,
      lname,
      email,
      phone,
      password: hasedPassword,
      address,
      profileImage,
    };
    let user = await userModel.create(newUser);
    res
      .status(201)
      .send({ status: true, message: "User created successfully", data: user });
  } catch (err) {
    res.status(500).json({ status: false, msg: err.message });
  }
};

//2-Api-logging-User~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`

const login = async (req, res) => {
  try {
    if (!validator.isValidrequestBody(req.body))
      return res.status(400).json({
        status: false,
        message: "Invalid parameters ,please provide email and password",
      });
    //extractiong property values from reqBody
    let { email, password } = req.body;

    if (!validator.isValid(email))
      return res.status(400).json({
        status: false,
        message: "email is required",
      });

    //validationg a valid email using regex
    if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))
      return res.status(400).json({
        status: false,
        message: `Email should be a valid email address`,
      });

    if (!validator.isValid(password))
      return res
        .status(400)
        .json({ status: false, message: "password is required" });

    // Password length validation
    if (password.length < 8 || password.length > 15)
      return res
        .status(400)
        .json({ status: false, msg: "password length be btw 8-15" });

    if (email && password) {
      let User = await userModel.findOne({ email: email });
      if (!User)
        return res
          .status(400)
          .json({ status: false, msg: "email does not exist" });

      let decryppasss = await bcrypt.compare(password, User.password);

      if (decryppasss) {
        const Token = jwt.sign(
          {
            userId: User._id,

            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 30 * 60,
            //exp date 30*60=30min
          },
          "Dp2022"
        );

        res.status(200).json({
          status: true,
          msg: "successfully loggedin",
          data: { userId: User._id, token: Token },
        });
      } else
        return res.status(400).json({ status: false, Msg: "Invalid password" });
    }
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

//Get-userProfile~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`

const getUser = async function (req, res) {
  try {
    if (req.user.userId != req.params.userId) {
      return res
        .status(401)
        .json({ status: false, msg: "UnAuthorized access to user" });
    }
    let userId = req.params.userId;

    let findUserId = await userModel.findOne({ _id: userId });

    if (findUserId) {
      return res
        .status(200)
        .json({ status: true, msg: "User Profile details", data: findUserId });
    }
  } catch (err) {
    return res.status(500).json({ status: false, msg: err.message });
  }
};

//4-Api-update(User)~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const updateUser = async (req, res) => {
  try {
    let files = req.files;

    if (!validator.isValidObjectId(req.params.userId))
      return res
        .status(400)
        .json({ status: false, message: `${userId} is invalid` });

    const userFound = await userModel.findOne({ _id: req.params.userId });

    if (!userFound)
      return res
        .status(404)
        .json({ status: false, message: `User do not exists` });

    //Authorisation
    if (req.params.userId.toString() !== req.user.userId)
      return res.status(401).json({
        status: false,
        message: `UnAuthorized access to user`,
      });

    if (!validator.isValidrequestBody(req.body))
      return res
        .status(400)
        .json({ status: false, message: "Please provide details to update" });

    // destructuring the body
    let { fname, lname, email, phone, password, address } = req.body;

    let updateUserData = {};

    if (!validator.validstring(fname))
      return res.status(400).json({ status: false, message: "fname Required" });

    if (fname) {
      if (validator.isValid(fname)) updateUserData["fname"] = fname;
    }

    if (!validator.validstring(lname))
      return res.status(400).json({ status: false, message: "lname Required" });

    if (lname) {
      if (validator.isValid(lname)) updateUserData["lname"] = lname;
    }

    if (!validator.validstring(email))
      return res.status(400).json({
        status: false,
        message: "Invalid request parameters. email required",
      });

    if (email) {
      if (validator.isValid(email)) {
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email.trim()))
          return res.status(400).json({
            status: false,
            message: `Email should be a valid email address`,
          });
      }
    }
    const duplicateEmail = await userModel.findOne({ email });

    if (duplicateEmail)
      return res
        .status(400)
        .json({ status: false, message: "email already exists" });

    updateUserData["email"] = email;

    if (phone) {
      if (validator.isValid(phone)) {
        if (
          !/^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/.test(
            phone.trim()
          )
        )
          return res.status(400).json({
            status: false,
            message: `Please provide valid phone number`,
          });
      }
    }
    const duplicatePhone = await userModel.findOne({ phone });

    if (duplicatePhone)
      return res
        .status(400)
        .json({ status: false, message: "phone already exists" });

    updateUserData["phone"] = phone;

    if (password) {
      if (validator.isValid(password)) {
        const encryptPass = await bcrypt.hash(password, 10);
        updateUserData["password"] = encryptPass;
      }
    }
    if (address) {
      if (address.shipping) {
        if (address.shipping.street) {
          if (!validator.isValid(address.shipping.street)) {
            return res.status(400).json({
              status: false,
              message: "Please provide street to update",
            });
          }
          updateUserData["address.shipping.street"] = address.shipping.street;
        }
        if (address.shipping.city) {
          if (!validator.isValid(address.shipping.city)) {
            return res.status(400).json({
              status: false,
              message: "Please provide city name to update",
            });
          }
          updateUserData["address.shipping.city"] = address.shipping.city;
        }
        if (address.shipping.pincode) {
          if (!validator.isValid(address.shipping.pincode)) {
            res.status(400).json({
              status: false,
              message: "Please provide pincode to update",
            });
          } //else if(!validator.isvalidInteger(address.billing.pincode))
          //    res.status(400).json({
          //     status: false,
          //     message: "Please provide valid interger pincode"
          // })

          updateUserData["address.shipping.pincode"] = address.shipping.pincode;
        }
      }

      if (address.billing) {
        if (address.billing.street) {
          if (!validator.isValid(address.billing.street)) {
            return res.status(400).json({
              status: false,
              message: "Please provide street to update",
            });
          }
          updateUserData["address.billing.street"] = address.billing.street;
        }
        if (address.billing.city) {
          if (!validator.isValid(address.billing.city)) {
            return res.status(400).json({
              status: false,
              message: "Please provide city to update",
            });
          }
          updateUserData["address.billing.city"] = address.billing.city;
        }
        if (address.billing.pincode) {
          if (!validator.isValid(address.billing.pincode)) {
            res.status(400).json({
              status: false,
              message: "Please provide pincode to update",
            });
          }
          //   else if(!validator.isvalidInteger(address.billing.pincode)){
          //      res.status(400).json({
          //       status: false,
          //       message: "Please provide valid interger pincode"
          //   })
          // }
          updateUserData["address.billing.pincode"] = address.billing.pincode;
        }
      }
      // let files = req.files;
      if (files && files.length > 0) {
        let uploadedFileURL = await aws.uploadFile(files[0]);

        if (uploadedFileURL) {
          updateUserData["profileImage"] = uploadedFileURL;
        }
      }
      const updatedUserData = await userModel.findOneAndUpdate(
        { _id: req.params.userId },
        updateUserData,
        { new: true }
      );

      return res.status(201).json({ status: true, data: updatedUserData });
    }
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = { registerUser, login, getUser, updateUser };
///////////////////////////////////////////////////////////////////////////////////////////////////////
