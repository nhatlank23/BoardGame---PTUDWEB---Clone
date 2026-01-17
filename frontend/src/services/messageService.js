import { apiClient } from "@/lib/apiClient";

export const messageService = {
  async getMessages(receiverId) {
    return await apiClient.get(`/users/messages/${receiverId}`);
  },

  async sendMessage(receiverId, content) {
    return await apiClient.post("/users/messages", {
      receiver_id: receiverId,
      content,
    });
  },
};
