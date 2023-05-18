const express = require('express');
const app = express();
const path = require('path');
const { pool, dbConnect, verificarDisponibilidad, hacerReserva } = require('./config');
const morgan = require('morgan');



//settings
app.set('port', process.env.PORT || 3000);
app.set('wiew engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


//middlewares
app.use(morgan('dev'));


//routes

app.use(express.json());

// Ruta para manejar la solicitud de reserva
app.post('/ruta-de-reserva', (req, res) => {
  const reservaCliente = req.body;
  // Aquí puedes procesar los datos y hacer la reserva en la base de datos
  // ...
  hacerReserva(reservaCliente);

  // Enviar una respuesta al cliente
  res.send('Reserva realizada exitosamente.');
});
// Fin de los datos de una reserva del cliente



//puerto escuchando
const port = 5500;
app.listen(app.get('port'), () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

