import { apiClient } from "@/lib/apiClient";

const reviewService = {
  // Lấy danh sách reviews của game với phân trang
  getGameReviews: async (gameId, page = 1, limit = 10) => {
    return await apiClient.get(`/reviews/game/${gameId}`, {
      params: { page, limit },
    });
  },

  // Lấy thống kê rating của game
  getGameRatingStats: async (gameId) => {
    return await apiClient.get(`/reviews/game/${gameId}/stats`);
  },

  // Tạo hoặc cập nhật review
  createOrUpdateReview: async (gameId, rating, comment) => {
    return await apiClient.post("/reviews", {
      game_id: gameId,
      rating,
      comment,
    });
  },

  // Lấy review của user hiện tại cho game cụ thể
  getMyReview: async (gameId) => {
    return await apiClient.get(`/reviews/user/my-review/${gameId}`);
  },

  // Xóa review
  deleteReview: async (reviewId) => {
    return await apiClient.delete(`/reviews/${reviewId}`);
  },
};

export default reviewService;
