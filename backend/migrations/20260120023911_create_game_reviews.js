/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("game_reviews", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE")
      .notNullable();
    table
      .integer("game_id")
      .references("id")
      .inTable("games")
      .onDelete("CASCADE")
      .notNullable();
    table.integer("rating").notNullable().checkBetween([1, 5]); // Rating từ 1-5 sao
    table.text("comment"); // Comment có thể để trống
    table.timestamps(true, true); // created_at và updated_at

    // Mỗi user chỉ được review 1 lần cho mỗi game
    table.unique(["user_id", "game_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("game_reviews");
};
