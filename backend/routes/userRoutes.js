const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Users search endpoint
router.get('/users/search', userController.searchUsers);

module.exports = router;

