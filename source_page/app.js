const express = require('express');
const app = express();
const path = require('path');
const morgan = require('morgan');
const customerRoutes = require('./routes/customer');
const cors = require('cors');



//settings
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Configurar la ruta por defecto a public/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configurar la carpeta "public" para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

//middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));


//routes
app.use(cors());
app.use('/', customerRoutes);





//static files
app.use(express.static(path.join(__dirname, 'public')));


//puerto escuchando
const port = 3000;
app.listen(app.get('port'), () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

