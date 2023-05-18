const sql = require('mssql');

// Configuración de la conexión a la base de datos
const config = {
  user: 'andres-sa',
  password: '123456789db*',
  server: 'andres-databases.database.windows.net',
  database: 'bd_hotel',
};

// Llamada a la conexión de la base de datos
const pool = new sql.ConnectionPool(config);
const dbConnect = pool.connect();

// Función Verificar disponibilidad de la habitación
async function verificarDisponibilidad(fechaInicio, fechaFin) {
  try {
    await dbConnect;
    const query = `SELECT COUNT(*) AS count FROM reservas WHERE fecha_fin >= '${fechaInicio}' AND fecha_inicio <= '${fechaFin}'`;
    const result = await pool.query(query);
    return count = result;
    // Si count es 0, no hay reservas superpuestas y hay disponibilidad.
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    throw error;
  }
}
// Fin de la función Verificar disponibilidad de la habitación

// Función Hacer reserva
async function hacerReserva(reservaCliente) {
  try {
    
    // Verificar disponibilidad de la habitación
    const disponible = await verificarDisponibilidad(reservaCliente.fecha_inicio, reservaCliente.fecha_fin);
    if (!disponible) {
      throw new Error('No hay disponibilidad en las fechas seleccionadas.');
    }
    
    // Insertar la reserva en la base de datos
    await sql.connect(config);
    const query = `
      INSERT INTO reservas (codigo_reserva, id_habitacion, id_cliente, fecha_inicio, fecha_fin, num_personas, desayuno, almuerzo, cena, transporte, parqueadero, guia, lavanderia, descripcion)
      VALUES (@codigoReserva, @idHabitacion, @idCliente, @fechaInicio, @fechaFin, @numPersonas, @desayuno, @almuerzo, @cena, @transporte, @parqueadero, @guia, @lavanderia, @descripcion)
    `;
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('codigoReserva', sql.VarChar(50), reservaCliente.codigo_reserva);
    request.input('idHabitacion', sql.Int, reservaCliente.id_habitacion);
    request.input('idCliente', sql.Int, reservaCliente.id_cliente);
    request.input('fechaInicio', sql.DateTime, reservaCliente.fecha_inicio);
    request.input('fechaFin', sql.DateTime, reservaCliente.fecha_fin);
    request.input('numPersonas', sql.Int, reservaCliente.num_personas);
    request.input('desayuno', sql.Bit, reservaCliente.desayuno);
    request.input('almuerzo', sql.Bit, reservaCliente.almuerzo);
    request.input('cena', sql.Bit, reservaCliente.cena);
    request.input('transporte', sql.Bit, reservaCliente.transporte);
    request.input('parqueadero', sql.Bit, reservaCliente.parqueadero);
    request.input('guia', sql.Bit, reservaCliente.guia);
    request.input('lavanderia', sql.Bit, reservaCliente.lavanderia);
    request.input('descripcion', sql.VarChar(255), reservaCliente.descripcion);
    await request.query(query);

    console.log('Reserva realizada exitosamente.');

  } catch (error) {
    console.log('Error al hacer la reserva:', error);
  } finally {
    sql.close();
  }
}
// Fin de la función Hacer reserva

// Exportar las funciones para ejecución desde de app.js
module.exports = { pool, dbConnect, verificarDisponibilidad, hacerReserva };







