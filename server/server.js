const fs = require('fs');
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require("./routes/apiRoutes");
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');


// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();





// Middleware
app.use(express.json());
app.use(cors());


// Serve static files from the 'public' folder

// Serve static files from the 'public' folder
app.use('/uploads', (req, res, next) => {
    const options = {
      dotfiles: 'deny',
      headers: {
        'Content-Disposition': 'inline', // Force display in the browser
      },
    };
  
    express.static(path.join(__dirname, 'public/uploads'), options)(req, res, next);
  });
  

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);

app.use('/api/admin', adminRoutes);


app.use("/api/v1", apiRoutes);

// Serve React frontend in production
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Server listening
const PORT = process.env.PORT || 3001;


//SSL Configuration - Update paths to your actual certificate files
// const sslOptions = {
//   key: fs.readFileSync('/etc/letsencrypt/live/api.edrafterb2b.in/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/api.edrafterb2b.in/fullchain.pem')
// };

// Create HTTPS server
const httpsServer = http.createServer(app);

httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Server running on port ${PORT}`);
});


//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
