const ProductModel = require("../models/productModel");
const validator = require("../validators/validator");
const aws = require("../validators/aws");
const currencySymbol = require("currency-symbol-map");

//1-Api-Create-a-product~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const CreateProduct = async (req, res) => {
  try {
    if (!validator.isValidrequestBody(req.body))
      return res.status(400).json({
        status: false,
        msg: "Invalid paremetrs ,please provide product details",
      });

    //extract params for request body.
    let {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      style,
      availableSizes,
      installments,
    } = req.body;

    if (!validator.isValid(title))
      return res
        .status(400)
        .json({ status: false, message: "title is required" });

    let findTitle = await ProductModel.findOne({ title });

    if (findTitle)
      return res
        .status(400)
        .json({ status: false, msg: "title already exists" });

    if (!validator.isValid(description))
      return res
        .status(400)
        .json({ status: false, message: "description is required" });

    if (!validator.isValid(price))
      return res
        .status(400)
        .json({ status: false, message: "Price is required" });

    if (!validator.isvalidInteger(price))
      return res
        .status(400)
        .json({ status: false, message: "Enter a valid price" });

    if (!validator.isValid(currencyId))
      return res
        .status(400)
        .json({ status: false, message: "currencyId is required" });

    if (currencyId !== "INR")
      return res
        .status(400)
        .json({ status: false, msg: "currencyId should be INR" });

    if (!validator.isValid(currencyFormat))
      return res
        .status(400)
        .json({ status: false, msg: "CurrencyFormat is required" });

    //used currency symbol package to store INR (rupees)symbol.
    currencyFormat = currencySymbol("INR");

    if (isFreeShipping !== "true" || "false")
      return res.status(400).json({
        status: false,
        msg: "isFreeShipping must be a boolean value",
      });

    if (!validator.validstring(style))
      return res
        .status(400)
        .json({ status: false, msg: "style is not valid and required" });

    if (availableSizes) {
      var sizesArray = availableSizes.split(",").map((x) => x.trim());

      for (let i = 0; i < sizesArray.length; i++) {
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))
          return res.status(400).json({
            status: false,
            message:
              "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']",
          });
      }
    }

    if (!validator.isValid(installments))
      return res
        .status(400)
        .json({ status: false, msg: "installments required" });

    let files = req.files;

    if (files && files.length > 0) {
      var uploadedFileURL = await aws.uploadFile(files[0]);
    } else {
      return res
        .status(400)
        .json({ status: false, msg: "Please upload a product image" });
    }

    let ProductData = {
      title: title,
      description: description,
      price: price,
      currencyId: currencyId,
      currencyFormat: currencyFormat,
      isFreeShipping: isFreeShipping,
      productImage: uploadedFileURL,
      style: style,
      availableSizes: [...new Set(sizesArray)],
      installments: installments,
    };

    let saveProduct = await ProductModel.create(ProductData);

    return res.status(201).json({
      status: true,
      message: "Product successfully created",
      data: saveProduct,
    });
  } catch (err) {
    res.status(500).json({ status: false, msg: err.message });
  }
};

//2-Api-GetProductsByQuery~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const GetProducts = async (req, res) => {
  try {
    let { size, name, priceSort, priceGreaterThan, priceLessThan } = req.query;

    let priceObj = {};

    if (priceGreaterThan) priceObj["$gt"] = priceGreaterThan;

    if (priceLessThan) priceObj["$lt"] = priceLessThan;

    if (priceLessThan || priceGreaterThan) {
      let priceSearch = await ProductModel.find({
        price: priceObj,
        isDeleted: false,
      }).sort({ price: priceSort });

      //console.log(priceSearch);
      if (priceSearch.length != 0) {
        return res.status(200).json({
          status: true,
          msg: "Successfully found",
          data: { priceSearch },
        });
      } else {
        return res
          .status(400)
          .json({ status: false, msg: "No matches in this price range found" });
      }
    }
    if (size) {
      let findSize = await ProductModel.find({
        availableSizes: size,
        isDeleted: false,
      }).sort({ price: priceSort });

      if (findSize.length != 0) {
        return res.status(200).json({
          status: true,
          msg: "Successfully found",
          data: { findSize },
        });
      } else {
        return res
          .status(400)
          .json({ status: false, msg: `No products of size ${Size} found` });
      }
    }
    if (name) {
      let findName = await ProductModel.find({
        title: { $regex: name, $options: "i" }, //regex:matching name charcter
        isDeleted: false, //$options(i) for case insensitive
      }).sort({ price: priceSort });
      // console.log(findName)
      if (findName.length != 0) {
        return res.status(200).json({
          status: true,
          msg: "Successfully found",
          data: { findName },
        });
      } else {
        return res
          .status(400)
          .json({ status: false, msg: `No product of name ${name} found` });
      }
    }
  } catch (err) {
    res.status(500).json({ status: false, msg: err.message });
  }
};

//3-Api-getProductById~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const getProductById = async (req, res) => {
  try {
    if (!validator.isValidObjectId(req.params.productId))
      return res.status(400).json({
        status: false,
        message: `${req.params.productId} is not a valid product id`,
      });

    const findProduct = await ProductModel.findOne({
      _id: req.params.productId,
      isDeleted: false,
    });
    if (!findProduct)
      return res
        .status(400)
        .json({ status: false, msg: `No product exists with that productId` });

    return res.status(200).json({ status: true, data: findProduct });
  } catch (err) {
    res.status(500).send({ status: false, msg: err.message });
  }
};

//4-Api-UpdateProductDetails~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const update = async (req, res) => {
  try {
    if (!validator.isValidrequestBody(req.body))
      return res.status(400).json({
        status: false,
        msg: "Invalid paremetrs ,please provide product details",
      });

    if (!validator.isValidObjectId(req.params.productId))
      return res.status(400).json({
        status: false,
        message: `${req.params.productId} is not a valid product id`,
      });

    const {
      title,
      description,
      price,
      isFreeShipping,
      style,
      availableSizes,
      installments,
      currencyId,
    } = req.body;

    const findProduct = await ProductModel.findOne({
      _id: req.params.productId,
      isDeleted: false,
    });

    if (!findProduct) {
      return res
        .status(404)
        .json({ status: false, msg: "product id does not exists" });
    }

    if (validator.isValid(title)) {
      const isTitleAlreadyUsed = await ProductModel.findOne({ title: title });

      if (isTitleAlreadyUsed)
        return res
          .status(400)
          .json({ status: false, message: `${title} title is already used` });
    }

    if (validator.isValid(price)) {
      if (!!isNaN(Number(price)))
        return res
          .status(400)
          .json({ status: false, message: `Price should be a valid number` });
    }

    if (validator.isValid(currencyId)) {
      if (!(currencyId == "INR"))
        return res
          .status(400)
          .json({ status: false, message: "currencyId should be a INR" });
    }

    if (validator.isValid(isFreeShipping)) {
      if (isFreeShipping !== "true" || "false")
        return res.status(400).json({
          status: false,
          msg: "isFreeShipping must be a boolean value",
        });
    }

    if (availableSizes) {
      var sizesArray = availableSizes.split(",").map((x) => x.trim());

      for (let i = 0; i < sizesArray.length; i++) {
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))
          return res.status(400).json({
            status: false,
            message:
              "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']",
          });
      }
    }

    if (validator.isValid(installments)) {
      if (!!isNaN(Number(installments)))
        return res.status(400).json({
          status: false,
          message: `installments should be a valid number`,
        });
    }

    let files = req.files;

    if (files && files.length > 0) {
      //upload to s3 and return true..incase of error in uploading this will goto catch block( as rejected promise)
      var uploadedFileURL = await uploadFile(files[0]); // expect this function to take file as input and give url of uploaded file as output
    }
    const ProductData = {
      title: title,
      description: description,
      price: price,
      currencyId: currencyId,
      currencyFormat: "₹",
      isFreeShipping: isFreeShipping,
      productImage: uploadedFileURL,
      style: style,
      availableSizes: [...new Set(availableSizes)],
      installments: installments,
    };
    let updateProduct = await ProductModel.findOneAndUpdate(
      { _id: req.params.productId },
      ProductData,
      { new: true }
    );
    res.status(200).json({
      status: true,
      msg: "Successfully updated",
      data: { updateProduct },
    });
  } catch (err) {
    res.status(500).json({ status: false, msg: err.message });
  }
};

//5-Api-DeleteProduct~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const productDel = async (req, res) => {
  try {
    if (!validator.isValidObjectId(req.params.productId))
      return res.status(400).json({
        status: false,
        message: `${req.params.productId} is not a valid product id`,
      });

    const product = await ProductModel.findOne({
      _id: req.params.productId,
      isDeleted: false,
    });

    if (!product)
      return res.status(400).json({
        status: false,
        message: `Product doesn't exists by ${req.params.productId}`,
      });

    if (product.isDeleted === false) {
      let deletedPrd = await ProductModel.findOneAndUpdate(
        { _id: req.params.productId },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true }
      );
      return res.status(200).json({
        status: true,
        message: `Product deleted successfully.`,
        data: deletedPrd,
      });
    }
    return res
      .status(400)
      .json({ status: true, message: `Product has been already deleted.` });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
  CreateProduct,
  GetProducts,
  getProductById,
  update,
  productDel,
};
///////////////////////////////////////////////////////////////////////////////////////////////////
