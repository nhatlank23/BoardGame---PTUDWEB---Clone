const db = require("../configs/db");

class LeaderboardsModel {
  // Get top gamers by game ID
  static async getTopGamersByGameId(gameId) {
    return await db("users")
      .join("user_achievements", "users.id", "user_achievements.user_id")
      .join("achievements", "user_achievements.achievement_id", "achievements.id")
      .where("achievements.game_id", gameId)
      .select("users.id", "users.username", "users.email", "users.avatar_url")
      .groupBy("users.id");
  }
}

module.exports = LeaderboardsModel;
