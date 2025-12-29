require('dotenv').config();
const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';

const db = knex(knexConfig[environment]);

db.raw('SELECT 1')
  .then(() => {
    console.log('Kết nối Supabase thành công!');
  })
  .catch((err) => {
    console.error('Lỗi kết nối Supabase:', err.message);
  });

module.exports = db;
