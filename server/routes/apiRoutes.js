const express = require("express");
const { apiAuth } = require("../middleware/authApiKey");
const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const router = express.Router();

const BASE_URL = "https://api.edrafterb2b.in/uploads/";


// GET /api/v1/me - Get account info
router.get("/me", apiAuth, async (req, res) => {
  const user = req.apiUser;
  res.json({
    name: user.name,
    email: user.email,
    balance: user.balance,
    company: user.company,
    phone: user.phone,
    gstin: user.gstin
  });
});

// POST /api/v1/orders - Create an order via API
router.post("/orders", apiAuth, async (req, res) => {
  const {
    firstParty,
    secondParty,
    address,
    purchasedBy,
    product_id,
    dutyPaidBy,
    purpose,
    quantity,
    denomination
  } = req.body;

  try {
    // Validate individual fields
    if (!firstParty) {
      return res.status(400).json({ message: "firstParty is required." });
    }
    if (!secondParty) {
      return res.status(400).json({ message: "secondParty is required." });
    }
    if (!address) {
      return res.status(400).json({ message: "address is required." });
    }
    if (!purchasedBy) {
      return res.status(400).json({ message: "purchasedBy is required." });
    }
    if (!product_id) {
      return res.status(400).json({ message: "product_id is required." });
    }
    if (!dutyPaidBy) {
      return res.status(400).json({ message: "dutyPaidBy is required." });
    }
    if (!purpose) {
      return res.status(400).json({ message: "purpose is required." });
    }
    if (quantity === undefined || quantity === null || isNaN(quantity)) {
      return res.status(400).json({ message: "quantity is required." });
    }
    if (denomination === undefined || denomination === null || isNaN(denomination)) {
      return res.status(400).json({ message: "denomination is required." });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({ message: "Invalid product_id format. Please use the endpoint /api/v1/products to get all valid products" });
    }


    // Check if the product exists
    const productExists = await Product.findById(product_id);
    if (!productExists) {
      return res.status(404).json({ message: "Product with product_id not found. Please use the endpoint /api/v1/products to get all valid products" });
    }


    // Calculate pricing
    const user = req.apiUser;
    const serviceChargeEntry = user.serviceCharges.find(
      (c) => c.product.toString() === product_id
    );

    const calculateShipping = (qty) => {
      if (qty >= 1 && qty <= 150) return 99;
      if (qty > 150 && qty <= 500) return 300;
      if (qty > 500 && qty <= 800) return 700;
      if (qty > 800 && qty <= 1200) return 1000;
      if (qty > 1200 && qty <= 5000) return 1500;
      if (qty > 5000 && qty <= 10000) return 2500;
      return 99;
    };

    const serviceChargeTotal = (serviceChargeEntry?.charges || 0) * quantity;
    const shipping = calculateShipping(quantity);
    const gst = (serviceChargeTotal + shipping) * 0.18;
    const orderTotal = quantity * denomination + serviceChargeTotal + gst + shipping;


    const lastOrder = await Order.findOne().sort({ createdAt: -1 }).exec();
    let _idd = 100000;
    if (lastOrder?._idd) {
      _idd = lastOrder._idd + 1;
    }

    const newOrder = await Order.create({
      _idd,
      user: user._id,
      firstParty,
      secondParty,
      address,
      purchasedBy,
      product: product_id,
      dutyPaidBy,
      purpose,
      quantity,
      denomination,
      totalAmount: orderTotal,
      csvStr: "",
      status: "Pending"
    });

    // Deduct balance
    user.balance -= orderTotal;
    user.orders.push(newOrder._id);
    await user.save();

    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
      totalAmount: orderTotal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating order" });
  }
});


// GET /api/v1/products - Get all serviceable products
router.get("/products", apiAuth, async (req, res) => {
  try {
    const products = await Product.find({ serviceable: true });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});


// GET /api/v1/orders - Get all orders for the API user
router.get("/orders", apiAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.apiUser._id })
      .sort({ createdAt: -1 })
      .select("-_id -__v -csvStr")
      .populate("product", "state serviceable -_id")
      .lean();

    // Append full file URLs
    const modifiedOrders = orders.map(order => ({
      ...order,
      stampsUploaded: order.stampsUploaded?.map(stamp => ({
        id: stamp.id,
        file: `${BASE_URL}${stamp.file}`
      }))
    }));

    res.json(modifiedOrders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});


// GET /api/v1/orders/:idd - Get order by custom ID (_idd)
router.get("/orders/:idd", apiAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      user: req.apiUser._id,
      _idd: req.params.idd,
    })
      .select("-_id -__v -csvStr")
      .populate("product", "state serviceable -_id")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Modify file URLs
    if (order.stampsUploaded) {
      order.stampsUploaded = order.stampsUploaded.map(stamp => ({
        id: stamp.id,
        file: `${BASE_URL}${stamp.file}`
      }));
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});




module.exports = router;
