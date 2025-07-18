
const shopAuthModel = require("../../models/shop/shopAuthModel");
const orderModel = require("../../models/user/orderModel");
const userAddress = require("../../models/user/userAddress");
const User = require('../../models/user/userAuthController');
const sendOTP = require("../../utils/sendOTP");
const mongoose = require('mongoose');

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


function getDeliveryCharges(distance) {
  if (distance <= 2) return 20;
  if (distance <= 3) return 30;
  if (distance <= 4) return 40;
  if (distance <= 5) return 50;
  return 60;
}

// user side 
exports.placeOrder = async (req, res) => {
  try {
    const {
      userId,
      shopId,
      addressId,
      services,
      totalAmount,
      pickupDateTime
    } = req.body;

    // 🧭 Get shop and user address
    const shop = await shopAuthModel.findById(shopId);
    const address = await userAddress.findById(addressId);

    if (!shop || !address) {
      return res.status(404).json({ error: 'Shop or Address not found' });
    }

    const shopLoc = shop.locations;
    const userLoc = address.locations;

    // 📏 Calculate distance & delivery charges
    const distance = calculateDistance(
      shopLoc.latitude,
      shopLoc.longitude,
      userLoc.latitude,
      userLoc.longitude
    );
    const deliveryCharges = getDeliveryCharges(distance);

    // 🧾 GST logic (example: 18%)
    const gst = +(totalAmount * 0.18).toFixed(2);

    // Optional: Delivery Partner Fee
    const deliveryPartnerFee = 10; // static or based on some logic

    // Final payable amount
    const finalAmount = totalAmount + gst + deliveryCharges + deliveryPartnerFee;

    // Generate 6-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

    // Create Order
    const order = new orderModel({
      userId,
      shopId,
      addressId,
      services,
      pickupDateTime,
      otp,
      otpExpiresAt,
      paymentSummary: {
        itemTotal: totalAmount,
        gst,
        deliveryPartnerFee,
        deliveryCharges,
        couponDiscount: 0, // future support
        finalAmount
      }
    });

    const savedOrder = await order.save();

    // Send OTP
    const user = await User.findById(userId);
    if (user?.email) {
      await sendOTP(user.email, otp);
    }

    res.status(201).json({
      message: 'Order added successfully. OTP sent.',
      order: savedOrder
    });

  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

exports.ConfirmRejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!['placeorder', 'cancel', 'accepted', 'orderReady', 'rejectedByDeliveryBoy'].includes(orderStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: 'order not found' });

    res.status(200).json({ message: `order ${orderStatus} successfully`, order });
  } catch (error) {
    console.error('Status update failed:', error);
    res.status(500).json({ error: 'Failed to update driver status' });
  }
};




exports.verifyOrderOTP = async (req, res) => {
  const { orderId } = req.params;
  const { otp } = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > order.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    order.isOtpVerified = true;
    order.orderStatus = 'pickup';
    order.otp = null;
    order.otpExpiresAt = null;

    await order.save();

    res.status(200).json({ message: 'OTP verified, order marked for pickup', order });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};




// admin side 
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find()
      .populate('userId')
      .populate('addressId')
      .populate('deliveryBoyId') // ✅ yeh correct hai
      .populate({
        path: 'services',
        populate: [
          {
            path: 'serviceId',
            select: 'name' // only name from service
          },
          {
            path: 'products.productId' // full product data if needed
          }
        ]
      });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Get orders failed:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};







exports.getOrdersByUserId = async (req, res) => {
  const { userId } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const orders = await orderModel.find({ userId })
      .populate('shopId', 'hotelName hotelNumber') // Optional: populate shop info
      .populate('addressId') // Optional: populate address
      .populate('services.serviceId', 'name image') // ✅ Populate service details
      .sort({ createdAt: -1 }); // latest first

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching orders by userId:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// user side 




const Service = require("../../models/shop/Service")

exports.recommendCategoriesWithProducts = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    // Step 1: Get user's orders
    const orders = await orderModel.find({ userId })
      .populate('services.serviceId', 'name');

    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    // Step 2: Count frequency of serviceIds
    const serviceMap = new Map();

    orders.forEach(order => {
      order.services.forEach(service => {
        const svc = service.serviceId;
        if (svc) {
          const key = svc._id.toString();
          if (serviceMap.has(key)) {
            serviceMap.set(key, {
              ...serviceMap.get(key),
              count: serviceMap.get(key).count + 1
            });
          } else {
            serviceMap.set(key, {
              _id: svc._id,
              name: svc.name,
              count: 1
            });
          }
        }
      });
    });

    // Step 3: Fetch service details with products
    const recommended = await Promise.all(
      Array.from(serviceMap.values()).map(async (service) => {
        const fullService = await Service.findById(service._id).select('name image products');

        if (!fullService) {
          console.warn(`Service not found for ID: ${service._id}`);
          return { ...service, image: '', products: [] };
        }

        console.log(`Fetched Service: ${fullService.name}, Products: ${fullService.products.length}`);

        return {
          ...service,
          image: fullService.image || '',
          products: fullService.products || []
        };
      })
    );

    const sorted = recommended.sort((a, b) => b.count - a.count);

    res.status(200).json({ recommended: sorted });
  } catch (err) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};




exports.getOrdersByUserIdwithOrderStatus = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const orders = await orderModel.find({ userId })
      .populate('shopId', 'shopName contactNo')
      .populate('addressId')
      .populate('services.serviceId', 'name image')
      .sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    // Group by orderStatus
    const grouped = {};

    orders.forEach(order => {
      const status = order.orderStatus || 'unknown';
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(order);
    });

    // Convert to desired array format
    const result = Object.keys(grouped).map(status => ({
      orderStatus: status,
      orders: grouped[status]
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error grouping orders:', error);
    res.status(500).json({ error: 'Failed to fetch grouped orders' });
  }
};

// shop side 
exports.assignDeliveryBoy = async (req, res) => {
  const { orderId } = req.params;
  const { deliveryBoyId } = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.deliveryBoyId = deliveryBoyId;
    order.orderStatus = 'pickup';
    await order.save();

    res.status(200).json({ message: 'Delivery boy assigned', order });
  } catch (error) {
    console.error('Assign delivery boy error:', error);
    res.status(500).json({ error: 'Failed to assign delivery boy' });
  }
};
// shop side 
exports.assignDeliveryAndComplete = async (req, res) => {
  const { orderId } = req.params;
  const { deliveryBoyId } = req.body;

  try {
    const order = await orderModel.findById(orderId).populate('userId');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const user = order.userId;
    if (!user.email) return res.status(400).json({ error: 'User email not found' });

    // Generate OTP valid for 24 hours
    const otp = Math.floor(1000 + Math.random() * 9000);
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    order.deliveryBoyId = deliveryBoyId;
    order.otp = otp;
    order.otpExpiresAt = otpExpiresAt;
    order.orderStatus = 'completed'; // directly mark as completed
    await order.save();

    // Send OTP to user's email
    await sendOTP(user.email, otp);

    res.status(200).json({
      message: 'Delivery boy assigned, OTP sent to user, and order marked as completed',
      order
    });

  } catch (error) {
    console.error('Assign delivery error:', error);
    res.status(500).json({ error: 'Failed to assign delivery and send OTP' });
  }
};
exports.verifyOrderDeliveryOTP = async (req, res) => {
  const { orderId } = req.params;
  const { otp } = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!order.otp || !order.otpExpiresAt) {
      return res.status(400).json({ error: 'No OTP found for this order' });
    }

    // Check OTP match
    if (order.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check expiry
    if (new Date() > order.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Mark as delivered
    order.isOtpVerified = true;
    order.orderStatus = 'delivered'; // or 'completed' if that's your status
    order.otp = null;
    order.otpExpiresAt = null;

    await order.save();

    res.status(200).json({
      message: 'OTP verified successfully. Order marked as delivered.',
      order
    });

  } catch (error) {
    console.error('OTP verification failed:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};
// delivery side 
exports.getOrdersByDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;

    const orders = await orderModel
      .find({ deliveryBoyId })
      .populate('userId', 'name contactNo')  // optional: populate user info
      .populate('addressId')
      .populate('shopId')
      .populate('services.serviceId')
      .populate('services.products.productId');

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders assigned to this delivery boy' });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching delivery boy orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Common for all (admin/shop/delivery if required by status)
exports.getOrdersByStatus = async (req, res) => {
  const { status } = req.params;

  try {
    const orders = await orderModel.find({ orderStatus: status })
      .populate('userId', 'name contactNo')
      .populate('addressId')
      .populate('shopId')
      .populate('services.serviceId')
      .populate('services.products.productId');

    if (orders.length === 0) {
      return res.status(404).json({ message: `No orders with status "${status}" found.` });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ error: 'Failed to fetch orders by status' });
  }
};


exports.getOrdersByShopId = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Validate ObjectId
    if (!shopId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid shopId format' });
    }

    const orders = await orderModel.find({ shopId })
      .populate('userId', 'Name contactNo')
      .populate('addressId')
      .populate('services.serviceId', 'name')
      .sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found for this shop' });
    }

    // Custom structure: ensure `paymentSummary` comes last
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      userId: order.userId,
      shopId: order.shopId,
      addressId: order.addressId,
      services: order.services,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paymentSummary: order.paymentSummary
    }));

    res.status(200).json({ orders: formattedOrders });

  } catch (error) {
    console.error('Error fetching orders by shopId:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

