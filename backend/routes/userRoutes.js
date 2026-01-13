const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Users search endpoint
router.get('/users/search', userController.searchUsers);

// Friends endpoint
router.get('/friends', userController.getFriends);

module.exports = router;

