/**
 * 数据库配置
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const apiConfig = require('./api');

const dbPath = path.join(__dirname, apiConfig.database.path);
const db = new sqlite3.Database(dbPath);

// 数据库连接事件
db.on('open', () => {
  console.log('数据库连接成功:', dbPath);
});

db.on('error', (err) => {
  console.error('数据库错误:', err);
});

// 封装数据库操作
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  dbQuery,
  dbGet,
  dbRun
};