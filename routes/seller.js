const express = require( "express" );

const router = express.Router();

const sellerController = require( "../controllers/seller" );

router.get( "/addProduct", sellerController.getAddProduct );

router.post( "/saveNewProduct", sellerController.postAddProduct );

module.exports = router;