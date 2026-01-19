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

  static async getTopRankingOfFriendByUserId_GameId(userId, gameId) {
    return await db("leaderboards")
      .join("users", "users.id", "leaderboards.user_id")
      .join("friendships", function () {
        this.on("friendships.requester_id", "=", "leaderboards.user_id").orOn("friendships.addressee_id", "=", "leaderboards.user_id");
      })
      .join("games", "games.id", "leaderboards.game_id")
      .where("friendships.status", "accepted")
      .andWhere(function () {
        this.where("friendships.requester_id", userId).orWhere("friendships.addressee_id", userId);
      })
      .andWhere("leaderboards.game_id", gameId)
      .orderBy("leaderboards.high_score", "desc")
      .limit(10)
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
      );
  }

  static async getTopRankingOfFriendByUserId(userId) {
    return await db("leaderboards")
      .join("users", "users.id", "leaderboards.user_id")
      .join("friendships", function () {
        this.on("friendships.requester_id", "=", "leaderboards.user_id").orOn("friendships.addressee_id", "=", "leaderboards.user_id");
      })
      .join("games", "games.id", "leaderboards.game_id")
      .where("friendships.status", "accepted")
      .andWhere(function () {
        this.where("friendships.requester_id", userId).orWhere("friendships.addressee_id", userId);
      })
      .orderBy("leaderboards.high_score", "desc")
      .limit(10)
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
      );
  }
}

module.exports = LeaderboardsModel;
