// Friend service - handles all friend-related API calls
import { apiClient } from "@/lib/apiClient";

export const friendService = {
  // Lấy danh sách bạn bè
  async getFriends(page = 1, pageSize = 50) {
    return await apiClient.get(`/users/friends?page=${page}&pageSize=${pageSize}`);
  },

  // Lấy danh sách lời mời kết bạn
  async getFriendRequests(page = 1, pageSize = 50) {
    return await apiClient.get(`/users/friends/requests?page=${page}&pageSize=${pageSize}`);
  },

  // Lấy danh sách lời mời đã gửi (outgoing requests)
  async getSentRequests() {
    return await apiClient.get("/users/friends/sent");
  },

  // Tìm kiếm user
  async searchUsers(query) {
    return await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
  },

  // Gửi lời mời kết bạn
  async sendFriendRequest(addresseeId) {
    return await apiClient.post("/users/friends/request", { addresseeId });
  },

  // Chấp nhận hoặc từ chối lời mời
  async respondToRequest(requesterId, action) {
    return await apiClient.patch("/users/friends/respond", { requesterId, action });
  },

  // Xóa bạn bè
  async deleteFriend(friendId) {
    return await apiClient.delete(`/users/friends/${friendId}`);
  },
};
