const express = require('express');
const app = express();
const path = require('path');
const config = require('./config.js');
const morgan = require('morgan');

//settings
app.set('port', process.env.PORT || 3000);
app.set('wiew engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//middlewares
app.use(morgan('dev'));

//routes

const port = 3000;
app.listen(app.get('port'), () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});