const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true, //valid number/decimal
      trim: true,
    },
    currencyId: {
      type: String,
      required: true, //INR
      trim: true,
    },
    currencyFormat: {
      type: String,
      required: true, //Rupee symbol
      trim: true,
    },
    isFreeShipping: {
      type: Boolean,
      default: false,
      trim: true,
    },
    productImage: {
      type: String,
      required: true,
      trim: true,
    }, // s3 link
    style: {type:String},

    availableSizes: {
      type: [String], //at least one size,
      required: true,
      enum: ["S", "XS", "M", "X", "L", "XXL", "XL"],
      trim: true,
    },
    installments: {type:Number},
    
    deletedAt: {
      type: Date, //when the document is deleted
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("product", productSchema);
