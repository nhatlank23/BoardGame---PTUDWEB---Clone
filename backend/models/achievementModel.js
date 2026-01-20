const db = require("../configs/db");

class AchievementModel {
  // Get user achievements
  static async getUserAchievements(userId, page = 1, pageSize = 50) {
    return await db("achievements")
      .join("user_achievements", "achievements.id", "user_achievements.achievement_id")
      .where("user_achievements.user_id", userId)
      .select("achievements.id", "achievements.name", "achievements.description", "achievements.icon_url", "user_achievements.earned_at")
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  }
}

module.exports = AchievementModel;
