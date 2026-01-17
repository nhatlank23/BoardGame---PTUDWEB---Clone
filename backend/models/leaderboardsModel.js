const db = require("../configs/db");

class LeaderboardsModel {
  // Get top gamers by game ID
  static async getTopGamersByGameId(gameId) {
    const leaderboards = await db("leaderboards")
      .join("users", "users.id", "leaderboards.user_id")
      .join("games", "games.id", "leaderboards.game_id")
      .where("leaderboards.game_id", gameId)
      .andWhere("users.is_banned", false)
      .select(
        "leaderboards.id as leaderboard_id",
        "leaderboards.high_score",
        "leaderboards.achieved_at",
        "users.id as user_id",
        "users.username",
        "users.avatar_url",
        "games.id as game_id",
        "games.slug as game_slug",
        "games.name as game_name",
      )
      .groupBy("games.id", "leaderboards.id", "users.id")
      .orderBy("leaderboards.high_score", "desc")
      .limit(11);

    return leaderboards;
  }

  static async getTopGamers() {
    return await db("leaderboards")
      .join("users", "users.id", "leaderboards.user_id")
      .join("games", "games.id", "leaderboards.game_id")
      .where("users.is_banned", false)
      .select(
        "leaderboards.id as leaderboard_id",
        "leaderboards.high_score",
        "leaderboards.achieved_at",
        "users.id as user_id",
        "users.username",
        "users.avatar_url",
        "games.id as game_id",
        "games.slug as game_slug",
        "games.name as game_name",
      )
      .groupBy("games.id", "leaderboards.id", "users.id")
      .orderBy("leaderboards.high_score", "desc")
      .limit(10);
  }
}

module.exports = LeaderboardsModel;
