const bcrypt = require("bcryptjs");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
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
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc16",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc17",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc18",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc19",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc20",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc21",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc22",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc23",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc24",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc25",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc26",
    "4f38b1ff-8a6a-45f4-8bcc-9f1f9be8bc27"
  ];

  await knex("users").insert([
    { id: userIds[0], username: "Admin", email: "admin@gmail.com", password_hash: hashedPassword, role: "admin", avatar_url: null },
    { id: userIds[1], username: "Huy Gamer", email: "tuan@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/550e8400-e29b-41d4-a716-446655440001/9c8f11eb-18af-4f28-be75-3888e48d22e5.png" },
    { id: userIds[2], username: "Nam Gamer", email: "minh@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/550e8400-e29b-41d4-a716-446655440002/56296990-f1a9-4295-b1c8-c0acaa8c2c3d.jpg" },
    { id: userIds[3], username: "Thảo vipro", email: "hoang@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/550e8400-e29b-41d4-a716-446655440003/38f2e02f-4bc3-47d1-8110-cbd7242fe32d.jpg" },
    { id: userIds[4], username: "Linh speed", email: "linh@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/vv1/object/public/avatar/550e8400-e29b-41d4-a716-446655440004/5f57bb85-a84a-426d-8ca1-b6b422900665.jpg" },
    { id: userIds[5], username: "Huy caro", email: "l@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/66b2e4ad-7621-4877-aaee-9ead46878666/de800472-d92c-45b9-ab8a-a7f6ef0a910f.jpg" },
    { id: userIds[6], username: "Nam top 1", email: "z@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/7162d89c-9a3d-4dca-b21d-af9d73b660a5/89f21b24-c1af-4985-a1fd-6cffd6bac160.jpg" },
    { id: userIds[7], username: "Minh top 1", email: "chanelhynvuigames@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/7d771011-6967-453d-9b99-25a3ef015801/7e0709a0-1ab9-48ff-ba60-ba01bf281796.png" },
    { id: userIds[8], username: "Lân Vipro", email: "lann99194@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/a81eddd6-5013-418e-828d-05ff255b2c1b/de9ae502-997a-4eb0-adf0-415abb545cb6.jpg" },
    { id: userIds[9], username: "Như Gamer", email: "thachnhu@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/dadcc0b7-499c-4dc6-abdf-80ca82b9b60a/098e0483-9106-4a8a-8c27-fe47a87e8f09.jpg" },
    { id: userIds[10], username: "Thạch Như", email: "23120312@student.hcmus.edu.vn", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/db9219bd-835f-4f65-b7df-635f4be2a5a2/6824f283-e6e3-4fc0-a27a-36f165e7be66.png" },
    { id: userIds[11], username: "Lộc Gaming", email: "nakrothnguyen127@gmail.com", password_hash: hashedPassword, role: "player", avatar_url: "https://fhzjvozcnwusnezbezkp.supabase.co/storage/v1/object/public/avatar/f96d825c-9283-4efb-ba59-c0c6119fa56e/c8aa1145-208c-4aed-8879-302d5db023b5.jpg" }
  ])

  // 2. SEED GAMES (7 games)
  const games = await knex("games")
    .insert([
      {
        slug: "caro-5",
        name: "Caro 5 in a Row",
        is_active: true,
        config: JSON.stringify({ win: 5, cols: 15, rows: 15, times: [3, 5, 10] })
      },
      {
        slug: "snake",
        name: "Classic Snake",
        is_active: true,
        config: JSON.stringify({ cols: 20, rows: 20, speed: 5, times: [5, 10, 20] })
      },
      {
        slug: "tic-tac-toe",
        name: "Tic tac toe",
        is_active: true,
        config: JSON.stringify({ win: 3, cols: 3, rows: 3, times: [3, 5, 10] })
      },
      {
        slug: "drawing",
        name: "Drawing",
        is_active: true,
        config: JSON.stringify({
          cols: 10,
          rows: 10,
          times: [5, 10, 15],
          colors: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF"],
          default_color: "#FFFFFF"
        })
      },
      {
        slug: "match-3",
        name: "Match 3 Candy",
        is_active: true,
        config: JSON.stringify({ cols: 10, rows: 10, times: [5, 10, 20] })
      },
      {
        slug: "caro-4",
        name: "Caro 4 in a Row",
        is_active: true,
        config: JSON.stringify({ win: 4, cols: 20, rows: 20, times: [2, 3, 10] })
      },
      {
        slug: "memory",
        name: "Memory",
        is_active: true,
        config: JSON.stringify({ cols: 4, rows: 4, pairs: 8, times: [2, 5, 10] })
      }
    ])
    .returning("id");

  const gameIds = games.map((g) => g.id);

  // 3. SEED FRIENDSHIPS (5 quan hệ)
  await knex("friendships").insert([
    { requester_id: userIds[11], addressee_id: userIds[2], status: "accepted" },
    { requester_id: userIds[11], addressee_id: userIds[3], status: "accepted" },
    { requester_id: userIds[11], addressee_id: userIds[4], status: "accepted" },
    { requester_id: userIds[11], addressee_id: userIds[5], status: "accepted" },
    { requester_id: userIds[11], addressee_id: userIds[6], status: "accepted" },
    { requester_id: userIds[2], addressee_id: userIds[7], status: "accepted" },
    { requester_id: userIds[3], addressee_id: userIds[8], status: "accepted" },
    { requester_id: userIds[4], addressee_id: userIds[9], status: "accepted" },
    { requester_id: userIds[5], addressee_id: userIds[10], status: "accepted" },
  ]);

  // 4. SEED PLAY HISTORY (100 lượt chơi)
  const histories = [];
  const gameConfigs = [
    { id: gameIds[0], slug: "caro-5", type: "win-loss" },
    { id: gameIds[1], slug: "snake", type: "points" },
    { id: gameIds[2], slug: "tic-tac-toe", type: "win-loss" },
    { id: gameIds[3], slug: "drawing", type: "points" },
    { id: gameIds[4], slug: "match-3", type: "points" },
    { id: gameIds[5], slug: "caro-4", type: "win-loss" },
    { id: gameIds[6], slug: "memory", type: "points" },
  ];

  for (let i = 0; i < 100; i++) {
    const randomUserIdx = Math.floor(Math.random() * userIds.length);
    const randomGame = gameConfigs[Math.floor(Math.random() * gameConfigs.length)];

    let score;
    if (randomGame.type === "win-loss") {
      // Score là -1, 0, 1
      const results = [-1, 0, 1];
      score = results[Math.floor(Math.random() * results.length)];
    } else {
      // Score là điểm số (ví dụ 10 - 2000)
      score = Math.floor(Math.random() * 1000) + 10;
    }

    histories.push({
      user_id: userIds[randomUserIdx],
      game_id: randomGame.id,
      score: score,
      duration: Math.floor(Math.random() * 500) + 30,
      played_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000))
    });
  }

  // Thêm các trận thắng cụ thể cho Lộc Gaming và Minh Top 1 để lấy thành tích
  histories.push(
    { user_id: userIds[11], game_id: gameIds[0], score: 1, duration: 120 }, // Lộc thắng Caro 5
    { user_id: userIds[7], game_id: gameIds[1], score: 2500, duration: 300 }, // Minh top 1 kỷ lục Snake
    { user_id: userIds[11], game_id: gameIds[5], score: 1, duration: 400 }   // Lộc thắng Caro 4
  );

  await knex("play_history").insert(histories);

  // 5. SEED LEADERBOARDS (Tự động tính từ lịch sử chơi)
  const leaderboardMap = new Map();
  histories.forEach(h => {
    const key = `${h.user_id}_${h.game_id}`;
    if (!leaderboardMap.has(key) || h.score > leaderboardMap.get(key).high_score) {
      leaderboardMap.set(key, {
        user_id: h.user_id,
        game_id: h.game_id,
        high_score: h.score,
        achieved_at: h.created_at
      });
    }
  });

  const leaderboards = Array.from(leaderboardMap.values());
  if (leaderboards.length > 0) {
    await knex("leaderboards").insert(leaderboards);
  }

  // 6. SEED MESSAGES (thêm tin nhắn để test chat)
  const locId = userIds[11];
  const namId = userIds[2];

  const chatData = [
    // Ngày 18/01 - Bàn về AI Caro
    { s: locId, r: namId, c: "Nam ơi, ông thấy con AI cấp Hard của game mình sao?", t: "2026-01-18T10:00:00Z" },
    { s: namId, r: locId, c: "Khó vãi chưởng, tui đánh nãy giờ toàn thua đường chéo.", t: "2026-01-18T10:01:30Z" },
    { s: locId, r: namId, c: "Tui mới sửa lại cái trọng số phòng thủ, giờ nó chặn hàng 3 gắt lắm.", t: "2026-01-18T10:02:45Z" },
    { s: namId, r: locId, c: "Hèn chi, tui định giăng bẫy mà nó nhìn ra hết trơn.", t: "2026-01-18T10:04:00Z" },
    { s: locId, r: namId, c: "Ông thử tập trung cao độ xem có thắng được nó không? 😂", t: "2026-01-18T10:05:20Z" },
    { s: namId, r: locId, c: "Tui là người chơi chứ có phải máy đâu mà dùng thuật toán!", t: "2026-01-18T10:06:10Z" },

    // Ngày 19/01 - Thách đấu Snake
    { s: namId, r: locId, c: "Mới phá kỷ lục Snake của ông nè, 200 điểm nhé!", t: "2026-01-19T14:20:00Z" },
    { s: locId, r: namId, c: "Ảo thật, ông chơi bản tốc độ mấy đó?", t: "2026-01-19T14:21:15Z" },
    { s: namId, r: locId, c: "Tốc độ 5 luôn, nhanh vù vù.", t: "2026-01-19T14:22:30Z" },
    { s: locId, r: namId, c: "Đợi đó, chiều nay tui lấy lại Top 1 cho xem.", t: "2026-01-19T14:24:00Z" },
    { s: namId, r: locId, c: "Lên đi, tui đợi. Đừng có để đâm đầu vào tường sớm quá nha.", t: "2026-01-19T14:25:45Z" },
    { s: locId, r: namId, c: "Kaka, yên tâm, tay lái lụa lắm.", t: "2026-01-19T14:27:00Z" },

    // Ngày 20/01 - Sáng: Bàn về UI/UX
    { s: locId, r: namId, c: "Nam, ông thấy cái Dark Mode mới cập nhật nhìn ổn không?", t: "2026-01-20T08:00:00Z" },
    { s: namId, r: locId, c: "Đẹp đó, nhìn dịu mắt hơn hẳn cái bản sáng màu.", t: "2026-01-20T08:02:00Z" },
    { s: locId, r: namId, c: "Ừ, tui cũng định chỉnh lại mấy cái icon Achievement cho nó 3D tí.", t: "2026-01-20T08:04:30Z" },
    { s: namId, r: locId, c: "Dùng bộ icon Icons8 tui gửi hôm qua chưa?", t: "2026-01-20T08:06:00Z" },
    { s: locId, r: namId, c: "Rồi, nhìn chuyên nghiệp hơn hẳn.", t: "2026-01-20T08:08:00Z" },

    // Ngày 20/01 - Trưa: Thách đấu trực tiếp
    { s: namId, r: locId, c: "Vào làm ván Caro không? Tui vừa tìm ra cách thắng AI rồi.", t: "2026-01-20T11:30:00Z" },
    { s: locId, r: namId, c: "Ok, đợi tui 2 phút, đang dọn nốt cái database.", t: "2026-01-20T11:31:45Z" },
    { s: namId, r: locId, c: "Nhanh nha, tui tạo phòng Caro 5 rồi đó.", t: "2026-01-20T11:33:00Z" },
    { s: locId, r: namId, c: "Phòng tên gì?", t: "2026-01-20T11:34:20Z" },
    { s: namId, r: locId, c: "LOC_GAMING_NOOB 😂", t: "2026-01-20T11:35:10Z" },
    { s: locId, r: namId, c: "Vãi, ông đặt tên khịa tui à? Đợi đó!", t: "2026-01-20T11:36:00Z" },
    { s: namId, r: locId, c: "Haha, vào đi rồi biết ai Noob.", t: "2026-01-20T11:37:30Z" },

    // Chiều nay - Sau trận đấu
    { s: locId, r: namId, c: "Cay quá, nãy tui sơ hở tí thôi.", t: "2026-01-20T13:00:00Z" },
    { s: namId, r: locId, c: "Thắng là thắng, thua là thua nha ông.", t: "2026-01-20T13:02:00Z" },
    { s: locId, r: namId, c: "Ván sau tui dùng nút HINT cho ông xem sức mạnh máy tính.", t: "2026-01-20T13:04:00Z" },
    { s: namId, r: locId, c: "Chơi ăn gian vậy ai chơi lại!", t: "2026-01-20T13:05:30Z" },
    { s: locId, r: namId, c: "Nút đó sinh ra để dùng mà haha.", t: "2026-01-20T13:07:00Z" },
    { s: namId, r: locId, c: "Thôi nghỉ tí đi, tí còn check lại game Match-3.", t: "2026-01-20T13:10:00Z" },
    { s: locId, r: namId, c: "Ok, 15h gặp lại trên Hub nhé.", t: "2026-01-20T13:12:00Z" },
    { s: namId, r: locId, c: "Gút chóp!", t: "2026-01-20T13:15:00Z" },
  ];

  await knex("messages").insert(chatData.map(d => ({
    sender_id: d.s,
    receiver_id: d.r,
    content: d.c,
    created_at: new Date(d.t)
  })));

  // 7. SEED ACHIEVEMENTS
  const insertedAchievements = await knex("achievements")
    .insert([
      { name: "First Blood", description: "Hoàn thành ván game đầu tiên", icon_url: "https://img.icons8.com/color/96/trophy.png" },
      { name: "AI Crusher", description: "Đánh bại AI cấp độ KHÓ trong Caro 5", icon_url: "https://img.icons8.com/color/96/artificial-intelligence.png" },
      { name: "Quadrant Hunter", description: "Thắng Caro 4 dưới 15 nước đi", icon_url: "https://img.icons8.com/color/96/target-mark.png" },
      { name: "Ouroboros", description: "Đạt chiều dài rắn trên 50 đơn vị", icon_url: "https://img.icons8.com/color/96/snake.png" },
      { name: "The Wall", description: "Hòa 5 ván liên tiếp với AI khó trong Tic-tac-toe", icon_url: "https://img.icons8.com/color/96/shield.png" },
      { name: "Picasso", description: "Sử dụng tất cả 7 màu trong Drawing", icon_url: "https://img.icons8.com/color/96/paint-palette.png" },
      { name: "Sugar Rush", description: "Đạt trên 2000 điểm trong Match-3", icon_url: "https://img.icons8.com/color/96/candy.png" },
      { name: "Memory God", description: "Hoàn thành Memory với sai dưới 3 lần", icon_url: "https://img.icons8.com/color/96/brain.png" },
      { name: "Top of the World", description: "Giữ vị trí số 1 trên Leaderboard", icon_url: "https://img.icons8.com/color/96/crown.png" }
    ])
    .returning("id");

  const aIds = insertedAchievements.map(a => typeof a === 'object' ? a.id : a);

  // 8. SEED USER ACHIEVEMENTS 
  await knex("user_achievements").insert([
    { user_id: userIds[11], achievement_id: aIds[0] },
    { user_id: userIds[11], achievement_id: aIds[1] },
    { user_id: userIds[11], achievement_id: aIds[2] },
    { user_id: userIds[11], achievement_id: aIds[3] },
    { user_id: userIds[11], achievement_id: aIds[4] },
    { user_id: userIds[11], achievement_id: aIds[5] },
    { user_id: userIds[11], achievement_id: aIds[6] },
    { user_id: userIds[11], achievement_id: aIds[7] },
    { user_id: userIds[11], achievement_id: aIds[8] },
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
  const today = new Date('2026-01-17');
  for (let hour = 0; hour < 24; hour++) {
    const logsInHour = Math.floor(Math.random() * 15) + 5;
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

  // 11. SEED GAME REVIEWS 
  await knex("game_reviews").del();

  const dbGames = await knex("games").select("id", "slug");
  const gameMap = {};
  dbGames.forEach(g => gameMap[g.slug] = g.id);

  const reviews = [
    // Review cho Caro 5 (Tập trung khen AI)
    { user_id: userIds[11], game_id: gameMap["caro-5"], rating: 5, comment: "AI đánh quá gắt, không thể tìm được kẽ hở luôn!" },
    { user_id: userIds[2], game_id: gameMap["caro-5"], rating: 4, comment: "Game hay, nhưng AI đôi khi chặn đường chéo hơi khó chịu 😂" },
    { user_id: userIds[9], game_id: gameMap["caro-5"], rating: 5, comment: "Giao diện bàn cờ 10x10 nhìn rất rõ ràng." },

    // Review cho Snake
    { user_id: userIds[4], game_id: gameMap["snake"], rating: 5, comment: "Tốc độ 5 chơi phê thật sự, cảm giác rất mượt." },
    { user_id: userIds[11], game_id: gameMap["snake"], rating: 3, comment: "Thỉnh thoảng bị lag nhẹ khi rắn quá dài, Admin check lại nhé." },

    // Review cho Memory
    { user_id: userIds[7], game_id: gameMap["memory"], rating: 5, comment: "Hình ảnh các thẻ bài rất đẹp, rèn luyện trí nhớ tốt." },
    { user_id: userIds[10], game_id: gameMap["memory"], rating: 4, comment: "Âm thanh khi lật bài nghe rất vui tai." },

    // Review cho Drawing
    { user_id: userIds[11], game_id: gameMap["drawing"], rating: 5, comment: "Bộ màu 7 màu rất rực rỡ, vẽ trên ma trận LED nhìn lạ mắt." },
    { user_id: userIds[1], game_id: gameMap["drawing"], rating: 4, comment: "Ước gì có thêm nút tẩy thì hoàn hảo hơn." },

    // Review cho Match-3
    { user_id: userIds[9], game_id: gameMap["match-3"], rating: 5, comment: "Game gây nghiện quá, chơi nãy giờ không dứt ra được." },
    { user_id: userIds[8], game_id: gameMap["match-3"], rating: 5, comment: "Combo nổ kẹo nhìn sướng mắt thật sự!" },

    // Review cho Caro 4 & Tic-tac-toe
    { user_id: userIds[6], game_id: gameMap["caro-4"], rating: 4, comment: "Chế độ chơi nhanh rất phù hợp để giải trí ngắn." },
    { user_id: userIds[3], game_id: gameMap["tic-tac-toe"], rating: 3, comment: "Game này dễ hòa quá, AI đánh thủ chắc quá trời." }
  ];

  await knex("game_reviews").insert(reviews.map(r => ({
    ...r,
    created_at: new Date(),
    updated_at: new Date()
  })));
};
