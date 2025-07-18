// routes/orderRoutes.js
const express = require('express');
const { placeOrder, getAllOrders,getOrdersByShopId,  assignDeliveryBoy, getOrdersByDeliveryBoy, verifyOrderOTP, assignDeliveryAndComplete, verifyOrderDeliveryOTP, getOrdersByStatus, getOrdersByUserId, getOrdersByUserIdwithOrderStatus, ConfirmRejectOrder,  recommendCategoriesWithProducts } = require('../../controller/user/orderController');
const router = express.Router();
// const orderController = require('../controllers/orderController');

router.post('/place', placeOrder);
router.put('/ConfirmRejectOrder/:orderId', ConfirmRejectOrder);

router.get('/all', getAllOrders);

router.get('/orders/:userId', getOrdersByUserId);
router.get('/recommendCategoriesByUser/:userId', recommendCategoriesWithProducts);
router.get('/getOrdersByUserIdwithOrderStatus/:userId', getOrdersByUserIdwithOrderStatus);
router.put('/assign-delivery/:orderId', assignDeliveryBoy);
router.post('/verify-order-otp/:orderId', verifyOrderOTP);
router.put('/assign-deliveryboy-completed/:orderId', assignDeliveryAndComplete);
router.post('/verify-delivery-otp/:orderId', verifyOrderDeliveryOTP);
// delivery
router.get('/delivery-boy/:deliveryBoyId', getOrdersByDeliveryBoy);
router.get('/status/:status',getOrdersByStatus);
router.get('/shop/:shopId', getOrdersByShopId);



module.exports = router;
