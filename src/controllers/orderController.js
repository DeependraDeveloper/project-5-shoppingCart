const orderModel = require("../models/orderModel");
const userModel = require("../models/Usermodel");
const cartModel = require("../models/cartModel");
const validator = require("../validators/validator");

//01---createorder-----------------------------------------------------------------------------------------

const createOrder = async (req, res) => {
  try {
    //validation for request body
    if (!validator.isValidrequestBody(req.body))
      return res.status(400).json({
        status: false,
        message: "Invalid request paramaters. Please provide order details",
      });

    //Extract parameters
    const { cartId, cancellable, status } = req.body;

    //validating userId
    if (!validator.isValidObjectId(req.params.userId))
      return res
        .status(400)
        .json({ status: false, message: "Invalid userId " });

    const findUser = await userModel.findOne({ _id: req.params.userId });

    if (!findUser)
      return res.status(400).json({
        status: false,
        message: `user doesn't exists for ${req.params.userId}`,
      });

    //Authentication & authorization
    if (req.user.userId != req.params.userId)
      return res.status(401).json({
        status: false,
        message: `Unauthorized access! User's info doesn't match`,
      });

    if (!validator.isValidObjectId(cartId))
      return res.status(400).json({
        status: false,
        message: `Invalid cartId in request body.`,
      });

    //searching cart to match the cart by userId whose is to be ordered.
    const findCartDetails = await cartModel.findOne({
      _id: cartId,
      userId: req.params.userId,
    });

    if (!findCartDetails)
      return res.status(400).json({
        status: false,
        message: `Cart doesn't exits to ${req.params.userId}`,
      });

    //must be a boolean value.
    if (cancellable) {
      if (typeof cancellable !== "boolean") {
        return res.status(400).json({
          status: false,
          message: `Cancellable must be  'true' or 'false'.`,
        });
      }
    }

    // must be either - pending , completed or cancelled.
    if (status) {
      if (!validator.validstatus(status))
        return res.status(400).json({
          status: false,
          message: `Status must be among ['pending','completed','cancelled'].`,
        });
    }

    //verifying whether the cart is having any products or not.
    if (!findCartDetails.items.length)
      return res.status(202).json({
        status: false,
        message: `Order already placed for this cart. Please add some products in cart to make an order.`,
      });

    //adding quantity of every products

    let totalQuantity = findCartDetails.items
      .map((x) => x.quantity)
      .reduce((pv, cv) => pv + cv);

    //object destructuring for response body.
    const orderDetails = {
      userId: req.params.userId,
      items: findCartDetails.items,
      totalPrice: findCartDetails.totalPrice,
      totalItems: findCartDetails.totalItems,
      totalQuantity: totalQuantity,
      cancellable,
      status,
    };
    const savedOrder = await orderModel.create(orderDetails);

    //Empty the cart after the successfull order
    await cartModel.findOneAndUpdate(
      { _id: cartId, userId: req.params.userId },
      {
        $set: {
          items: [],
          totalPrice: 0,
          totalItems: 0,
        },
      }
    );
    return res
      .status(200)
      .json({ status: true, message: "Order placed.", data: savedOrder });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

//02---updateOrder------------------------------------------------------------------------------------------------

const updateOrder = async (req, res) => {
  try {
    const userId = req.params.userId;

    //validating request body.
    if (!validator.isValidrequestBody(req.body))
      return res.status(400).json({
        status: false,
        message: "Invalid parameters. Please provide order details",
      });

    //extract params
    const { orderId, status } = req.body;

    if (!validator.isValid(orderId) && !validator.isValid(status))
      return res
        .status(400)
        .json({ status: false, msg: "orderId or status is missing" });

    if (!validator.isValidObjectId(userId))
      return res
        .status(400)
        .json({ status: false, message: "Invalid userId " });

    const findUser = await userModel.findOne({ _id: userId });

    if (!findUser)
      return res.status(400).json({
        status: false,
        message: `user doesn't exists with ${userId}`,
      });

    //Authentication & authorization
    if (req.user.userId != userId)
      return res.status(401).send({
        status: false,
        message: `Unauthorized access! User's info doesn't match`,
      });

    const findOrder = await orderModel.findOne({ _id: orderId });

    if (!findOrder) {
      return res.status(400).send({
        status: false,
        message: ` ${orderId} does mot exists`,
      });
    }

    //verifying does the order belongs to user or not.
    let isOrderBelongsToUser = await orderModel.findOne({ userId: userId });
    if (!isOrderBelongsToUser)
      return res.status(400).json({
        status: false,
        message: `Order doesn't belongs to ${userId}`,
      });

    if (!status) {
      return res.status(400).send({
        status: true,
        message: " Please enter current status of the order.",
      });
    }
    if (!validator.validstatus(status)) {
      return res.status(400).send({
        status: true,
        message:
          "Invalid status in request body. Choose either 'pending','completed', or 'cancelled'.",
      });
    }

    //if cancellable is true then status can be updated to any of te choices.
    if (isOrderBelongsToUser["cancellable"] == true) {
      if (validator.validstatus(status)) {
        if (isOrderBelongsToUser["status"] == "pending") {
          const updateStatus = await orderModel.findOneAndUpdate(
            { _id: orderId },
            {
              $set: { status: status },
            },
            { new: true }
          );
          return res.status(200).json({
            status: true,
            message: `Successfully updated the order details.`,
            data: updateStatus,
          });
        }

        //if order is in completed status then nothing can be changed/updated.
        if (isOrderBelongsToUser["status"] == "completed") {
          return res.status(400).json({
            status: false,
            message: `Unable to update or change the status, because it's already in completed status.`,
          });
        }

        //if order is already in cancelled status then nothing can be changed/updated.
        if (isOrderBelongsToUser["status"] == "cancelled") {
          return res.status(400).json({
            status: false,
            message: `Unable to update or change the status, because it's already in cancelled status.`,
          });
        }
      }
    }
    //for cancellable : false
    if (isOrderBelongsToUser["status"] == "completed") {
      if (status) {
        return res.status(400).json({
          status: true,
          message: `Cannot update or change the status, because it's already in completed status.`,
        });
      }
    }

    if (isOrderBelongsToUser["status"] == "cancelled") {
      if (status) {
        return res.status(400).json({
          status: true,
          message: `Cannot update or change the status, because it's already in cancelled status.`,
        });
      }
    }

    if (isOrderBelongsToUser["status"] == "pending") {
      if (status) {
        if (["completed", "pending"].indexOf(status) === -1) {
          return res.status(400).json({
            status: false,
            message: `Unable to update status due to Non-cancellation policy.`,
          });
        }

        const updatedOrderDetails = await orderModel.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: status } },
          { new: true }
        );

        return res.status(200).json({
          status: true,
          message: `Successfully updated the order details.`,
          data: updatedOrderDetails,
        });
      }
    }
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = { createOrder, updateOrder };
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
