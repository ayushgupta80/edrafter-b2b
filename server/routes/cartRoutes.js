const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

// Add to cart
router.post("/add", protect, async (req, res) => {
    const { productId, quantity, color } = req.body;
  
    if (!color) {
      return res.status(400).json({ message: "Color selection is required" });
    }
  
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
  
    let cart = await Cart.findOne({ user: req.user._id });
  
    if (cart) {
      // If cart exists, check if product with the selected color is already in the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.color === color
      );
  
      if (itemIndex > -1) {
        // Product with the selected color exists, update the quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new product with the selected color
        cart.items.push({ product: productId, quantity, color });
      }
    } else {
      // If no cart exists, create a new cart
      cart = new Cart({
        user: req.user._id,
        items: [{ product: productId, quantity, color }],
      });
    }
  
    await cart.save();
    res.status(200).json(cart);
  });
  


// Get cart items
router.get("/", protect, async (req, res) => {
  var cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  if (!cart) {
    cart = {
      user: req.user._id,
      items: [],
    };
  }

  res.status(200).json(cart);
  
});



// Update quantity in cart
router.post("/update", protect, async (req, res) => {
    const { productId, quantity, color } = req.body;
    console.log(req.body);
  
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
  
    const cart = await Cart.findOne({ user: req.user._id });
  
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
  
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.color === color
    );
  
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }
  
    // Update the quantity of the item
    cart.items[itemIndex].quantity = quantity;
  
    await cart.save();
    res.status(200).json(cart);
  });
  
  // Remove item from cart
  router.post("/remove", protect, async (req, res) => {
    const { productId, color } = req.body;
  
    const cart = await Cart.findOne({ user: req.user._id });
  
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
  
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.color === color
    );
  
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }
  
    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);
  
    await cart.save();
    res.status(200).json(cart);
  });





module.exports = router;
