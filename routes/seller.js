const express = require( "express" );

const router = express.Router();

const sellerController = require( "../controllers/seller" );

router.get( "/addProduct", sellerController.getAddProduct );

router.post( "/saveNewProduct", sellerController.postAddProduct );

router.get( "/showMyProducts", sellerController.showMyProducts );

module.exports = router;