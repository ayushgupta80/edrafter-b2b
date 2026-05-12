const express = require("express");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Create a new product
router.post("/", protect, async (req, res) => {
  const { state, serviceable } = req.body;

  try {
    // Validate input
    if (!state || typeof serviceable !== 'boolean') {
      return res.status(400).json({ message: "State and serviceable status are required" });
    }

    // Create and save the new product
    const product = new Product({ state, serviceable });
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Get all products
router.get("/", protect, async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Get a single product by ID
router.get("/get/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Update a product by ID
router.put("/update/:id", protect, async (req, res) => {
  const { state, serviceable } = req.body;

  try {
    // Validate input
    if (state === undefined && serviceable === undefined) {
      return res.status(400).json({ message: "At least one field (state or serviceable) must be provided" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product fields if provided
    if (state !== undefined) product.state = state;
    if (serviceable !== undefined) product.serviceable = serviceable;

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Delete a product by ID
router.delete("/delete/:id", protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

module.exports = router;
