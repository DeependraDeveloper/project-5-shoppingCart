const cartModel = require("../models/cartModel");
const ProductModel = require("../models/productModel");
const userModel = require("../models/Usermodel");
const validator = require("../validators/validator");

////01--createCart//////////////////////////////////////////////////////////////////////////////////

const createCart = async function (req, res) {
  try {
    
    let userId = req.params.userId;
    let items2;
    if (!validator.isValid(userId) && validator.isValidObjectId(userId)) 
      return res
        .status(400)
        .json({ status: false, message: "Please provide a valid userId" });
    

    if (req.userId != userId)
      return res
        .status(401)
        .json({ status: false, msg: "Authorised user to create cart" });

    let items = req.body.items;
    let userId2 = req.body.userId;
    const isCartExist = await cartModel.findOne({ userId: userId });
    /// res.send(isCartExist)
    let totalPrice = 0;
    if (!isCartExist) {
      for (let i = 0; i < items.length; i++) {
        let productId = items[i].productId;
        let quantity = items[i].quantity;
        let findProduct = await ProductModel.findById(productId);
        totalPrice = totalPrice + findProduct.price * quantity;
      }

      let createCart = await cartModel.create({
        userId: userId2,
        items: items,
        totalPrice: totalPrice,
        totalItems: items.length,
      });
      items2 = createCart.items;
      return res.status(200).json({ status: true, data: createCart });
    }
    if (isCartExist) {
      items2 = isCartExist.items;
    }
    let findProduct = await ProductModel.findById(items[0].productId);
    console.log(findProduct.price);
    // res.send(findProduct)
    let totalPrice2 = findProduct.price;
    let newquantity = items[0].quantity;
    let flage = 0;

    for (let i = 0; i < items2.length; i++) {
      let productId = items2[i].productId;
      if (productId == items[0].productId) {
        flage = 1;
        items2[i].quantity = items2[i].quantity + newquantity;
      }
    }
    totalPrice2 = totalPrice2 + isCartExist.totalPrice;
    if (flage == 0) {
      items2.push(items[0]);
    }
    let updateCart = await cartModel.findOneAndUpdate(
      { userId: userId2 },
      {
        $set: {
          items: items2,
          totalPrice: totalPrice2,
          totalItems: items2.length,
        },
      },
      { new: true }
    );
    return res.status(201).json({status:true,msg:"successfully created",data:updateCart});
  } catch (err) {
    return res.status(500).json({ status: false, msg: err.message });
  }
};


//02--updateCart////////////////////////////////////////////////////////////////////////////////////
const updateCart = async (req, res) => {
  try {
    //validation starts.
    if (!validator.isValidObjectId(req.params.userId))
      return res
        .status(400)
        .json({ status: false, message: "Invalid userId in body" });

    let findUser = await userModel.findOne({ _id: req.params.userId });
    if (!findUser)
      return res
        .status(400)
        .json({ status: false, message: "UserId does not exits" });

    //Authentication & authorization
    if (req.user.userId != req.params.userId)
      return res
        .status(401)
        .json({ status: false, msg: "Authorised user to create cart" });

    //Extract body
    const { cartId, productId, removeProduct } = req.body;
    if (!validator.isValidrequestBody(req.body))
      return res.status(400).json({
        status: false,
        message: "Invalid request parameters. Please provide cart details.",
      });

    //cart validation
    if (!validator.isValidObjectId(cartId)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid cartId in body" });
    }
    let findCart = await cartModel.findById({ _id: cartId });

    if (!findCart)
      return res
        .status(400)
        .json({ status: false, message: "cartId does not exists" });

    //product validation
    if (!validator.isValidObjectId(productId))
      return res
        .status(400)
        .json({ status: false, message: "Invalid productId in body" });

    let findProduct = await ProductModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!findProduct)
      return res
        .status(400)
        .json({ status: false, message: "productId does not exists" });

    //finding if products exits in cart
    let isProductinCart = await cartModel.findOne({
      items: { $elemMatch: { productId: productId } },
    });
    if (!isProductinCart)
      return res.status(400).json({
        status: false,
        message: `This ${productId} product does not exists in the cart`,
      });

    //removeProduct validation either 0 or 1.
    if (!!isNaN(Number(removeProduct)))
      return res.status(400).json({
        status: false,
        message: `removeProduct should be a valid number either 0 or 1`,
      });

    //removeProduct => 0 for product remove completely, 1 for decreasing its quantity.
    if (!(removeProduct === 0 || 1))
      return res.status(400).json({
        status: false,
        message:
          "removeProduct should be 0 (product is to be removed) or 1(quantity has to be decremented by 1) ",
      });

    let findQuantity = findCart.items.find(
      (x) => x.productId.toString() === productId
    );
    //console.log(findQuantity)

    if (removeProduct === 0) {
      let totalAmount =
        findCart.totalPrice - findProduct.price * findQuantity.quantity; // substract the amount of product*quantity

      await cartModel.findOneAndUpdate(
        { _id: cartId },
        { $pull: { items: { productId: productId } } },
        { new: true }
      );

      let quantity = findCart.totalItems - 1;
      let data = await cartModel.findOneAndUpdate(
        { _id: cartId },
        { $set: { totalPrice: totalAmount, totalItems: quantity } },
        { new: true }
      ); //update the cart with total items and totalprice

      return res.status(200).json({
        status: true,
        message: `${productId} is been removed`,
        data: data,
      });
    }

    // decrement quantity
    let totalAmount = findCart.totalPrice - findProduct.price;
    let itemsArr = findCart.items;

    for (i in itemsArr) {
      if (itemsArr[i].productId.toString() == productId) {
        itemsArr[i].quantity = itemsArr[i].quantity - 1;

        if (itemsArr[i].quantity < 1) {
          await cartModel.findOneAndUpdate(
            { _id: cartId },
            { $pull: { items: { productId: productId } } },
            { new: true }
          );
          let quantity = cart.totalItems - 1;

          let data = await cartModel.findOneAndUpdate(
            { _id: cartId },
            { $set: { totalPrice: totalAmount, totalItems: quantity } },
            { new: true }
          ); //update the cart with total items and totalprice

          return res.status(200).json({
            status: true,
            message: `No such quantity/product exist in cart`,
            data: data,
          });
        }
      }
    }
    let data = await cartModel.findOneAndUpdate(
      { _id: cartId },
      { items: itemsArr, totalPrice: totalAmount },
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: `${productId} quantity is been reduced By 1`,
      data: data,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

////03--get cart////////////////////////////////////////////////////////////////////////////////////////
const getCart = async (req, res) => {
  try {
    let userId = req.params.userId;

    if (!validator.isValidObjectId(userId))
      return res
        .status(400)
        .json({ status: false, msg: "invalid userId in params" });

    let user = await userModel.findOne({ _id: userId });
    if (!user)
      return res.status(400).json({ status: false, msg: "no user found" });

    if (req.user.userId != userId)
      return res
        .status(401)
        .json({ status: false, msg: "UnAuthorised  access to user cart" });

    let cart = await cartModel.findOne({ userId: userId });

    if (!cart)
      return res.status(400).json({ status: false, msg: "no cart found" });

    return res
      .status(200)
      .send({ status: true, message: "successfully found cart.", data: cart });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

//04--delete cart /////////////////////////////////////////////////////////////////////////////////////////////
const deleteCart = async (req, res) => {
  try {
    let userId = req.params.userId;

    if (!validator.isValidObjectId(userId))
      return res
        .status(400)
        .json({ status: false, msg: "invalid userId in params" });

    let user = await userModel.findOne({ _id: userId });
    if (!user)
      return res.status(400).json({ status: false, msg: "no user found" });

    if (req.user.userId != userId)
      return res
        .status(401)
        .json({ status: false, msg: "UnAuthorised  access to user cart" });

    const findCart = await cartModel.findOne({ userId: userId });
    if (!findCart) {
      return res.status(400).send({
        status: false,
        message: `${userId} has no cart`,
      });
    }
    let deleteChanges = await cartModel.findOneAndUpdate(
      { userId: userId },
      { $set: { items: [], totalPrice: 0, totalItems: 0 } },
      { new: true }
    );

    return res.status(200).send({
      status: true,
      message: "successfully deleted cart.",
      data: deleteChanges,
    });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
  createCart,
  updateCart,
  getCart,
  deleteCart,
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////
