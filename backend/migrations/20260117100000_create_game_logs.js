/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("game_logs", (table) => {
    table.increments("id").primary();
    table.uuid("user_id").notNullable();
    table.integer("game_id").unsigned().notNullable();
    table.timestamp("played_at").notNullable().defaultTo(knex.fn.now());
    table.integer("score").nullable();
    table.integer("duration").nullable();

    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table.foreign("game_id").references("games.id").onDelete("CASCADE");

    table.index(["game_id", "played_at"]);
    table.index(["user_id", "played_at"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("game_logs");
};
