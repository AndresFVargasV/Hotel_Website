const sql = require('mssql');


// Configuración de la conexión a la base de datos
const config = {
  user: 'andres-sa',
  password: '123456789db*',
  server: 'andres-databases.database.windows.net',
  database: 'hotel',
};

// Llamada a la conexión de la base de datos
const pool = new sql.ConnectionPool(config);
const dbConnect = pool.connect();


// Exportar las funciones para ejecución desde de app.js
module.exports = { config, pool, dbConnect };







