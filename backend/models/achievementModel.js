const db = require("../configs/db");

class AchievementModel {
  // Get user achievements
  static async getUserAchievements(userId) {
    return await db("achievements")
      .join("user_achievements", "achievements.id", "user_achievements.achievement_id")
      .where("user_achievements.user_id", userId)
      .select("achievements.id", "achievements.title", "achievements.description", "achievements.icon_url", "user_achievements.achieved_at");
  }
}

module.exports = AchievementModel;
