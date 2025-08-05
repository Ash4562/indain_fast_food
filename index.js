// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require("cors");
// require('dotenv').config();


// const app = express();

// app.use(express.json());
// app.use(cors({
//     origin: [
//         "http://localhost:5173",
//         "http://localhost:5174",
        
//     ],
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true,
// }));
// app.use("/shop/contactus", require("./routes/conatct/ContantusRoutes"));
// app.use("/shop/pickup", require("./routes/conatct/PickupRoutes"));
// // shop
// app.use("/vendor/auth", require("./routes/shop/shopAuthroutes"));
// app.use('/vendor/categories', require('./routes/shop/serviceRoutes'));
// // photo
// app.use('/vendor/offer', require('./routes/shop/GalleryRoutes'));
// app.use('/shop/gallery', require('./routes/shop/OfferRoutes'));
// // usergallery

// app.use('/user/auth', require('./routes/user/userAuthRoutes'));
// app.use('/user/address', require('./routes/user/userAddressRoutes'));
// app.use('/user/order', require('./routes/user/orderRoutes'));
// // deliveryBoy
// app.use('/delivery/auth', require('./routes/deliveryboyroutes/DeliveryBoyRoutes'));
// // admin
// app.use('/admin/auth', require('./routes/admin/authRoutes'));

// mongoose.connect(process.env.MONGO_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
//   .then(() => {
//     console.log('MongoDB connected');
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch(err => console.error('DB connection error:', err));





const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
require('dotenv').config();
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // socket server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// 💡 Your existing routes
app.use("/shop/contactus", require("./routes/conatct/ContantusRoutes"));
app.use("/shop/pickup", require("./routes/conatct/PickupRoutes"));
app.use("/vendor/auth", require("./routes/shop/shopAuthroutes"));
app.use("/vendor/categories", require("./routes/shop/serviceRoutes"));
app.use("/vendor/offer", require("./routes/shop/GalleryRoutes"));
app.use("/shop/gallery", require("./routes/shop/OfferRoutes"));
app.use("/user/auth", require("./routes/user/userAuthRoutes"));
app.use("/user/address", require("./routes/user/userAddressRoutes"));
app.use("/user/order", require("./routes/user/orderRoutes"));
app.use("/delivery/auth", require("./routes/deliveryboyroutes/DeliveryBoyRoutes"));
app.use("/admin/auth", require("./routes/admin/authRoutes"));

// ✅ SOCKET IO LOGIC
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Delivery boy sends location
  socket.on("deliveryBoy-location-update", ({ deliveryBoyId, latitude, longitude }) => {
    console.log(`Location from ${deliveryBoyId}:`, latitude, longitude);

    // Broadcast location to all users
    io.emit("user-track-delivery", { deliveryBoyId, latitude, longitude });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ✅ Start Server
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`✅ Server + Socket running on port ${PORT}`));
}).catch(err => console.error('DB error:', err));
