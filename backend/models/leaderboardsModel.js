const db = require("../configs/db");

class LeaderboardsModel {
  // Get top gamers by game ID
  static async getTopGamersByGameId(gameId) {
    const leaderboards = await db("play_history")
      .where("play_history.game_id", gameId)
      .join("games", "games.id", "play_history.game_id")
      .join("users", "users.id", "play_history.user_id")
      .select(
        "users.username as name",
        "users.avatar_url as avatar_url",
        db.raw("COUNT(*) as played"),
        db.raw("MAX(play_history.score) as record"),
        db.raw("AVG(play_history.score)::INTEGER as avg_score"),
        db.raw("SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END) as wins"),
        db.raw("ROUND(SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1) as win_rate"),
      )
      .groupBy("users.id", "users.username")
      .orderBy("avg_score", "desc")
      .orderBy("win_rate", "desc");

    return leaderboards;
  }

  static async getTopRankingOfFriendByUserId_GameId(userId, gameId) {
    const leaderboards = await db("play_history")
      .join("games", "games.id", "play_history.game_id")
      .join("users", "users.id", "play_history.user_id")
      .join("friendships", function () {
        this.on("friendships.requester_id", "=", "play_history.user_id").orOn("friendships.addressee_id", "=", "play_history.user_id");
      })
      .where("friendships.status", "accepted")
      .andWhere(function () {
        this.where("friendships.requester_id", userId).orWhere("friendships.addressee_id", userId);
      })
      .andWhere("play_history.game_id", gameId)
      .select(
        "users.username as name",
        "users.avatar_url as avatar_url",
        db.raw("COUNT(*) as played"),
        db.raw("MAX(play_history.score) as record"),
        db.raw("AVG(play_history.score)::INTEGER as avg_score"),
        db.raw("SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END) as wins"),
        db.raw("ROUND(SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1) as win_rate"),
      )
      .groupBy("users.id", "users.username", "users.avatar_url")
      .orderBy("avg_score", "desc")
      .orderBy("win_rate", "desc")
      .limit(10);

    return leaderboards;
    // return await db("leaderboards")
    //   .join("users", "users.id", "leaderboards.user_id")
    //   .join("friendships", function () {
    //     this.on("friendships.requester_id", "=", "leaderboards.user_id").orOn("friendships.addressee_id", "=", "leaderboards.user_id");
    //   })
    //   .join("games", "games.id", "leaderboards.game_id")
    //   .where("friendships.status", "accepted")
    //   .andWhere(function () {
    //     this.where("friendships.requester_id", userId).orWhere("friendships.addressee_id", userId);
    //   })
    //   .andWhere("leaderboards.game_id", gameId)
    //   .orderBy("leaderboards.high_score", "desc")
    //   .limit(10)
    //   .select(
    //     "leaderboards.id as leaderboard_id",
    //     "leaderboards.high_score",
    //     "leaderboards.achieved_at",
    //     "users.id as user_id",
    //     "users.username",
    //     "users.avatar_url",
    //     "games.id as game_id",
    //     "games.slug as game_slug",
    //     "games.name as game_name",
    //   );
  }

  static async getTopRankingOfFriendByUserId(userId) {
    const leaderboards = await db("play_history")
      .join("games", "games.id", "play_history.game_id")
      .join("users", "users.id", "play_history.user_id")
      .join("friendships", function () {
        this.on("friendships.requester_id", "=", "play_history.user_id").orOn("friendships.addressee_id", "=", "play_history.user_id");
      })
      .where("friendships.status", "accepted")
      .andWhere(function () {
        this.where("friendships.requester_id", userId).orWhere("friendships.addressee_id", userId);
      })
      .select(
        "users.username as name",
        "users.avatar_url as avatar_url",
        db.raw("COUNT(*) as played"),
        db.raw("MAX(play_history.score) as record"),
        db.raw("AVG(play_history.score)::INTEGER as avg_score"),
        db.raw("SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END) as wins"),
        db.raw("ROUND(SUM(CASE WHEN play_history.score = 1 THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1) as win_rate"),
      )
      .groupBy("users.id", "users.username", "users.avatar_url")
      .orderBy("avg_score", "desc")
      .orderBy("win_rate", "desc")
      .limit(10);

    return leaderboards;
  }
}

module.exports = LeaderboardsModel;
