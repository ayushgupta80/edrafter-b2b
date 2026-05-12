const mongoose = require("mongoose");



const orderSchema = new mongoose.Schema(
  {
    _idd: {
      type: Number,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    firstParty: { type: String, required: true },
    secondParty: { type: String, required: true },
    address: { type: String, required: true },
    purchasedBy: { type: String, required: true },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    dutyPaidBy: { type: String, required: true },

    purpose: { type: String, required: true },

    quantity: { type: Number, required: true },
    denomination: { type: Number, required: true },

    status: {type: String, default: "Pending"},

    totalAmount: { type: Number },

    acceptedAt: { type: Date }, 
    completedAt: { type: Date },

    invoice: { type: String, default: ""},

    stampsUploaded: [
      {
        id: { type: Number, required: true },
        file: { type: String, required: true },
      }
    ],


    csvStr: {type: String, default: null},



  },
  { timestamps: true }
);





const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
