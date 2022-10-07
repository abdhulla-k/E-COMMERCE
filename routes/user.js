const express = require( "express" );

const router = express.Router();

const userController = require( "../controllers/user" );

router.get( '/login', userController.getLogin );

router.post( '/postLogin', userController.postLogin );

router.get( '/signup', userController.getSignup );

router.post( '/postSignup', userController.postSignup );

router.get('/otp', userController.otpVerify);

router.post('/postSignupOtp', userController.postSignupOtp);

router.get( '/logout', userController.userLogout );

module.exports = router;