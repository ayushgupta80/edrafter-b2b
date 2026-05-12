const mongoose = require("mongoose");


const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Transaction = require("../models/Transaction");
const Topup = require("../models/Topup");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const { storage, uploadMulter } = require("../middleware/multer");
const multer = require('multer');
const archiver = require("archiver");
const path = require("path");
const fs = require("fs");
const upload = multer({ storage });



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


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

router.post("/register", async (req, res) => {
  const { name, company, email, phone, userId, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      company,
      email,
      phone,
      userId,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


async function getProfile(_id) {
  const user = await User.findById(_id)
  .select("-password")
  .populate("serviceCharges.product")
  .populate({
    path: "orders",
    options: { sort: { createdAt: -1 }, limit: 5 }
  });


  if (!user) {
    return null;
  }

  // Count the total number of orders for the user
  const totalOrders = await Order.countDocuments({ user: _id });

  // Count the number of completed orders for the user
  const completedOrders = await Order.countDocuments({ user: _id, status: "Completed" });

  const userTickets = await Ticket.countDocuments({ user: _id });

  const pendingTopUps = await Topup.find({ user: _id, status: "Pending" });


  // Initialize response object
  let response = {
    user,
    pendingTopUps,
    stats: {
      totalOrders,
      completedOrders,
      userTickets
    }
  };

  // If the user is an admin, add admin-specific statistics
  if (user.isAdmin) {
    const totalSales = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalClients = await User.countDocuments({isAdmin: false});

    const totalOrdersCount = await Order.countDocuments();
    const totalCompletedOrders = await Order.countDocuments({ status: "Completed" });
    const totalTickets = await Ticket.countDocuments();

    // Add admin stats to response
    response.adminStats = {
      totalSales: totalSales.length > 0 ? totalSales[0].totalSales : 0,
      totalClients,
      totalOrders: totalOrdersCount,
      completedOrders: totalCompletedOrders,
      totalTickets: totalTickets
    };
  }
  

  return response;
}



router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    var user = await User.findOne({ email });

    if(!user){
      user = await User.findOne({ userId: email });
    }

   
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
        profile: await getProfile(user._id)
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
   

  } catch (error) {
    throw error;
    res.status(500).json({ message: error.message });
  }
});


router.put("/change-password", protect, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user && (await bcrypt.compare(oldPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      res.json({ message: "Password updated successfully" });
    } else {
      res.status(400).json({ message: "Old password is incorrect" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, company, phone, address, gstin } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (company) user.company = company;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (gstin !== undefined) user.gstin = gstin;

    await user.save();
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("serviceCharges.product")
      .populate({
        path: "orders",
        options: { sort: { createdAt: -1 }, limit: 5 }
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Count the total number of orders for the user
    const totalOrders = await Order.countDocuments({ user: req.user._id });

    // Count the number of completed orders for the user
    const completedOrders = await Order.countDocuments({ user: req.user._id, status: "Completed" });

    const userTickets = await Ticket.countDocuments({ user: req.user._id });

    const products = await Product.find();

    const pendingTopUps = await Topup.find({ user: req.user._id, status: "Pending" });



    // Initialize response object
    let response = {
      user,
      pendingTopUps,
      products,
      stats: {
        totalOrders,
        completedOrders,
        userTickets
      }
    };

    // If the user is an admin, add admin-specific statistics
    if (user.isAdmin) {
      const totalSales = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" }
          }
        }
      ]);

      const totalClients = await User.countDocuments({isAdmin: false});

      const totalOrdersCount = await Order.countDocuments();
      const totalCompletedOrders = await Order.countDocuments({ status: "Completed" });
      const totalTickets = await Ticket.countDocuments();

      var users = [];
      if(req.query.clients){
        users = await User.find({isAdmin: false}).populate("serviceCharges.product");
      }

      // Add admin stats to response
      response.adminStats = {
        totalSales: totalSales.length > 0 ? totalSales[0].totalSales : 0,
        totalClients,
        totalOrders: totalOrdersCount,
        completedOrders: totalCompletedOrders,
        totalTickets: totalTickets
      };

      response.clients = users;
    }

    res.json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
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




router.post("/create-order", protect, async (req, res) => {
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
    csvStr
  } = req.body;

  try {
    // Validate input
    if (!firstParty || !secondParty || !address || !purchasedBy || !product || !dutyPaidBy || !purpose || !quantity || !denomination) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(400).json({ message: "The specified product does not exist." });
    }

    console.log("productExists", productExists);

    // Calculate the stamp total
    let orderTotal = quantity * denomination;

    // Find service charges for the product and add to stamp total
    const user = await User.findById(req.user._id).populate('serviceCharges.product');
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

    if(req.user.balance < orderTotal){
      // return res.status(402).json({ message: "Your account balance is insufficient." });
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
      user: req.user._id,
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
      totalAmount: orderTotal,
      csvStr: csvStr
    });

    await order.save();


    try{
      const mailOptions = {
        to: user.email,
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
        <p>Dear ${user.name},</p>
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
                <div class="detail-label">Address:</div>
                <div>${order.address}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Purchased By:</div>
                <div>${order.purchasedBy}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">State:</div>
                <div>${productExists.state}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Stamp Duty paid by:</div>
                <div>${order.dutyPaidBy}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Purpose/Article:</div>
                <div>${order.purpose}</div>
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
        subject: `${user.name} placed an Order | edrafterb2b.in`,
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
        <p>${user.name} placed an Order</p>
        
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
                <div class="detail-label">Address:</div>
                <div>${order.address}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Purchased By:</div>
                <div>${order.purchasedBy}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">State:</div>
                <div>${productExists.state}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Stamp Duty paid by:</div>
                <div>${order.dutyPaidBy}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Purpose/Article:</div>
                <div>${order.purpose}</div>
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
    const balanceAfter = req.user.balance - orderTotal;
    const type = "Debit";
    const description = "Purchased Stamps Order ID " + order._idd;

    // Create the transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      type: type,
      amount: orderTotal,
      balanceBefore,
      balanceAfter,
      description,
    });
    

    req.user.balance = balanceAfter;
    req.user.orders.push(order);
    req.user.save()

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





router.get("/orders", protect, async (req, res) => {
  try {
    let orders;
    
    // Check if the user is an admin
    const user = await User.findById(req.user._id);

    if(user.isAdmin){
      orders = await Order.find().populate("product").sort({ createdAt: -1 }).populate("user", "name email");;
    }
    else{
      orders = await Order.find({ user: req.user._id }).populate("product").sort({ createdAt: -1 });
    }

    res.status(200).json(orders);
  } catch (error) {
    throw error;
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});


router.get("/orders/:orderId", protect, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    let order = await Order.findById(orderId).populate("product");
    res.status(200).json(order);
    
  } catch (error) {
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});






/* CRUD Operations for Tickets */

// Create a new ticket
router.post("/tickets", protect, async (req, res) => {
  const { title, description, priority } = req.body;

  try {
    const ticket = await Ticket.create({
      title,
      description,
      priority,
      status: "Open",
      user: req.user._id,  // Associate the ticket with the authenticated user
      replies: []
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get all tickets (with user details populated)
router.get("/tickets", protect, async (req, res) => {
  try {

    if(req.user.isAdmin){
      const tickets = await Ticket.find().populate("user", "name email");
      res.json(tickets);
    }
    else{
      const tickets = await Ticket.find({ user: req.user._id }).populate("user", "name email");
      res.json(tickets);
    }

    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single ticket by ID (with user details populated)
router.get("/tickets/:id", protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("user", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Update a ticket by ID
router.put("/tickets/:id", protect, async (req, res) => {
  const { title, description, priority, status } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not have permission to update this ticket" });
    }

    ticket.title = title || ticket.title;
    ticket.description = description || ticket.description;
    ticket.priority = priority || ticket.priority;
    ticket.status = status || ticket.status;

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Delete a ticket by ID
router.delete("/tickets/:id", protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not have permission to delete this ticket" });
    }

    await ticket.remove();
    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.post('/tickets/:id/reply', protect, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Reply message is required' });
  }

  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const reply = {
      message,
      repliedBy: req.user.name || req.user.email,
      createdAt: new Date(),
    };

    ticket.replies.push(reply);
    await ticket.save();

    res.status(201).json({ message: 'Reply added successfully', ticket });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



//Close ticket
router.post('/tickets/:id/close', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = "Closed";
    await ticket.save();

    res.status(201).json({ message: 'Ticket closed successfully', ticket });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


//Close ticket
router.post('/tickets/:id/open', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = "Open";
    await ticket.save();

    res.status(201).json({ message: 'Ticket Opened successfully', ticket });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




/***************************************************  
 * CRUD Operations for Transactions 
****************************************************/


// Get all transactions for the logged-in user
router.get("/transactions", protect, async (req, res) => {
  try {


    if(req.user.isAdmin){
      const transactions = await Transaction.find().sort({
        createdAt: -1,
      }).populate("user", "name email company");
      res.status(200).json(transactions);
    }
    else{
      const transactions = await Transaction.find({ user: req.user._id }).sort({
        createdAt: -1,
      }).populate("user", "name email company");
      res.status(200).json(transactions);
    }

    
    
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Get a single transaction by ID
router.get("/transactions/:id", protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You do not have permission to view this transaction.",
      });
    }

    res.status(200).json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ message: "Server error." });
  }
});




// Forgot password route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a 6-digit random code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const resetCodeExpiry = Date.now() + 15 * 60 * 1000; // Expires in 15 minutes

    // Save reset code and expiry time in the user document
    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;

    await user.save();


    const mailOptions = {
      to: email,
      from: process.env.SENDER_EMAIL_ACCOUNTS,
      subject: "Password Reset Request",
      text: `You requested a password reset. Your password reset code is: \n\n${resetCode}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset code sent to your email" });

  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Step 2: Verify Reset Code
router.post("/verify-code", async (req, res) => {
  const { email, resetCode } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the code is correct and not expired
    if (user.resetCode !== resetCode) {
      return res.status(400).json({ message: "Invalid code" });
    }

    if (Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ message: "Reset code has expired" });
    }

    res.status(200).json({ message: "Code verified, you can now reset your password" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying reset code" });
  }
});



// Step 3: Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  try {
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify if the code is correct and not expired
    if (user.resetCode !== resetCode) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    if (Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ message: "Reset code has expired" });
    }

    // Hash the new password and save it
    user.password = newPassword;

    // Clear reset code and expiry
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error resetting password" });
  }
});





router.get("/download-order/:orderId", protect, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    let order = await Order.findById(orderId).populate("product");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Set the headers for the zip file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=order-${orderId}-stamps.zip`);

    // Create a zip stream (without saving the file to disk)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Pipe archive data directly to the response
    archive.pipe(res);

    // Loop through stampsUploaded and append each file to the zip
    for (const stamp of order.stampsUploaded) {
      const filePath = path.join(__dirname, "../public", "uploads", stamp.file);

      // Check if the file exists before adding it to the archive
      if (fs.existsSync(filePath)) {
        archive.append(fs.createReadStream(filePath), { name: stamp.file });
      }
    }

    // Finalize the archive (close it and send it)
    archive.finalize();



    
  } catch (error) {
    throw error;
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
});








// Top up
// Create a new ticket
router.post("/topups", protect, async (req, res) => {
  const { quantity } = req.body;

  const existing = await Topup.find({ user: req.user._id, status: "Pending" });

  if (existing.length > 0) {
    return res.status(400).json({ message: "You already have a pending top-up request." });
  }


  try {
    const topup = await Topup.create({
      user: req.user._id,
      amount: quantity
    });
    res.status(201).json(topup);
  } catch (error) {
    throw error;
    res.status(500).json({ message: error.message });
  }
});



// Update a Topup by ID
router.put("/topups/:id", protect, async (req, res) => {
  const { refNo, paymentNote } = req.body;

  try {
    const topup = await Topup.findById(req.params.id);

    if (!topup) {
      return res.status(404).json({ message: "Topup not found" });
    }

    if (topup.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You do not have permission to update this topup" });
    }

    topup.refNo = refNo || topup.refNo;
    topup.paymentNote = paymentNote || topup.paymentNote;

    await topup.save();
    res.json(topup);
  } catch (error) {
    throw error;
    res.status(500).json({ message: error.message });
  }
});


















module.exports = router;
