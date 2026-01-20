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

  static async checkAndUpdateAchievement(userId) {
    this.checkAndUpdateAchievementHasFiveFriend(userId);
    this.checkAndUpdateAchievementFirstGames(userId);
    this.checkAndUpdateAchievementWinTenCaro(userId);
    this.checkAndUpdateAchievementSnakeGame(userId);
  }

  // Update thànht tựu Social Star: có 5 người bạn
  static async checkAndUpdateAchievementHasFiveFriend(userId) {
    const countFriends = await db("friendships")
      .where(function () {
        this.where({ requester_id: userId }).orWhere({ addressee_id: userId });
      })
      .andWhere("status", "accepted")
      .select(db.raw("COUNT(*) as count"));

    const count = countFriends[0].count;

    if (count >= 5) {
      await this.unlockAchievement(userId, 14);
    }
  }

  // Update thành tựu Newbie: chơi ván gam e đầu tiên
  static async checkAndUpdateAchievementFirstGames(userId) {
    const playHistory = await db("play_history").where("play_history.user_id", userId);

    if (!playHistory) return;

    if (playHistory.length > 0) {
      await this.unlockAchievement(userId, 11);
    }
  }

  // Update thành tựu Winner: Thắng 10 ván Caro
  static async checkAndUpdateAchievementWinTenCaro(userId) {
    const caroGameId = 13;
    const playHistory = await db("play_history")
      .where("play_history.user_id", userId)
      .andWhere("play_history.game_id", caroGameId)
      .andWhere("play_history.score", 1)
      .select(db.raw("COUNT(*) as count"));

    const count = playHistory[0].count;

    if (count >= 10) {
      await this.unlockAchievement(userId, 12);
    }
  }

  // Update thành tựu Snake Master: Đạt 100 điểm game Snake
  static async checkAndUpdateAchievementSnakeGame(userId) {
    const gameId = 14;
    const playHistory = await db("play_history")
      .where("play_history.user_id", userId)
      .andWhere("play_history.game_id", gameId)
      .andWhere("play_history.score", ">=", 100)
      .select(db.raw("COUNT(*) as count"));

    const count = playHistory[0].count;

    if (count > 0) {
      await this.unlockAchievement(userId, 13);
    }
  }

  static async unlockAchievement(userId, achievementId) {
    try {
      const unlock = await db("user_achievements").insert({ user_id: userId, achievement_id: achievementId });
      return unlock;
    } catch (err) {
      // Duplicate = Đã có thành tựu đó rồi
    }
  }
}

module.exports = AchievementModel;
