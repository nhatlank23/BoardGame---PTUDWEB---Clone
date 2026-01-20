const db = require("../configs/db");

class ReviewController {
  /**
   * @swagger
   * /api/reviews/game/{gameId}:
   *   get:
   *     tags: [Reviews]
   *     summary: Lấy danh sách reviews của game với phân trang
   *     parameters:
   *       - in: path
   *         name: gameId
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: Lấy reviews thành công
   */
  static async getGameReviews(req, res) {
    try {
      const { gameId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Kiểm tra game có tồn tại không
      const game = await db("games").where("id", gameId).first();
      if (!game) {
        return res.status(404).json({
          status: "error",
          message: "Game không tồn tại",
        });
      }

      // Đếm tổng số reviews
      const [{ count: totalReviews }] = await db("game_reviews")
        .where("game_id", gameId)
        .count("* as count");

      // Lấy reviews với phân trang
      const reviews = await db("game_reviews")
        .select(
          "game_reviews.id",
          "game_reviews.rating",
          "game_reviews.comment",
          "game_reviews.created_at",
          "game_reviews.updated_at",
          "users.id as user_id",
          "users.username",
          "users.avatar_url"
        )
        .leftJoin("users", "game_reviews.user_id", "users.id")
        .where("game_reviews.game_id", gameId)
        .orderBy("game_reviews.created_at", "desc")
        .limit(limit)
        .offset(offset);

      // Tính average rating
      const [{ avg: averageRating }] = await db("game_reviews")
        .where("game_id", gameId)
        .avg("rating as avg");

      const totalPages = Math.ceil(parseInt(totalReviews) / limit);

      res.status(200).json({
        status: "success",
        data: {
          reviews,
          pagination: {
            page,
            limit,
            totalReviews: parseInt(totalReviews),
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
          averageRating: averageRating
            ? parseFloat(averageRating).toFixed(1)
            : null,
        },
      });
    } catch (error) {
      console.error("Get game reviews error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server khi lấy reviews",
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/reviews:
   *   post:
   *     tags: [Reviews]
   *     summary: Tạo hoặc cập nhật review cho game
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
   *       201:
   *         description: Tạo review thành công
   */
  static async createOrUpdateReview(req, res) {
    try {
      const { game_id, rating, comment } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!game_id || !rating) {
        return res.status(400).json({
          status: "error",
          message: "game_id và rating là bắt buộc",
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          status: "error",
          message: "Rating phải từ 1 đến 5",
        });
      }

      // Kiểm tra game có tồn tại không
      const game = await db("games").where("id", game_id).first();
      if (!game) {
        return res.status(404).json({
          status: "error",
          message: "Game không tồn tại",
        });
      }

      // Kiểm tra user đã review game này chưa
      const existingReview = await db("game_reviews")
        .where({ user_id: userId, game_id })
        .first();

      let review;
      if (existingReview) {
        // Cập nhật review cũ
        await db("game_reviews")
          .where({ user_id: userId, game_id })
          .update({
            rating,
            comment: comment || null,
            updated_at: db.fn.now(),
          });

        review = await db("game_reviews")
          .where({ user_id: userId, game_id })
          .first();

        return res.status(200).json({
          status: "success",
          message: "Cập nhật review thành công",
          data: review,
        });
      } else {
        // Tạo review mới
        const [newReview] = await db("game_reviews")
          .insert({
            user_id: userId,
            game_id,
            rating,
            comment: comment || null,
          })
          .returning("*");

        return res.status(201).json({
          status: "success",
          message: "Tạo review thành công",
          data: newReview,
        });
      }
    } catch (error) {
      console.error("Create/Update review error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server khi tạo/cập nhật review",
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/reviews/{reviewId}:
   *   delete:
   *     tags: [Reviews]
   *     summary: Xóa review của mình
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reviewId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Xóa review thành công
   */
  static async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      // Kiểm tra review có tồn tại và thuộc về user không
      const review = await db("game_reviews").where("id", reviewId).first();

      if (!review) {
        return res.status(404).json({
          status: "error",
          message: "Review không tồn tại",
        });
      }

      if (review.user_id !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          status: "error",
          message: "Bạn không có quyền xóa review này",
        });
      }

      await db("game_reviews").where("id", reviewId).delete();

      res.status(200).json({
        status: "success",
        message: "Xóa review thành công",
      });
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server khi xóa review",
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/reviews/user/my-review/{gameId}:
   *   get:
   *     tags: [Reviews]
   *     summary: Lấy review của user hiện tại cho game cụ thể
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
   *         description: Lấy review thành công
   */
  static async getMyReview(req, res) {
    try {
      const { gameId } = req.params;
      const userId = req.user.id;

      const review = await db("game_reviews")
        .where({ user_id: userId, game_id: gameId })
        .first();

      if (!review) {
        return res.status(404).json({
          status: "error",
          message: "Bạn chưa review game này",
        });
      }

      res.status(200).json({
        status: "success",
        data: review,
      });
    } catch (error) {
      console.error("Get my review error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server khi lấy review",
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/reviews/game/{gameId}/stats:
   *   get:
   *     tags: [Reviews]
   *     summary: Lấy thống kê rating của game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lấy thống kê thành công
   */
  static async getGameRatingStats(req, res) {
    try {
      const { gameId } = req.params;

      // Kiểm tra game có tồn tại không
      const game = await db("games").where("id", gameId).first();
      if (!game) {
        return res.status(404).json({
          status: "error",
          message: "Game không tồn tại",
        });
      }

      // Tính average rating
      const [{ avg: averageRating, count: totalReviews }] = await db(
        "game_reviews"
      )
        .where("game_id", gameId)
        .select(db.raw("AVG(rating) as avg"), db.raw("COUNT(*) as count"));

      // Đếm số lượng mỗi loại rating (1-5 sao)
      const ratingDistribution = await db("game_reviews")
        .where("game_id", gameId)
        .select("rating")
        .count("* as count")
        .groupBy("rating")
        .orderBy("rating", "desc");

      const distribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      ratingDistribution.forEach((item) => {
        distribution[item.rating] = parseInt(item.count);
      });

      res.status(200).json({
        status: "success",
        data: {
          averageRating: averageRating
            ? parseFloat(averageRating).toFixed(1)
            : 0,
          totalReviews: parseInt(totalReviews) || 0,
          distribution,
        },
      });
    } catch (error) {
      console.error("Get rating stats error:", error);
      res.status(500).json({
        status: "error",
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }
}

module.exports = ReviewController;
