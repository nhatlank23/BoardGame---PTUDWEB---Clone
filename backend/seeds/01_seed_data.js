const bcrypt = require("bcryptjs");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // 0. Xóa dữ liệu cũ theo thứ tự ngược lại để tránh lỗi Foreign Key
  await knex("user_achievements").del();
  await knex("achievements").del();
  await knex("leaderboards").del();
  await knex("messages").del();
  await knex("friendships").del();
  await knex("game_logs").del();
  await knex("play_history").del();
  await knex("game_sessions").del();
  await knex("games").del();
  await knex("users").del();

  const hashedPassword = await bcrypt.hash("123456", 10);

  // 1. SEED USERS (5 users)
  const userIds = [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003",
    "550e8400-e29b-41d4-a716-446655440004",
  ];

  await knex("users").insert([
    { id: userIds[0], username: "admin_lan", email: "lan@hcmus.edu.vn", password_hash: hashedPassword, role: "admin" },
    { id: userIds[1], username: "tuan_pro", email: "tuan@gmail.com", password_hash: hashedPassword, role: "player" },
    { id: userIds[2], username: "minh_retro", email: "minh@gmail.com", password_hash: hashedPassword, role: "player" },
    { id: userIds[3], username: "hoang_caro", email: "hoang@gmail.com", password_hash: hashedPassword, role: "player" },
    { id: userIds[4], username: "linh_snake", email: "linh@gmail.com", password_hash: hashedPassword, role: "player" },
  ]);

  // 2. SEED GAMES (5 games)
  const games = await knex("games")
    .insert([
      { slug: "caro-5", name: "Caro 5 in a Row", config: JSON.stringify({ rows: 15, cols: 15, win: 5 }) },
      { slug: "snake", name: "Classic Snake", config: JSON.stringify({ speed: 100 }) },
      { slug: "tetris", name: "Retro Tetris", config: JSON.stringify({ level: 1 }) },
      { slug: "minesweeper", name: "Minesweeper", config: JSON.stringify({ bombs: 10 }) },
      { slug: "match-3", name: "Match 3 Candy", config: JSON.stringify({ moves: 20 }) },
    ])
    .returning("id");

  const gameIds = games.map((g) => g.id);

  // 3. SEED FRIENDSHIPS (5 quan hệ)
  await knex("friendships").insert([
    { requester_id: userIds[1], addressee_id: userIds[2], status: "accepted" },
    { requester_id: userIds[1], addressee_id: userIds[3], status: "pending" },
    { requester_id: userIds[2], addressee_id: userIds[4], status: "accepted" },
    { requester_id: userIds[3], addressee_id: userIds[4], status: "declined" },
    { requester_id: userIds[0], addressee_id: userIds[1], status: "accepted" },
  ]);

  // 4. SEED PLAY HISTORY (5 lượt chơi)
  await knex("play_history").insert([
    { user_id: userIds[1], game_id: gameIds[0], score: 100, duration: 300 },
    { user_id: userIds[2], game_id: gameIds[1], score: 50, duration: 120 },
    { user_id: userIds[1], game_id: gameIds[1], score: 85, duration: 200 },
    { user_id: userIds[3], game_id: gameIds[2], score: 1200, duration: 600 },
    { user_id: userIds[4], game_id: gameIds[3], score: 30, duration: 45 },
  ]);

  // 5. SEED LEADERBOARDS (5 kỷ lục)
  await knex("leaderboards").insert([
    { user_id: userIds[1], game_id: gameIds[0], high_score: 150 },
    { user_id: userIds[2], game_id: gameIds[1], high_score: 90 },
    { user_id: userIds[3], game_id: gameIds[2], high_score: 2500 },
    { user_id: userIds[4], game_id: gameIds[3], high_score: 10 },
    { user_id: userIds[1], game_id: gameIds[4], high_score: 5000 },
    { user_id: userIds[1], game_id: gameIds[4], high_score: 7000 },
  ]);

  // 6. SEED MESSAGES (thêm tin nhắn để test chat)
  await knex("messages").insert([
    // conversation between userIds[1] and userIds[2]
    { sender_id: userIds[1], receiver_id: userIds[2], content: "Chào ông, làm ván Caro không?", created_at: new Date("2026-01-10T09:00:00Z") },
    { sender_id: userIds[2], receiver_id: userIds[1], content: "Ok luôn, đợi tí tui tạo phòng.", created_at: new Date("2026-01-10T09:01:00Z") },
    { sender_id: userIds[1], receiver_id: userIds[2], content: "Sẵn sàng, mấy giờ chơi?", created_at: new Date("2026-01-10T09:02:00Z") },
    { sender_id: userIds[2], receiver_id: userIds[1], content: "10 phút nữa nhé.", created_at: new Date("2026-01-10T09:03:00Z") },
    { sender_id: userIds[1], receiver_id: userIds[2], content: "Ok, đang chuẩn bị.", created_at: new Date("2026-01-10T09:04:00Z") },
    { sender_id: userIds[2], receiver_id: userIds[1], content: "Tui vừa tạo phòng: ROOM123", created_at: new Date("2026-01-10T09:05:00Z") },

    // other messages
    { sender_id: userIds[1], receiver_id: userIds[0], content: "Admin ơi, game Snake bị lag.", created_at: new Date("2026-01-09T08:00:00Z") },
    { sender_id: userIds[3], receiver_id: userIds[4], content: "Điểm cao thế!", created_at: new Date("2026-01-08T12:00:00Z") },
    { sender_id: userIds[4], receiver_id: userIds[3], content: "Hên thôi ông ơi.", created_at: new Date("2026-01-08T12:01:00Z") },
  ]);

  // 7. SEED ACHIEVEMENTS (5 danh hiệu)
  const achievementIds = await knex("achievements")
    .insert([
      {
        name: "Newbie",
        description: "Chơi ván game đầu tiên",
        icon_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/achievement_icon/newbie.png",
      },
      {
        name: "Winner",
        description: "Thắng 10 ván Caro",
        icon_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/achievement_icon/success.png",
      },
      {
        name: "Snake Master",
        description: "Đạt 100 điểm game Snake",
        icon_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/achievement_icon/snake.png",
      },
      {
        name: "Social Star",
        description: "Có 5 người bạn",
        icon_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/achievement_icon/friendship.png",
      },
      {
        name: "Pro Player",
        description: "Lọt top 1 bảng xếp hạng",
        icon_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/achievement_icon/number-one.png",
      },
    ])
    .returning("id");

  // 8. SEED USER ACHIEVEMENTS
  await knex("user_achievements").insert([
    { user_id: userIds[1], achievement_id: achievementIds[0].id },
    { user_id: userIds[1], achievement_id: achievementIds[1].id },
    { user_id: userIds[2], achievement_id: achievementIds[0].id },
    { user_id: userIds[3], achievement_id: achievementIds[4].id },
    { user_id: userIds[4], achievement_id: achievementIds[2].id },
  ]);

  // 9. SEED GAME SESSIONS (5 session đang chơi dở)
  await knex("game_sessions").insert([
    {
      user_id: userIds[1],
      game_id: gameIds[0],
      current_score: 10,
      matrix_state: JSON.stringify([
        [0, 1],
        [1, 0],
      ]),
    },
    { user_id: userIds[2], game_id: gameIds[1], current_score: 5, matrix_state: JSON.stringify({ snake: [1, 2, 3] }) },
    { user_id: userIds[3], game_id: gameIds[2], current_score: 100, matrix_state: JSON.stringify({}) },
    { user_id: userIds[4], game_id: gameIds[3], current_score: 2, matrix_state: JSON.stringify({}) },
    { user_id: userIds[0], game_id: gameIds[0], current_score: 0, matrix_state: JSON.stringify({}) },
  ]);

  // 10. SEED GAME LOGS (activity logs for hourly chart)
  const gameLogs = [];
  const today = new Date("2026-01-17");

  // Generate logs for different hours throughout the day
  for (let hour = 0; hour < 24; hour++) {
    const logsInHour = Math.floor(Math.random() * 15) + 5; // 5-20 logs per hour
    for (let i = 0; i < logsInHour; i++) {
      const minute = Math.floor(Math.random() * 60);
      const playedAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
      const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
      const randomGameId = gameIds[Math.floor(Math.random() * gameIds.length)];
      const randomScore = Math.floor(Math.random() * 1000) + 10;
      const randomDuration = Math.floor(Math.random() * 300) + 30;

      gameLogs.push({
        user_id: randomUserId,
        game_id: randomGameId,
        played_at: playedAt,
        score: randomScore,
        duration: randomDuration,
      });
    }
  }

  await knex("game_logs").insert(gameLogs);
};
