import { apiClient } from "@/lib/apiClient";

const achievementService = {
    // Get all achievements in system
    getAllAchievements: async () => {
        return await apiClient.get("/achievements/all");
    },

    // Get user's unlocked achievements
    getUserAchievements: async (userId = null) => {
        const endpoint = userId
            ? `/achievements/user/${userId}`
            : "/achievements/my";
        return await apiClient.get(endpoint);
    },

    // Get achievements progress (for current user)
    getAchievementProgress: async () => {
        return await apiClient.get("/achievements/progress");
    },
};

export default achievementService;
