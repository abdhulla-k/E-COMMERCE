const express = require("express");

const router = express.Router();

const sellerController = require("../controllers/seller");

router.get('/', sellerController.getLogin);

router.post('/postLogin', sellerController.postLogin)

router.get('/signup', sellerController.getSignup);

router.post('/postSignup', sellerController.postSignup);

router.get("/dashboard/getData", sellerController.getDashboardData);

router.get("/addProduct", sellerController.getAddProduct);

router.post("/saveNewProduct", sellerController.postAddProduct);

router.get("/showMyProducts", sellerController.showMyProducts);

router.post("/filteredProducts", sellerController.filterProducts);

router.get("/detail/:productId", sellerController.myProductDetails);

router.get("/edit/:productId", sellerController.editProduct);

router.post("/postEdit", sellerController.saveProductEdit );

router.get("/delete/:productId", sellerController.deleteProduct);

router.get("/showOrders", sellerController.showOrders);

router.post("/changeOrderStatus", sellerController.changeOrderStatus);

router.get("/showSalesReport", sellerController.salesReport);

router.get("/logout", sellerController.logout);

module.exports = router;