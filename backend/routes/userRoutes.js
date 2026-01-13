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

// Respond to friend request endpoint
router.patch('/friends/respond', userController.respondToFriendRequest);

// Delete friend or cancel request endpoint
router.delete('/friends/:id', userController.deleteFriend);

// Get messages endpoint
router.get('/messages/:receiver_id', userController.getMessages);

module.exports = router;

