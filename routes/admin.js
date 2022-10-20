const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");

router.get('/', adminController.getLogin);

router.post('/postLogin', adminController.postLogin);

router.get('/showUsers', adminController.showUsers);

router.get('/dashboard/getSalesData', adminController.getData);

router.get('/user/:userId', adminController.showUserDetails);

router.get('/user/orders/:userId', adminController.showUserOrders);

router.get('/user/orders/details/:orderId', adminController.showUserOrderDetail);

router.get('/user/cancelOrder/:orderId', adminController.cancelUserOrder);

router.get('/showSellers', adminController.showSellers);

router.get('/seller/:sellerId', adminController.showSerDetails);

router.get('/seller/orders/:sellerId', adminController.showSerOrders);

// to show the product of each seller
router.get('/seller/products/:sellerId', adminController.showSellerProducts);

router.get('/addCategory', adminController.addCategory);

router.post('/saveCategory', adminController.postSaveCategory);

router.get('/logout', adminController.logout);


module.exports = router