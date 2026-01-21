const db = require("../configs/db");

class LeaderboardsModel {
  // Count distinct players by game ID
  static async countPlayersByGameId(gameId) {
    const [{ count }] = await db("play_history")
      .where("play_history.game_id", gameId)
      .countDistinct("play_history.user_id as count");
    return parseInt(count);
  }

  // Get top gamers by game ID
  static async getTopGamersByGameId(gameId, page = 1, pageSize = 50) {
    const leaderboards = await db("play_history")
      .where("play_history.game_id", gameId)
      .join("games", "games.id", "play_history.game_id")
      .join("users", "users.id", "play_history.user_id")
      .select(
        "users.id as user_id",
        "users.username as name",
        "users.avatar_url as avatar_url",
        db.raw("COUNT(*) as played"),
        db.raw("MAX(play_history.score) as record"),
        db.raw("AVG(play_history.score)::INTEGER as avg_score"),
        db.raw(
          "SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END) as wins"
        ),
        db.raw(
          "ROUND(SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1) as win_rate"
        )
      )
      .groupBy("users.id", "users.username")
      .orderBy("avg_score", "desc")
      .orderBy("win_rate", "desc")
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return leaderboards;
  }

  // Count friends who played this game
  static async countFriendsByUserId_GameId(userId, gameId) {
    const [{ count }] = await db("play_history")
      .join("friendships", function () {
        this.on("friendships.requester_id", "=", "play_history.user_id").orOn(
          "friendships.addressee_id",
          "=",
          "play_history.user_id"
        );
      })
      .where(function () {
        this.where("friendships.requester_id", userId).orWhere(
          "friendships.addressee_id",
          userId
        );
      })
      .andWhere("play_history.game_id", gameId)
      .countDistinct("play_history.user_id as count");
    return parseInt(count);
  }

  static async getTopRankingOfFriendByUserId_GameId(
    userId,
    gameId,
    page = 1,
    pageSize = 50
  ) {
    const leaderboards = await db("play_history")
      .join("games", "games.id", "play_history.game_id")
      .join("users", "users.id", "play_history.user_id")
      .join("friendships", function () {
        this.on("friendships.requester_id", "=", "play_history.user_id").orOn(
          "friendships.addressee_id",
          "=",
          "play_history.user_id"
        );
      })
      // .where("friendships.status", "accepted")
      .where(function () {
        this.where("friendships.requester_id", userId).orWhere(
          "friendships.addressee_id",
          userId
        );
      })
      .andWhere("play_history.game_id", gameId)
      .select(
        "users.id as user_id",
        "users.username as name",
        "users.avatar_url as avatar_url",
        db.raw("COUNT(*) as played"),
        db.raw("MAX(play_history.score) as record"),
        db.raw("AVG(play_history.score)::INTEGER as avg_score"),
        db.raw(
          "SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END) as wins"
        ),
        db.raw(
          "ROUND(SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1) as win_rate"
        )
      )
      .groupBy("users.id", "users.username", "users.avatar_url")
      .orderBy("avg_score", "desc")
      .orderBy("win_rate", "desc")
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return leaderboards;
  }
}

module.exports = LeaderboardsModel;

