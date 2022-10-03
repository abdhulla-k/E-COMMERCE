const express = require( "express" );

const router = express.Router();

const shopController = require( '../controllers/shop');

router.get( '/', shopController.getShop );

router.get('/showProducts', shopController.showAllProducts );

module.exports = router;