/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Lấy danh sách users và games
  const users = await knex("users").select("id").limit(5);
  const games = await knex("games").select("id");

  if (users.length === 0 || games.length === 0) {
    console.log("⚠️ No users or games found. Skipping game_logs seed.");
    return;
  }

  // Tạo game logs cho 7 ngày gần nhất
  const gameLogs = [];
  const now = new Date();

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Random 0-5 lượt chơi mỗi giờ
      const playsThisHour = Math.floor(Math.random() * 6);

      for (let play = 0; play < playsThisHour; play++) {
        const playDate = new Date(now);
        playDate.setDate(playDate.getDate() - day);
        playDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomGame = games[Math.floor(Math.random() * games.length)];

        gameLogs.push({
          user_id: randomUser.id,
          game_id: randomGame.id,
          played_at: playDate,
          score: Math.floor(Math.random() * 1000),
          duration: Math.floor(Math.random() * 600) + 60, // 60-660 seconds
        });
      }
    }
  }

  // Insert batch
  if (gameLogs.length > 0) {
    await knex("game_logs").del(); // Clear existing
    await knex("game_logs").insert(gameLogs);
    console.log(`✅ Inserted ${gameLogs.length} game logs`);
  }
};
