const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Quản lý đánh giá và bình luận game
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         game_id:
 *           type: integer
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

// Public routes
router.get("/game/:gameId", ReviewController.getGameReviews);
router.get("/game/:gameId/stats", ReviewController.getGameRatingStats);

// Protected routes
router.post("/", authMiddleware, ReviewController.createOrUpdateReview);
router.delete("/:reviewId", authMiddleware, ReviewController.deleteReview);
router.get(
  "/user/my-review/:gameId",
  authMiddleware,
  ReviewController.getMyReview
);

module.exports = router;
