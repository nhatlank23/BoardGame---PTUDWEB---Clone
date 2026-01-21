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
    // --- NGÀY 18/01: TRẬN CHIẾN CARO MỞ MÀN ---
    // Bắt đầu rủ rê
    { s: namId, r: locId, c: "Ê Lộc, rảnh không vào làm vài ván Caro?", t: "2026-01-18T19:30:00Z" },
    { s: locId, r: namId, c: "Đang rảnh nè, tạo phòng đi ông.", t: "2026-01-18T19:30:45Z" },
    { s: namId, r: locId, c: "Phòng số 1, pass 123 nhé. Vào lẹ.", t: "2026-01-18T19:31:10Z" },
    { s: locId, r: namId, c: "Rồi đó, start đi.", t: "2026-01-18T19:31:30Z" },

    // Trong trận đấu
    { s: namId, r: locId, c: "Nước này ông đi sai rồi, toang chưa con trai =))", t: "2026-01-18T19:35:00Z" },
    { s: locId, r: namId, c: "Khoan, nãy lỡ tay bấm nhầm ô, cho đi lại đi 🥺", t: "2026-01-18T19:35:15Z" },
    { s: namId, r: locId, c: "Mơ đi cưng, bút sa gà chết.", t: "2026-01-18T19:35:40Z" },
    { s: locId, r: namId, c: "Ác vãi. Đợi đấy tui chặn đầu này.", t: "2026-01-18T19:36:00Z" },
    { s: namId, r: locId, c: "Chặn đầu này thì tui đi đầu kia, 4 nước rồi, đỡ sao nổi.", t: "2026-01-18T19:36:30Z" },
    { s: locId, r: namId, c: "Cay thế nhờ!!! Ván nữa, ván này nháp.", t: "2026-01-18T19:37:00Z" },

    // Đổ thừa hoàn cảnh
    { s: namId, r: locId, c: "Nháp gì mà 3 ván thua thông rồi cha.", t: "2026-01-18T19:45:00Z" },
    { s: locId, r: namId, c: "Tại con chuột nay nó bị double click á, chứ trình ông sao ăn tui được.", t: "2026-01-18T19:45:45Z" },
    { s: namId, r: locId, c: "Thôi văn vở quá, nghỉ nha, đi ăn cơm.", t: "2026-01-18T19:46:10Z" },
    { s: locId, r: namId, c: "Chạy sớm thế? Sợ thua à? Ok bai.", t: "2026-01-18T19:46:30Z" },

    // --- NGÀY 19/01: ĐUA TOP SNAKE (RẮN SĂN MỒI) ---
    // Khoe điểm
    { s: locId, r: namId, c: "Nam ơi, vào check bảng xếp hạng Snake đi. Hết hồn chưa? 😎", t: "2026-01-19T10:15:00Z" },
    { s: namId, r: locId, c: "Gì? Ông cày lên 500 điểm á? Hack à?", t: "2026-01-19T10:16:20Z" },
    { s: locId, r: namId, c: "Hack gì, tay to đấy. Cày cả buổi sáng nay.", t: "2026-01-19T10:17:00Z" },
    { s: namId, r: locId, c: "Ghê đấy. Để tui vào đua thử.", t: "2026-01-19T10:18:00Z" },

    // Quá trình leo rank
    { s: namId, r: locId, c: "Cái game này tốc độ tăng nhanh quá, mới 200 điểm mà rắn chạy như bay.", t: "2026-01-19T10:40:00Z" },
    { s: locId, r: namId, c: "Kaka, tập trung vào, đừng để đâm đầu vào tường.", t: "2026-01-19T10:41:15Z" },
    { s: namId, r: locId, c: "AAAA!!! Chết nhảm vãi. 490 điểm rồi mà bấm lộn nút xuống.", t: "2026-01-19T10:55:00Z" },
    { s: locId, r: namId, c: "Thiếu 10 điểm nữa thôi, cố lên bạn ei =))", t: "2026-01-19T10:55:40Z" },
    { s: namId, r: locId, c: "Tức cái lồng ngực. Tí trưa chơi tiếp, giờ đi học đã.", t: "2026-01-19T10:56:00Z" },

    // --- NGÀY 19/01: BUỔI TỐI (CHÉM GIÓ & TIC-TAC-TOE) ---
    { s: locId, r: namId, c: "Alo, ngủ chưa?", t: "2026-01-19T23:00:00Z" },
    { s: namId, r: locId, c: "Chưa, đang lướt TikTok. Sao đó?", t: "2026-01-19T23:00:30Z" },
    { s: locId, r: namId, c: "Vào Tic-tac-toe giải trí tí đi, game này nhanh.", t: "2026-01-19T23:01:00Z" },
    { s: namId, r: locId, c: "Tic-tac-toe toàn hòa chứ đánh đấm gì.", t: "2026-01-19T23:01:45Z" },
    { s: locId, r: namId, c: "Ai bảo ông thế, tui mới học được chiêu 'tam giác quỷ', chấp ông đi trước.", t: "2026-01-19T23:02:15Z" },
    { s: namId, r: locId, c: "Gáy sớm thì thường ăn gì biết rồi đấy. Vào đi.", t: "2026-01-19T23:03:00Z" },

    // Sau vài ván
    { s: namId, r: locId, c: "Đấy, đã bảo toàn hòa mà. Ông lừa tui à?", t: "2026-01-19T23:15:00Z" },
    { s: locId, r: namId, c: "Tại ông thủ kĩ quá thôi. Thôi đi ngủ, mai còn thi.", t: "2026-01-19T23:16:00Z" },
    { s: namId, r: locId, c: "Ok g9.", t: "2026-01-19T23:16:30Z" },

    // --- NGÀY 20/01: TRẬN CHIẾN SINH TỬ HÔM NAY ---
    // Sáng: Rủ rê rematch Caro
    { s: namId, r: locId, c: "Nay rảnh cả ngày, làm kèo BO5 (Best of 5) Caro không?", t: "2026-01-20T09:00:00Z" },
    { s: locId, r: namId, c: "Chơi luôn, sợ gì. Ai thua bao nước ngọt nhé.", t: "2026-01-20T09:01:00Z" },
    { s: namId, r: locId, c: "Chốt. Vào room cũ đi.", t: "2026-01-20T09:01:30Z" },

    // Ván 1
    { s: locId, r: namId, c: "Đánh lẹ đi ông, suy nghĩ gì mà như đánh cờ tướng thế.", t: "2026-01-20T09:05:00Z" },
    { s: namId, r: locId, c: "Từ từ, sai một ly đi một dặm. Ông hối là tui cuống đấy.", t: "2026-01-20T09:05:45Z" },
    { s: namId, r: locId, c: "Haha! Thấy nước đôi chưa? Chặn đằng trời.", t: "2026-01-20T09:08:00Z" },
    { s: locId, r: namId, c: "Ui xời, sơ suất quá. 1-0 cho ông.", t: "2026-01-20T09:08:30Z" },

    // Ván 2 & 3
    { s: namId, r: locId, c: "Sao nay đánh yếu thế? 2-0 rồi kìa.", t: "2026-01-20T09:15:00Z" },
    { s: locId, r: namId, c: "Đang khởi động thôi. Giờ mới đánh thật nè.", t: "2026-01-20T09:15:45Z" },
    { s: locId, r: namId, c: "Bùm! 4 con chéo, ông không nhìn ra à?", t: "2026-01-20T09:20:00Z" },
    { s: namId, r: locId, c: "Vãi, mải chặn hàng ngang không để ý. 2-1.", t: "2026-01-20T09:20:40Z" },

    // Ván quyết định
    { s: locId, r: namId, c: "2 đều rồi nha. Ván này chung kết.", t: "2026-01-20T09:40:00Z" },
    { s: namId, r: locId, c: "Tim đập nhanh quá :))", t: "2026-01-20T09:40:30Z" },
    { s: locId, r: namId, c: "Lag quá ông ơi, server bị gì vậy, tui không đặt cờ được!", t: "2026-01-20T09:45:00Z" },
    { s: namId, r: locId, c: "Bên tui bình thường mà. Hay mạng nhà ông yếu?", t: "2026-01-20T09:45:30Z" },
    { s: locId, r: namId, c: "Mất kết nối luôn rồi... Thôi hòa nha, ván này không tính.", t: "2026-01-20T09:46:00Z" },
    { s: namId, r: locId, c: "Khôn như ông quê tui đầy =)) Thôi tính hòa, mốt đánh lại.", t: "2026-01-20T09:47:00Z" },

    // Chat hiện tại
    { s: locId, r: namId, c: "Nghỉ tay tí, lát chiều tui qua nhà ông chơi.", t: "2026-01-20T10:00:00Z" },
    { s: namId, r: locId, c: "Ok, qua nhớ mua nước ngọt nãy cá cược đấy nhé.", t: "2026-01-20T10:01:00Z" },
    { s: locId, r: namId, c: "Đã bảo hòa rồi mà! Keo kiệt vãi.", t: "2026-01-20T10:02:00Z" },
    { s: namId, r: locId, c: "Haha đùa thôi, qua lẹ đi.", t: "2026-01-20T10:02:30Z" }
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
