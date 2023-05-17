const sql = require('mssql');

const config = {
  user: 'andres-sa',
  password: '123456789db*',
  server: 'andres-databases.database.windows.net',
  database: 'bd_hotel',
};

async function getReservas() {    
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT * FROM Reservas');
  } catch (error) {
    console.log(error);
  } finally {
    sql.close();
  }
}

getReservas();






