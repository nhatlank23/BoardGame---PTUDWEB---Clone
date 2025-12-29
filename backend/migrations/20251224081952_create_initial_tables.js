/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. Bảng USERS: Quản lý người dùng & Admin
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('username').notNullable().unique();
      table.string('email').notNullable().unique();
      table.string('password').notNullable(); // Mật khẩu đã mã hóa
      table.string('role').defaultTo('user'); // 'admin' hoặc 'user'
      table.string('avatar_url').nullable();  // Cho chức năng "Quản lý Profile"
      table.text('bio').nullable();           // Giới thiệu bản thân
      table.timestamps(true, true);           // created_at, updated_at
    })

    // 2. Bảng GAMES: Quản lý danh sách trò chơi
    .createTable('games', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();       // VD: 'Caro', 'Snake', 'Sudoku'
      table.string('type').notNullable();       // VD: 'board', 'arcade', 'puzzle'
      table.string('image_url').nullable();     // Ảnh thumbnail trò chơi
      
      // Lưu cấu hình (Kích thước bàn cờ, Thời gian quy định)
      // Admin sẽ sửa cột này để thay đổi luật chơi
      table.json('config').defaultTo('{}');     
      
      // Admin Enable/Disable game tại đây
      table.boolean('is_active').defaultTo(true); 
      table.timestamps(true, true);
    })

    // 3. Bảng SCORES: Lưu điểm số & Ranking
    .createTable('scores', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('game_id').references('id').inTable('games').onDelete('CASCADE');
      table.integer('score').notNullable();   // Điểm số đạt được
      table.integer('play_duration').nullable(); // Thời gian chơi (giây)
      table.timestamp('played_at').defaultTo(knex.fn.now());
    })

    // 4. Bảng GAME_SESSIONS: Chức năng Save / Load
    .createTable('game_sessions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('game_id').references('id').inTable('games').onDelete('CASCADE');
      
      // Lưu trạng thái ma trận bàn cờ (Array 2 chiều)
      table.json('board_state').notNullable(); 
      
      table.integer('current_score').defaultTo(0);
      table.integer('time_elapsed').defaultTo(0); // Thời gian đã chơi
      table.boolean('is_completed').defaultTo(false); // Game đã xong chưa
      table.timestamp('last_saved_at').defaultTo(knex.fn.now());
    })

    // 5. Bảng FRIENDS: Quản lý kết bạn
    .createTable('friends', (table) => {
      table.integer('user_id_1').references('id').inTable('users').onDelete('CASCADE');
      table.integer('user_id_2').references('id').inTable('users').onDelete('CASCADE');
      table.string('status').defaultTo('pending'); // 'pending', 'accepted', 'blocked'
      
      table.primary(['user_id_1', 'user_id_2']); 
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // 6. Bảng MESSAGES: Quản lý tin nhắn (không cần realtime)
    .createTable('messages', (table) => {
      table.increments('id').primary();
      table.integer('sender_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('receiver_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('content').notNullable();
      table.boolean('is_read').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })

    // 7. Bảng ACHIEVEMENTS: Định nghĩa danh sách thành tựu
    .createTable('achievements', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();        
      table.string('description').notNullable(); 
      table.string('icon_url').nullable();
      table.string('condition_type').nullable(); // VD: 'win_streak', 'total_score' 
      table.integer('condition_value').defaultTo(0);
    })

    // 8. Bảng USER_ACHIEVEMENTS: User đạt được thành tựu
    .createTable('user_achievements', (table) => {
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('achievement_id').references('id').inTable('achievements').onDelete('CASCADE');
      table.timestamp('unlocked_at').defaultTo(knex.fn.now());
      
      table.primary(['user_id', 'achievement_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_achievements')
    .dropTableIfExists('achievements')
    .dropTableIfExists('messages')
    .dropTableIfExists('friends')
    .dropTableIfExists('game_sessions')
    .dropTableIfExists('scores')
    .dropTableIfExists('games')
    .dropTableIfExists('users');
};