const fs = require('fs');

const sql = fs.readFileSync('all_migrations.sql', 'utf8');

const getTable = (tableName) => {
  const regex = new RegExp(`CREATE TABLE (?:public\\.)?${tableName} \\(([^;]+)\\);`, 'gi');
  const match = regex.exec(sql);
  if (match) {
    console.log(`\n=== ${tableName} ===\n${match[1].trim()}`);
  } else {
    console.log(`\n${tableName} NOT FOUND!`);
  }
}

getTable('sales_executives');
getTable('customers');
getTable('products');
