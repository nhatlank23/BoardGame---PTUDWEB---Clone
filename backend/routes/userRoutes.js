const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Users search endpoint
router.get('/users/search', userController.searchUsers);

// Friends endpoint
router.get('/friends', userController.getFriends);

// Friend requests endpoint
router.get('/friends/requests', userController.getFriendRequests);

// Send friend request endpoint
router.post('/friends/request', userController.sendFriendRequest);

// Delete friend or cancel request endpoint
router.delete('/friends/:id', userController.deleteFriend);

module.exports = router;

