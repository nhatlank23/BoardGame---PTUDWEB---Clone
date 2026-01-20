import { apiClient } from "@/lib/apiClient";

const DEFAULT_LIMIT = 20;

export const messageService = {
  /**
   * Lấy tin nhắn với một người dùng
   * @param {number} receiverId - ID của người nhận
   * @param {number|null} beforeId - ID tin nhắn để lấy các tin cũ hơn (cho infinite scroll)
   * @param {number} limit - Số lượng tin nhắn mỗi lần load
   */
  async getMessages(receiverId, beforeId = null, limit = DEFAULT_LIMIT) {
    // Sử dụng URLSearchParams để xử lý query string chuẩn hơn
    const params = new URLSearchParams();
    params.append('limit', limit);

    if (beforeId) {
      params.append('before', beforeId);
    }

    // Kết quả sẽ là: /users/messages/123?limit=50&before=456
    return await apiClient.get(`/users/messages/${receiverId}?${params.toString()}`);
  },

  /**
   * Gửi tin nhắn
   * @param {number} receiverId - ID người nhận
   * @param {string} content - Nội dung tin nhắn
   */
  async sendMessage(receiverId, content) {
    return await apiClient.post("/users/messages", {
      receiver_id: receiverId,
      content,
    });
  },
};