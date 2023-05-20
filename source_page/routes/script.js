const sql = require('mssql');

const config = {
  user: 'andres-sa',
  password: '123456789db*',
  server: 'andres-databases.database.windows.net',
  database: 'bd_hotel',
};

const pool = new sql.ConnectionPool(config);
const dbConnect = pool.connect();



async function obtenerCamasDisponibles(fechaInicio, fechaFin, numPersonas) {
  try {
    await sql.connect(config);

    const query = `
      SELECT h.id, h.numero_habitacion, h.acomodacion, h.camas_disponibles
      FROM habitaciones h
      WHERE h.tipo = 'compartido'
      AND h.camas_disponibles >= @numPersonas
      AND NOT EXISTS (
        SELECT 1
        FROM reservas r
        INNER JOIN reservas_habitaciones rh ON r.id_reserva = rh.id_reserva
        WHERE rh.id_habitacion = h.id
        AND r.fecha_inicio <= @fechaFin
        AND r.fecha_fin >= @fechaInicio
      )
    `;

    const pool = await sql.connect(config);
    const request = pool.request();

  
    request.input('fechaInicio', sql.DateTime, fechaInicio)
    request.input('fechaFin', sql.DateTime, fechaFin)
    request.input('numPersonas', sql.Int, numPersonas)
    request.execute();

    const result = await request.query(query);

    await sql.close();

    return result.recordset;
  } catch (error) {
    console.error('Error al obtener camas disponibles:', error.message);
    throw error;
  }
}

async function reservarHabitacion(idReserva, idHabitacion) {
  try {
    await sql.connect(config);

    const query = `
      INSERT INTO reservas_habitaciones (id_reserva, id_habitacion)
      VALUES (@idReserva, @idHabitacion)
    `;


    const pool = await sql.connect(config);
    const request = pool.request();

 
    request.input('idReserva', sql.Int, idReserva)
    request.input('idHabitacion', sql.Int, idHabitacion)
    


    const result = await request.query(query);

    await sql.close();
  } catch (error) {
    console.error('Error al reservar habitación:', error.message);
    throw error;
  }
}

async function main() {
  try {

    const idReserva = 1;

    const camasDisponibles = await obtenerCamasDisponibles('2023-05-01', '2023-05-10', 2);

    if (camasDisponibles.length > 0) {
      const primeraHabitacion = camasDisponibles[0];
      const idHabitacion = primeraHabitacion.id;
      console.log('Camas disponibles:', camasDisponibles);
      console.log('Realizando reserva para la habitación:', idHabitacion);
      await reservarHabitacion(idReserva, idHabitacion);
      console.log('Reserva realizada con éxito.');
    } else {
      console.log('No hay camas compartidas disponibles para el rango de fechas y número de personas especificado.');
    }

    sql.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
