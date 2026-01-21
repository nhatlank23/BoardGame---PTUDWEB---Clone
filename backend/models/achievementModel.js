const db = require("../configs/db");

class AchievementModel {
  /**
   * Get all achievements in the system
   */
  static async getAllAchievements() {
    return await db("achievements")
      .select("id", "name", "description", "icon_url")
      .orderBy("id", "asc");
  }

  /**
   * Get user achievements with details
   */
  static async getUserAchievements(userId, page = 1, pageSize = 50) {
    return await db("achievements")
      .join("user_achievements", "achievements.id", "user_achievements.achievement_id")
      .where("user_achievements.user_id", userId)
      .select(
        "achievements.id",
        "achievements.name",
        "achievements.description",
        "achievements.icon_url",
        "user_achievements.earned_at"
      )
      .orderBy("user_achievements.earned_at", "desc")
      .limit(pageSize)
      .offset((page - 1) * pageSize);
  }

  /**
   * Check and award achievement if user doesn't have it
   */
  static async unlockAchievement(userId, achievementName) {
    try {
      // Get achievement ID by name
      const achievement = await db("achievements")
        .where("name", achievementName)
        .first();

      if (!achievement) {
        console.log(`Achievement "${achievementName}" not found`);
        return null;
      }

      // Check if user already has this achievement
      const existing = await db("user_achievements")
        .where({ user_id: userId, achievement_id: achievement.id })
        .first();

      if (existing) {
        return null; // Already has it
      }

      // Award achievement
      await db("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

      console.log(`✅ Achievement "${achievementName}" unlocked for user ${userId}`);
      return achievement;
    } catch (err) {
      console.error("Error unlocking achievement:", err);
      return null;
    }
  }

  /**
   * Check all achievements for a user after game completion
   */
  static async checkAndAwardAchievements(userId, gameSlug, gameData) {
    const achievements = [];

    // 1. First Blood - Complete first game
    const playCount = await db("play_history")
      .where("user_id", userId)
      .count("* as count")
      .first();

    if (parseInt(playCount.count) === 1) {
      const unlocked = await this.unlockAchievement(userId, "First Blood");
      if (unlocked) achievements.push(unlocked);
    }

    // 2. AI Crusher - Beat Hard AI in Caro 5
    if (gameSlug === "caro-5" && gameData.score === 1 && gameData.againstAI === "hard") {
      const unlocked = await this.unlockAchievement(userId, "AI Crusher");
      if (unlocked) achievements.push(unlocked);
    }

    // 3. Quadrant Hunter - Win Caro 4 in under 15 moves
    if (gameSlug === "caro-4" && gameData.score === 1 && gameData.moves && gameData.moves < 15) {
      const unlocked = await this.unlockAchievement(userId, "Quadrant Hunter");
      if (unlocked) achievements.push(unlocked);
    }

    // 4. Ouroboros - Snake length over 50
    if (gameSlug === "snake" && gameData.snakeLength && gameData.snakeLength > 50) {
      const unlocked = await this.unlockAchievement(userId, "Ouroboros");
      if (unlocked) achievements.push(unlocked);
    }

    // 5. The Wall - Draw 5 consecutive games with hard AI in Tic-tac-toe
    if (gameSlug === "tic-tac-toe" && gameData.score === 0 && gameData.againstAI === "hard") {
      const recentGames = await db("play_history")
        .where("user_id", userId)
        .join("games", "games.id", "play_history.game_id")
        .where("games.slug", "tic-tac-toe")
        .orderBy("play_history.played_at", "desc")
        .limit(5)
        .select("play_history.score");

      if (recentGames.length >= 5 && recentGames.every(g => g.score === 0)) {
        const unlocked = await this.unlockAchievement(userId, "The Wall");
        if (unlocked) achievements.push(unlocked);
      }
    }

    // 6. Picasso - Use all 7 colors in Drawing
    if (gameSlug === "drawing" && gameData.colorsUsed && gameData.colorsUsed.length >= 7) {
      const unlocked = await this.unlockAchievement(userId, "Picasso");
      if (unlocked) achievements.push(unlocked);
    }

    // 7. Sugar Rush - Score over 2000 in Match-3
    if (gameSlug === "match-3" && gameData.score > 2000) {
      const unlocked = await this.unlockAchievement(userId, "Sugar Rush");
      if (unlocked) achievements.push(unlocked);
    }

    // 8. Memory God - Complete Memory with less than 3 mistakes
    if (gameSlug === "memory" && gameData.mistakes !== undefined && gameData.mistakes < 3) {
      const unlocked = await this.unlockAchievement(userId, "Memory God");
      if (unlocked) achievements.push(unlocked);
    }

    // 9. Top of the World - Hold #1 position on Leaderboard (check for any game)
    const gameId = await db("games").where("slug", gameSlug).first();
    if (gameId) {
      const topPlayer = await db("leaderboards")
        .where("game_id", gameId.id)
        .orderBy("high_score", "desc")
        .first();

      if (topPlayer && topPlayer.user_id === userId) {
        const unlocked = await this.unlockAchievement(userId, "Top of the World");
        if (unlocked) achievements.push(unlocked);
      }
    }

    return achievements;
  }
}

module.exports = AchievementModel;
