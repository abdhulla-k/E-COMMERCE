const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");

router.get('/', adminController.getLogin);
router.post('/postLogin', adminController.postLogin);
router.get('/addCategory', adminController.addCategory);
router.post('/saveCategory', adminController.postSaveCategory);
router.get('/logout', adminController.logout);

module.exports = router