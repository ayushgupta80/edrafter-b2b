const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");
const Topup = require("../models/Topup");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { adminCheck } = require("../middleware/adminMiddleware");
const router = express.Router();
const { storage, uploadMulter } = require("../middleware/multer");
const multer = require('multer');


//For email sending
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Create a Nodemailer transporter using Amazon SES SMTP
const transporter = nodemailer.createTransport({
  host: "email-smtp.ap-south-1.amazonaws.com", 
  port: 465,  // Default SMTP port for Amazon SES
  secure: true,  // TLS (STARTTLS)
  auth: {
    user: process.env.AMAZON_SES_SMTP_USERNAME,  // Your SES SMTP Username
    pass: process.env.AMAZON_SES_SMTP_PASSWORD,  // Your SES SMTP Password
  },
});




router.post("/create-user", adminCheck, async (req, res) => {
    const { name, company, email, phone, address, gstin, userId, password, serviceCharges, api_enabled, api_key} = req.body;
  
    try {
      // Check if user already exists
      const userExists = await User.findOne({ email });
  
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }

      for (const charge of serviceCharges) {
        const product = await Product.findById(charge.product);
        if (!product) {
          return res.status(400).json({ message: `Product with ID ${charge.product} does not exist.` });
        }
      }
  
      // Prepare user payload
      const userPayload = {
        name,
        company,
        email,
        phone,
        address,
        gstin,
        userId,
        password,
        serviceCharges,
      };

      // Conditionally add API access
      if (api_enabled) {
        userPayload.api_enabled = true;
        userPayload.api_key = api_key;
      }

      // Create the user
      const user = await User.create(userPayload);
  
      if (user) {
        res.status(201).json({
          _id: user._id,
          name: user.name,
          company: user.company,
          email: user.email,
          serviceCharges: user.serviceCharges,
          api_enabled: user.api_enabled,
          api_key: user.api_key,
        });
      } else {
        res.status(400).json({ message: "Invalid user data" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });



  // Route to mark an order as accepted
router.put("/accept-order/:orderId", adminCheck, async (req, res) => {
    try {
      const orderId = req.params.orderId;
  
      // Find the order and update its status and acceptedAt date
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: "Processing", acceptedAt: new Date() },
        { new: true } 
      );
  
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const userObj = await User.findById(order.user._id);

      const mailOptions = {
        to: userObj.email,
        from: process.env.SENDER_EMAIL_ACCOUNTS,
        subject: `Order accepted | edrafterb2b.in`,
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color:rgb(0, 197, 197);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .order-details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: bold;
            width: 150px;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #2a6496;
            margin-top: 15px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            background-color:rgb(46, 241, 255);
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Order Has Been Accepted</h1>
    </div>
    <div class="content">
        <p>Dear ${userObj.name},</p>
        <p>Your order has been accepted and its now in processing stage.</p>
        
        <div class="order-details">
            <h3>Order Details</h3>
            <div class="detail-row">
                <div class="detail-label">Order ID:</div>
                <div>${order._idd}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="status">${order.status}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">First Party:</div>
                <div>${order.firstParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Second Party:</div>
                <div>${order.secondParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Product:</div>
                <div>${order.product.name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Quantity:</div>
                <div>${order.quantity}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Denomination:</div>
                <div>₹${order.denomination}</div>
            </div>

            <div class="total-amount">
                Total Amount: ₹${order.totalAmount.toFixed(2)}
            </div>
        </div>
        
        
        <div class="footer">
            <p>Best regards,<br>The eDrafterb2b.com Team</p>
            <p>This is an automated message.</p>
        </div>
    </div>
</body>
</html>`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({
        message: "Order marked as accepted",
        order,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error: " + error.message });
    }
  });
  
  // Route to mark an order as completed
  router.put("/complete-order/:orderId", adminCheck, async (req, res) => {
    try {
      const orderId = req.params.orderId;
  
      // Find the order and update its status and completedAt date
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: "Completed", completedAt: new Date() },
        { new: true } 
      );
  
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const userObj = await User.findById(order.user._id)

      const mailOptions = {
        to: userObj.email,
        from: process.env.SENDER_EMAIL_ACCOUNTS,
        subject: `Order completed | edrafterb2b.in`,
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color:rgb(94, 255, 129);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .order-details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: bold;
            width: 150px;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #2a6496;
            margin-top: 15px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            background-color:rgb(84, 255, 121);
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Order Has Been Completed</h1>
    </div>
    <div class="content">
        <p>Dear ${userObj.name},</p>
        <p>Your order has been marked as completed.</p>
        
        <div class="order-details">
            <h3>Order Details</h3>
            <div class="detail-row">
                <div class="detail-label">Order ID:</div>
                <div>${order._idd}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="status">${order.status}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">First Party:</div>
                <div>${order.firstParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Second Party:</div>
                <div>${order.secondParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Product:</div>
                <div>${order.product.name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Quantity:</div>
                <div>${order.quantity}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Denomination:</div>
                <div>₹${order.denomination}</div>
            </div>

            <div class="total-amount">
                Total Amount: ₹${order.totalAmount.toFixed(2)}
            </div>
        </div>
        
        
        <div class="footer">
            <p>Best regards,<br>The eDrafterb2b.com Team</p>
            <p>This is an automated message.</p>
        </div>
    </div>
</body>
</html>`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({
        message: "Order marked as completed",
        order,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error: " + error.message });
    }
  });



  // Route to mark an order as cancel
  router.put("/cancel-order/:orderId", adminCheck, async (req, res) => {
    try {
      const orderId = req.params.orderId;
  
      // Find the order and update its status and completedAt date
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: "Cancelled", completedAt: new Date() },
        { new: true } 
      );


      const userObj = await User.findById(order.user._id)
      const balanceBefore = userObj.balance;
      userObj.balance = userObj.balance + order.totalAmount;
      userObj.save();



      const balanceAfter = userObj.balance;
      const description = "Order Cancelled ID " + order._idd;

      // Create the transaction
      const transaction = await Transaction.create({
        user: userObj._id,
        type: "Credit",
        amount: order.totalAmount,
        balanceBefore,
        balanceAfter,
        description
      });



      const mailOptions = {
        to: userObj.email,
        from: process.env.SENDER_EMAIL_ACCOUNTS,
        subject: `Order has been cancelled | edrafterb2b.in`,
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #ff2d2d;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .order-details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: bold;
            width: 150px;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #2a6496;
            margin-top: 15px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            background-color:rgb(255, 83, 31);
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Order Has Been Cancelled</h1>
    </div>
    <div class="content">
        <p>Dear ${userObj.name},</p>
        <p>Order has been cancelled by the admin</p>
        
        <div class="order-details">
            <h3>Order Details</h3>
            <div class="detail-row">
                <div class="detail-label">Order ID:</div>
                <div>${order._idd}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="status">${order.status}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">First Party:</div>
                <div>${order.firstParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Second Party:</div>
                <div>${order.secondParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Product:</div>
                <div>${order.product.name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Quantity:</div>
                <div>${order.quantity}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Denomination:</div>
                <div>₹${order.denomination}</div>
            </div>

            <div class="total-amount">
                Total Amount: ₹${order.totalAmount.toFixed(2)}
            </div>
        </div>
        
        
        <div class="footer">
            <p>Best regards,<br>The eDrafterb2b.com Team</p>
            <p>This is an automated message.</p>
        </div>
    </div>
</body>
</html>`,
      };
  
      await transporter.sendMail(mailOptions);


  
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      res.status(200).json({
        message: "Order cancelled",
        order,
      });
    } catch (error) {
      throw error;
      res.status(500).json({ message: "Internal server error: " + error.message });
    }
  });




  // Add a new product
  router.post("/upload-invoice/:orderId", adminCheck, (req, res) => {
    uploadMulter(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err });
      }
  
      const orderId = req.params.orderId;
      console.log(req.files);
  
      try {
        // Check if the category exists
        const foundOrder = await Order.findById(orderId);
        if (!foundOrder) {
          return res.status(404).json({ message: "Order not found" });
        }
  
        // Get uploaded image filenames
        const imageFilenames = req.files.map((file) => file.filename);
  
        foundOrder.invoice = imageFilenames[0];
  
  
        // Save the product to the database
        const updatedOrder = await foundOrder.save();
        res.status(201).json(updatedOrder);
      } catch (error) {
        //res.status(500).json({ message: 'Error adding product', error });
        throw error;
      }
    });
  });
  



// Add a new product
router.post("/upload-files/:orderId", adminCheck, (req, res) => {
  uploadMulter(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    const orderId = req.params.orderId;

    try {
      // Check if the category exists
      const foundOrder = await Order.findById(orderId);
      if (!foundOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get uploaded image filenames
      const imageFilenames = req.files.map((file) => file.filename);

      var curHighestIndex = 0;
      foundOrder.stampsUploaded.forEach(element => {
        if(element.id > curHighestIndex){
          curHighestIndex = element.id
        }
      });


      imageFilenames.forEach(element => {
        curHighestIndex++;
        foundOrder.stampsUploaded.push({id : curHighestIndex, file: element})
      });



      // Save the product to the database
      const updatedOrder = await foundOrder.save();
      res.status(201).json(updatedOrder);
    } catch (error) {
      //res.status(500).json({ message: 'Error adding product', error });
      throw error;
    }
  });
});



router.get("/users", adminCheck, async (req, res) => {
  try {    
    // Check if the user is an admin
    const users = await User.find({isAdmin: false});

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});






// Route to update client details
router.put("/users/:id", adminCheck, async (req, res) => {
  const { name, company, email, phone, address, gstin, userId, balance, password, serviceCharges, api_enabled, api_key } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate service charges
    if (serviceCharges && serviceCharges.length > 0) {
      for (const charge of serviceCharges) {
        const product = await Product.findById(charge.product);
        if (!product) {
          return res
            .status(400)
            .json({ message: `Product with ID ${charge.product} does not exist.` });
        }
      }
    }

    // Update user details
    user.name = name || user.name;
    user.company = company || user.company;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.gstin = gstin || user.gstin;
    user.userId = userId || user.userId;
    user.balance = balance || user.balance;

    if (password) {
      user.password = password;
    }

    console.log(serviceCharges);
    // Update service charges if provided
    if (serviceCharges) {
      user.serviceCharges = serviceCharges;
    }

    // Handle API access
    if (typeof api_enabled === "boolean") {
      user.api_enabled = api_enabled;
      user.api_key = api_enabled ? api_key : null;
    }

    // Save updated user
    const updatedUser = await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});




// Create a new product
router.post("/products", adminCheck, async (req, res) => {
  const { state, serviceable } = req.body;

  try {
    const newProduct = await Product.create({ state, serviceable });
    res.status(201).json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Get all products
router.get("/products", adminCheck, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Get a product by ID
router.get("/products/:id", adminCheck, async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Update a product by ID
router.put("/products/:id", adminCheck, async (req, res) => {
  const { id } = req.params;
  const { state, serviceable } = req.body;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.state = state || product.state;
    product.serviceable = serviceable !== undefined ? serviceable : product.serviceable;

    const updatedProduct = await product.save();
    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});

// Delete a product by ID
router.delete("/products/:id", adminCheck, async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    await Product.deleteOne({ _id: id });

    //Cleanup
    // Step 1: Fetch all existing product IDs from the Product collection
    const existingProductIds = await Product.find({}, { _id: 1 });
    const existingProductIdSet = new Set(existingProductIds.map((p) => p._id.toString()));

    console.log(`Found ${existingProductIds.length} existing products.`);

    // Step 2: Fetch all users and clean up their serviceCharges
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    let totalRemoved = 0;

    for (const user of users) {
      // Filter out serviceCharges where the product no longer exists
      const validServiceCharges = user.serviceCharges.filter((charge) =>
        existingProductIdSet.has(charge.product.toString())
      );

      // If the serviceCharges array has changed, update the user
      if (validServiceCharges.length !== user.serviceCharges.length) {
        user.serviceCharges = validServiceCharges;
        await user.save();
        totalRemoved += user.serviceCharges.length - validServiceCharges.length;
        console.log(`Updated user ${user._id}: Removed ${user.serviceCharges.length - validServiceCharges.length} invalid service charges.`);
      }
    }

    console.log(`Total removed service charges across all users: ${totalRemoved}`);




    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});


// Function to determine shipping charge based on quantity
const calculateShipping = (qty) => {
  if (qty >= 1 && qty <= 150) return 99;
  if (qty > 150 && qty <= 500) return 300;
  if (qty > 500 && qty <= 800) return 700;
  if (qty > 800 && qty <= 1200) return 1000;
  if (qty > 1200 && qty <= 5000) return 1500;
  if (qty > 5000 && qty <= 10000) return 2500;
  return 99; 
};


router.post("/create-order", adminCheck, async (req, res) => {
  const {
    firstParty,
    secondParty,
    address,
    purchasedBy,
    product,
    dutyPaidBy,
    purpose,
    quantity,
    denomination,
    client
  } = req.body;

  try {
    // Validate input
    if (!firstParty || !secondParty || !address || !purchasedBy || !product || !dutyPaidBy || !purpose || !quantity || !denomination || !client) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the product exists
    const userObj = await User.findById(client);
    if (!userObj) {
      return res.status(400).json({ message: "The specified user does not exist." });
    }

    // Check if the product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(400).json({ message: "The specified product does not exist." });
    }

    // Calculate the stamp total
    let orderTotal = quantity * denomination;

    // Find service charges for the product and add to stamp total
    const user = await User.findById(userObj._id).populate('serviceCharges.product');
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find the service charge associated with the selected product
    const serviceChargeEntry = user.serviceCharges.find(
      (charge) => charge.product._id.toString() === product.toString()
    );

    
    const serviceChargeTotal = serviceChargeEntry.charges * quantity;
    console.log("serviceChargeTotal", serviceChargeTotal);
    orderTotal += serviceChargeTotal;
    const gst = (serviceChargeTotal + calculateShipping(quantity)) * 0.18;

    console.log("gst", gst);
    orderTotal += gst;

    console.log("shipping", calculateShipping(quantity));
    orderTotal += calculateShipping(quantity);

    if(userObj.balance < orderTotal){
      //return res.status(402).json({ message: "User account balance is insufficient." });
    }

    var defaultID = 100000;
    const lastOrder = await Order.findOne().sort({ createdAt: -1 }).exec();
    if(lastOrder){
      if(lastOrder._idd){
        defaultID = lastOrder._idd + 1;
      }
    }

    // Create a new order
    const order = new Order({
      _idd: defaultID,
      user: userObj._id,
      firstParty,
      secondParty,
      address,
      purchasedBy,
      product,
      dutyPaidBy,
      purpose,
      quantity,
      denomination,
      status: "Pending",
      totalAmount: orderTotal
    });

    await order.save();

    try{
      const mailOptions = {
        to: userObj.email,
        from: process.env.SENDER_EMAIL_ACCOUNTS,
        subject: "Order Created | edrafterb2b.in",
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4a6baf;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .order-details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: bold;
            width: 150px;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #2a6496;
            margin-top: 15px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            background-color: #ffeb3b;
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Order Has Been Created</h1>
    </div>
    <div class="content">
        <p>Dear ${userObj.name},</p>
        <p>Thank you for your order! We've received your request and it's currently being processed.</p>
        
        <div class="order-details">
            <h3>Order Details</h3>
            <div class="detail-row">
                <div class="detail-label">Order ID:</div>
                <div>${order._idd}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="status">${order.status}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">First Party:</div>
                <div>${order.firstParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Second Party:</div>
                <div>${order.secondParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Product:</div>
                <div>${productExists.name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Quantity:</div>
                <div>${order.quantity}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Denomination:</div>
                <div>₹${order.denomination}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Service Charge:</div>
                <div>₹${serviceChargeTotal}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">GST (18%):</div>
                <div>₹${gst.toFixed(2)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Shipping:</div>
                <div>₹${calculateShipping(order.quantity)}</div>
            </div>
            
            <div class="total-amount">
                Total Amount: ₹${orderTotal.toFixed(2)}
            </div>
        </div>
        
        
        <div class="footer">
            <p>Best regards,<br>The eDrafterb2b.com Team</p>
            <p>This is an automated message.</p>
        </div>
    </div>
</body>
</html>`,
      };
  
      await transporter.sendMail(mailOptions);



      const mailOptionsAdmin = {
        to: 'edrafterb2b@gmail.com',
        from: process.env.SENDER_EMAIL_ACCOUNTS,
        subject: `${userObj.name} placed an Order | edrafterb2b.in`,
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4a6baf;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .order-details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        .detail-label {
            font-weight: bold;
            width: 150px;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #2a6496;
            margin-top: 15px;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            background-color: #ffeb3b;
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Order Has Been Created</h1>
    </div>
    <div class="content">
        <p>Dear Admin,</p>
        <p>${userObj.name} placed an Order</p>
        
        <div class="order-details">
            <h3>Order Details</h3>
            <div class="detail-row">
                <div class="detail-label">Order ID:</div>
                <div>${order._idd}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="status">${order.status}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">First Party:</div>
                <div>${order.firstParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Second Party:</div>
                <div>${order.secondParty}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Product:</div>
                <div>${productExists.name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Quantity:</div>
                <div>${order.quantity}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Denomination:</div>
                <div>₹${order.denomination}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Service Charge:</div>
                <div>₹${serviceChargeTotal}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">GST (18%):</div>
                <div>₹${gst.toFixed(2)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Shipping:</div>
                <div>₹${calculateShipping(order.quantity)}</div>
            </div>
            
            <div class="total-amount">
                Total Amount: ₹${orderTotal.toFixed(2)}
            </div>
        </div>
        
        
        <div class="footer">
            <p>Best regards,<br>The eDrafterb2b.com Team</p>
            <p>This is an automated message.</p>
        </div>
    </div>
</body>
</html>`,
      };
  
      await transporter.sendMail(mailOptionsAdmin);

    }
    catch (error) {

    }


    const balanceBefore = user.balance;
    const balanceAfter = userObj.balance - orderTotal;
    const type = "Debit";
    const description = "Purchased Stamps Order ID " + order._idd;

    // Create the transaction
    const transaction = await Transaction.create({
      user: userObj._id,
      type: type,
      amount: orderTotal,
      balanceBefore,
      balanceAfter,
      description,
    });
    

    userObj.balance = balanceAfter;
    userObj.orders.push(order);
    userObj.save()

    res.status(201).json({
      message: "Order created successfully",
      order,
      totalAmount: orderTotal // Include the calculated total amount in the response
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});



// Top up
router.post("/topup", adminCheck, async (req, res) => {
  const { client, quantity } = req.body;

  if(quantity < 0){
    return res.status(400).json({ message: "Amount cannot be less then 0" });
  }

  // Check if the product exists
  const user = await User.findById(client);
  if (!user) {
    return res.status(400).json({ message: "The specified user does not exist." });
  }

  try {

    const balanceBefore = user.balance;
    user.balance = user.balance + quantity;
    await user.save();
    const balanceAfter = user.balance;
    const type = "Credit";
    const description = "Top up by Admin";

    // Create the transaction
    await Transaction.create({
      user: user._id,
      type: type,
      amount: quantity,
      balanceBefore,
      balanceAfter,
      description,
    });


    // Check if the user is an admin
    const users = await User.find({isAdmin: false});
    res.status(200).json(users);


  } catch (error) {
    throw error;
    res.status(500).json({ message: error.message });
  }

});




// Deduct
router.post("/deduct", adminCheck, async (req, res) => {
  const { client, quantity, reason } = req.body;

  if(quantity < 0){
    return res.status(400).json({ message: "Amount cannot be less then 0" });
  }

  // Check if the product exists
  const user = await User.findById(client);
  if (!user) {
    return res.status(400).json({ message: "The specified user does not exist." });
  }

  try {

    const balanceBefore = user.balance;
    user.balance = user.balance - quantity;
    await user.save();
    const balanceAfter = user.balance;
    const type = "Debit";
    const description = reason;

    // Create the transaction
    await Transaction.create({
      user: user._id,
      type: type,
      amount: quantity,
      balanceBefore,
      balanceAfter,
      description,
    });


    // Check if the user is an admin
    const users = await User.find({isAdmin: false});
    res.status(200).json(users);


  } catch (error) {
    throw error;
    res.status(500).json({ message: error.message });
  }

});







// Get all topup requests
router.get("/topup-requests", adminCheck, async (req, res) => {
  try {
    const topups = await Topup.find().sort({ createdAt: -1 }).populate("user", "name email company balance");
    res.status(200).json(topups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Analytics endpoint
router.get("/analytics", adminCheck, async (req, res) => {
  try {
    // 1. Monthly order data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyData = monthlyOrders.map((entry) => ({
      month: monthNames[entry._id.month - 1],
      orders: entry.orders,
      revenue: Math.round(entry.revenue * 100) / 100,
    }));

    // 2. Order status breakdown
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const ordersByStatus = {};
    statusBreakdown.forEach((entry) => {
      ordersByStatus[entry._id] = entry.count;
    });

    // 3. Top 5 clients by total order amount
    const topClientsAgg = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$totalAmount" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          name: "$userInfo.name",
          company: "$userInfo.company",
          totalSpent: { $round: ["$totalSpent", 2] },
        },
      },
    ]);

    // 4. Recent activity — last 10 transactions
    const recentActivity = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name");

    const recentActivityData = recentActivity.map((txn) => ({
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      userName: txn.user ? txn.user.name : "Unknown",
      date: txn.createdAt,
    }));

    res.status(200).json({
      monthlyData,
      ordersByStatus,
      topClients: topClientsAgg,
      recentActivity: recentActivityData,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});


// Approve a topup request
router.post("/approve-topup/:id", adminCheck, async (req, res) => {
  try {
    const topup = await Topup.findById(req.params.id);
    if (!topup) return res.status(404).json({ message: "Top-up request not found" });
    if (topup.status === "Approved") return res.status(400).json({ message: "Already approved" });

    const user = await User.findById(topup.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    const balanceBefore = user.balance;
    user.balance += topup.amount;
    await user.save();

    await Transaction.create({
      user: user._id,
      type: "Credit",
      amount: topup.amount,
      balanceBefore,
      balanceAfter: user.balance,
      description: "Top-up approved by admin",
    });

    topup.status = "Approved";
    await topup.save();

    res.status(200).json({ message: "Top-up approved", topup });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
