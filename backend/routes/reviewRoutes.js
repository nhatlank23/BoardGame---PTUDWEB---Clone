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
/**
 * @openapi
 * /api/reviews/game/{gameId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews for a specific game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 */
router.get("/game/:gameId", ReviewController.getGameReviews);

/**
 * @openapi
 * /api/reviews/game/{gameId}/stats:
 *   get:
 *     tags: [Reviews]
 *     summary: Get rating statistics for a game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rating statistics
 */
router.get("/game/:gameId/stats", ReviewController.getGameRatingStats);

// Protected routes
/**
 * @openapi
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create or update a review
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game_id
 *               - rating
 *               - comment
 *             properties:
 *               game_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review saved successfully
 */
router.post("/", authMiddleware, ReviewController.createOrUpdateReview);

/**
 * @openapi
 * /api/reviews/{reviewId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete("/:reviewId", authMiddleware, ReviewController.deleteReview);

/**
 * @openapi
 * /api/reviews/user/my-review/{gameId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get current user's review for a game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's review
 */
router.get(
  "/user/my-review/:gameId",
  authMiddleware,
  ReviewController.getMyReview
);

module.exports = router;
