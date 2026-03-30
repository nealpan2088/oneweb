const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/shop.db');
const db = new sqlite3.Database(dbPath);

// 查看shops表的所有数据
db.all("SELECT * FROM shops", (err, rows) => {
    if (err) {
        console.error('查询出错:', err.message);
        db.close();
        return;
    }
    
    console.log('=== shops表的所有数据 ===');
    console.log(`总记录数: ${rows.length}\n`);
    
    rows.forEach((row, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  店铺名: ${row.name || '无'}`);
        console.log(`  地址: ${row.address || '无'}`);
        console.log(`  电话: ${row.phone || '无'}`);
        console.log(`  其他字段:`, JSON.stringify(row, null, 2));
        console.log('---');
    });
    
    // 统计ID问题
    const nullOrEmptyIds = rows.filter(row => row.id === null || row.id === '');
    console.log(`\n=== ID问题统计 ===`);
    console.log(`总记录数: ${rows.length}`);
    console.log(`ID为NULL或空字符串: ${nullOrEmptyIds.length}`);
    
    if (nullOrEmptyIds.length > 0) {
        console.log(`\n问题记录详情:`);
        nullOrEmptyIds.forEach((row, idx) => {
            console.log(`  ${idx + 1}. ID=${row.id}, 名称=${row.name}, 地址=${row.address}`);
        });
    }
    
    db.close();
});
