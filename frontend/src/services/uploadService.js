import apiClient from "@/lib/apiClient";

export const uploadService = {
  /**
   * Upload avatar file
   * @param {File} file - Avatar file
   * @returns {Promise<{avatar_url: string, user: object}>}
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/users/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data.data;
  },
};
