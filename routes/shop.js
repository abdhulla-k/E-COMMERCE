const express = require("express");

const router = express.Router();

const shopController = require('../controllers/shop');

router.get('/', shopController.getShop);
router.get('/showProducts', shopController.showAllProducts);
router.get('/detail/:productId', shopController.productDetails);

module.exports = router;