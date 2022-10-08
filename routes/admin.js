const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");

router.get('/addCategory', adminController.addCategory);
router.post('/saveCategory', adminController.postSaveCategory);

module.exports = router