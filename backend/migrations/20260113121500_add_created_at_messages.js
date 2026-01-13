exports.up = function(knex) {
  return knex.schema.hasTable('messages').then(function(exists) {
    if (!exists) return Promise.resolve();
    return knex.schema.hasColumn('messages', 'created_at').then(function(hasColumn) {
      if (hasColumn) return Promise.resolve();
      return knex.schema.alterTable('messages', function(table) {
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      }).then(function() {
        // create indexes if not exist using raw SQL (Knex lacks IF NOT EXISTS helpers for indexes)
        return Promise.all([
          knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_messages_s_r_time ON messages (sender_id, receiver_id, created_at)'),
          knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_messages_r_s_time ON messages (receiver_id, sender_id, created_at)')
        ]);
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('messages').then(function(exists) {
    if (!exists) return Promise.resolve();
    return knex.schema.hasColumn('messages', 'created_at').then(function(hasColumn) {
      if (!hasColumn) return Promise.resolve();
      // drop indexes and column if they exist
      return Promise.all([
        knex.schema.raw('DROP INDEX IF EXISTS idx_messages_s_r_time'),
        knex.schema.raw('DROP INDEX IF EXISTS idx_messages_r_s_time')
      ]).then(function() {
        return knex.schema.alterTable('messages', function(table) {
          table.dropColumn('created_at');
        });
      });
    });
  });
};
