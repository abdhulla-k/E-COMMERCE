const express = require("express");

const router = express.Router();

const sellerController = require("../controllers/seller");

router.get('/', sellerController.getLogin);

router.post('/postLogin', sellerController.postLogin)

router.get('/signup', sellerController.getSignup);

router.post('/postSignup', sellerController.postSignup);

router.get("/addProduct", sellerController.getAddProduct);

router.post("/saveNewProduct", sellerController.postAddProduct);

router.get("/showMyProducts", sellerController.showMyProducts);

router.get("/detail/:productId", sellerController.myProductDetails );

router.post("/filteredProducts", sellerController.filterProducts);

router.get("/logout", sellerController.logout);

module.exports = router;