const sql = require('mssql/msnodesqlv8');

var config = {
   database: 'hotel',
  server: 'ANDRESFVARGAS\\SQLEXPRESS',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true
  }
};
module.exports = config;




