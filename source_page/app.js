const express = require('express');
const app = express();
const path = require('path');
const sql = require('mssql');
const config = require('./config');
const morgan = require('morgan');

//settings
app.set('port', process.env.PORT || 3000);
app.set('wiew engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//conexion a la base de datos
async function connectToDatabase() {
  try {
    await sql.connect(config);
    console.log('Conexión exitosa a SQL Server');
  } catch (error) {
    console.log('Error al conectar a SQL Server:', error);
  }
}
connectToDatabase();

//middlewares
app.use(morgan('dev'));

//routes

const port = 3000;
app.listen(app.get('port'), () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});