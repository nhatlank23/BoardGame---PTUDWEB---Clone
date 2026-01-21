/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Kích hoạt Extension UUID (Bắt buộc với Supabase/Postgres để sinh UUID)
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // ==============================================
  // A. NHÓM QUẢN LÝ HỆ THỐNG & USER
  // ==============================================
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()")); // UUID tự động
    table.string("username").unique().notNullable();
    table.text("email").unique().notNullable();
    table.text("password_hash").notNullable();
    table.text("avatar_url");
    table.string("role").defaultTo("player"); // 'admin' hoặc 'player'
    table.boolean("dark_mode").defaultTo(true);
    table.boolean("is_banned").defaultTo(false);
    table.timestamps(true, true); // Tạo created_at và updated_at, default now()
  });

  // ==============================================
  // B. NHÓM LOGIC GAME
  // ==============================================

  // Bảng Games
  await knex.schema.createTable("games", (table) => {
    table.increments("id").primary(); // Serial ID
    table.string("slug").unique().notNullable(); // vd: 'caro-5'
    table.string("name").notNullable();
    table.boolean("is_active").defaultTo(true);
    table.jsonb("config").defaultTo("{}"); // Cấu hình JSON
    table.timestamps(true, true);
  });

  // Bảng Game Sessions (Lưu game chơi dở)
  await knex.schema.createTable("game_sessions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE"); // Xóa user -> xóa session
    table.integer("game_id").references("id").inTable("games").onDelete("CASCADE");
    table.jsonb("matrix_state"); // Trạng thái bàn cờ
    table.integer("current_score").defaultTo(0);
    table.integer("elapsed_time").defaultTo(0);
    table.timestamps(true, true);
  });

  // Bảng Play History (Lịch sử đấu)
  await knex.schema.createTable("play_history", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.integer("game_id").references("id").inTable("games").onDelete("CASCADE");
    table.integer("score").notNullable();
    table.integer("duration").notNullable(); // Giây
    table.timestamp("played_at").defaultTo(knex.fn.now());
  });

  // ==============================================
  // C. NHÓM XÃ HỘI & THÀNH TỰU
  // ==============================================

  // Bảng Friendships
  await knex.schema.createTable("friendships", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.uuid("requester_id").references("id").inTable("users").onDelete("CASCADE");
    table.uuid("addressee_id").references("id").inTable("users").onDelete("CASCADE");
    table.string("status").defaultTo("pending"); // pending, accepted, declined
    table.timestamps(true, true);

    // Ràng buộc: Không được trùng cặp bạn bè
    table.unique(["requester_id", "addressee_id"]);
  });

  // Bảng Messages
  await knex.schema.createTable("messages", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.uuid("sender_id").references("id").inTable("users").onDelete("CASCADE");
    table.uuid("receiver_id").references("id").inTable("users").onDelete("CASCADE");
    table.text("content").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Bảng Leaderboards
  await knex.schema.createTable("leaderboards", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.integer("game_id").references("id").inTable("games").onDelete("CASCADE");
    table.integer("high_score").notNullable();
    table.timestamp("achieved_at").defaultTo(knex.fn.now());
  });

  // Bảng Achievements (Danh mục huy hiệu)
  await knex.schema.createTable("achievements", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.text("description"); // Đã sửa lỗi chính tả descriptioon
    table.text("icon_url");
    table.timestamps(true, true);
  });

  // Bảng User Achievements (Bảng nối)
  await knex.schema.createTable("user_achievements", (table) => {
    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.integer("achievement_id").references("id").inTable("achievements").onDelete("CASCADE");
    table.timestamp("earned_at").defaultTo(knex.fn.now());

    // Khóa chính phức hợp (1 user không nhận 2 lần 1 huy hiệu)
    table.primary(["user_id", "achievement_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Xóa bảng theo thứ tự ngược lại để tránh lỗi khóa ngoại (Foreign Key)
  await knex.schema.dropTableIfExists("user_achievements");
  await knex.schema.dropTableIfExists("achievements");
  await knex.schema.dropTableIfExists("leaderboards");
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("friendships");
  await knex.schema.dropTableIfExists("play_history");
  await knex.schema.dropTableIfExists("game_sessions");
  await knex.schema.dropTableIfExists("games");
  await knex.schema.dropTableIfExists("users");
};
