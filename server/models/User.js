const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    gstin: {
      type: String,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0.00
    },
    password: {
      type: String,
      required: true,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
      },
    ],

    api_enabled:{
      type: Boolean,
      default: false
    },

    api_key: {
      type: String,
      required: false,
      default: null,
    },

    serviceCharges: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        charges: { type: Number, required: true },
        shipping: { type: Number, required: true },
      }
    ],

    isAdmin: { 
      type: Boolean, 
      default: false 
    },
    resetCode: { type: String, }, 
    resetCodeExpiry: { type: Date, },
  },
  { timestamps: true }
);

// Password hashing before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
