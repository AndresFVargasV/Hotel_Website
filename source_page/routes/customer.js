const express = require('express');
const router = express.Router();
const { config, pool, dbConnect } = require('../config');
const sql = require('mssql');

// Ruta para mostrar el formulario de cliente renderisa que se encuentra en la carpeta views
router.get('/add-reservas', async (req, res) => {
  res.render('customers');
});
// Fin de la ruta para mostrar el formulario de cliente


// Función para generar valor unico para el codigo de reserva
async function generarValorUnico() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let valorUnico = '';

  for (let i = 0; i < 10; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    valorUnico += caracteres.charAt(indice);
  }

  return valorUnico;
}
// Fin función para generar valor unico para el codigo de reserva


// Función para hacer una reserva
async function addReservas(reservaCliente, id_habitacion) {
  try {

    // Insertar la reserva en la base de datos
    await sql.connect(config);
    const query = `
      -- INSERT en la tabla 'reservas'
      INSERT INTO reservas (codigo_reserva, id_cliente, id_habitacion, fecha_inicio, fecha_fin, num_personas, desayuno, almuerzo, cena, transporte, parqueadero, lavanderia, guia, descripcion)
      VALUES (@codigoReserva, @idCliente, @idHabitacion, @fechaInicio, @fechaFin, @numPersonas, @desayuno, @almuerzo, @cena, @transporte, @parqueadero, @lavanderia, @guia, @descripcion);

    `;
    const pool = await sql.connect(config);
    const request = pool.request();
    const codigo = await generarValorUnico();
    request.input('codigoReserva', sql.VarChar(100), codigo);
    request.input('idHabitacion', sql.Int, id_habitacion);
    request.input('idCliente', sql.VarChar(50), reservaCliente.docCliente);
    request.input('fechaInicio', sql.DateTime, reservaCliente.fechaInicio);
    request.input('fechaFin', sql.DateTime, reservaCliente.fechaFin);
    request.input('numPersonas', sql.Int, reservaCliente.numPersonas);
    request.input('desayuno', sql.Bit, reservaCliente.desayuno ? 1 : 0);
    request.input('almuerzo', sql.Bit, reservaCliente.desayuno ? 1 : 0);
    request.input('cena', sql.Bit, reservaCliente.desayuno ? 1 : 0);
    request.input('transporte', sql.Bit, reservaCliente.transporte ? 1 : 0);
    request.input('parqueadero', sql.Bit, reservaCliente.parqueadero ? 1 : 0);
    request.input('lavanderia', sql.Bit, reservaCliente.lavanderia ? 1 : 0);
    request.input('guia', sql.Bit, reservaCliente.guia ? 1 : 0);
    request.input('descripcion', sql.Text, reservaCliente.descripcion);
    await request.query(query);

    //console.log('Reserva realizada exitosamente.');

    return codigo
  } catch (error) {
    console.log('Error al hacer la reserva:', error);
    throw new Error('Error al hacer la reserva');
  } finally {
    sql.close();
  }
}
// Fin de función para hacer reserva

// Ruta post para obtener los datos del formulario de reservas en la ruta add-reservas
router.post('/add-reservas', async (req, res) => {
  try {
    console.log(req.body);
    const reservaCliente = req.body;
    const tipo = req.body.tipo;

    if (tipo === "ordinaria") {

      const disponibilidad = await consultarCamasDisponibles(reservaCliente, res);
      const paro = await validarParo(reservaCliente);

      if (disponibilidad.recordset.length === 0 || !(paro.recordset.length === 0)) {
        res.status(404).send(`No hay habitaciones disponibles en el rango de fechas seleccionadas`)
      } else {

        const id = disponibilidad.recordset[0].id;
        const result = await addReservas(req.body, id);

        if (reservaCliente.desayuno) {
          await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "Desayuno", res);
        } 
        if (reservaCliente.transporte) {
          await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "Transporte", res);
        } 
        if (reservaCliente.parqueadero) {
          await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "Parqueadero", res);
        } 
        if (reservaCliente.lavanderia) {
          await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "Lavanderia", res);
        } 
         if (reservaCliente.guia) {
          await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "guia", res);
        }

        if (result) {
          res.status(200).send(`Reserva realizada exitosamente codigo de reserva # ${result}`)
        }
      }

    } else if (tipo === "compartida" || !(paro.recordset.length === 0)) {
      // Verificar si se acomodaron todas las personas
      if (reservaCliente.desayuno) {
        await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "Desayuno", res);
      } 
      if (reservaCliente.transporte) {
        await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "Transporte", res);
      } 
      if (reservaCliente.parqueadero) {
        await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "Parqueadero", res);
      } 
      if (reservaCliente.lavanderia) {
        await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "Lavanderia", res);
      } 
       if (reservaCliente.guia) {
        await reservarCupos(reservaCliente.fechaInicio, reservaCliente.fechaFin, "guia", res);
      }

      const reservacompartidas = await reservaHabitaciones(reservaCliente, await obtenerHabitacionesCompartidas(), reservaCliente.fechaInicio, reservaCliente.fechaFin, req);

      if (reservacompartidas) {
        res.status(200).send(`Reserva realizada exitosamente codigo de reserva # ${reservacompartidas}`)
      } else {
        res.status(400).send('No se pueden acomodar a todas las personas en habitaciones compartidas');
      }
    }

    //res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al hacer la reserva' });
    // No envíes más respuestas aquí, evita llamar a res.send(), res.render(), u otras funciones de respuesta.
  }
});
// Fin de la ruta de hacer reserva del formulario de reservas add-reservas



// Función para consultar camas disponibles si el tipo de habitación es ordinaria
async function consultarCamasDisponibles(reservaCliente, res) {
  try {

    await sql.connect(config);

    const query = `
        SELECT top 1 h.id, h.numero_habitacion, h.tipo, h.acomodacion, h.camas_disponibles, h.price, h.descripcion
        FROM habitaciones h
        WHERE h.tipo = 'ordinaria' 
        AND h.acomodacion = @tipoCama
        AND h.id NOT IN (
        SELECT r.id_habitacion
        FROM reservas r
        WHERE (r.fecha_inicio <= @fechaFin AND r.fecha_fin >= @fechaInicio)
        )`;

    const pool = await sql.connect(config);
    const request = pool.request();

    request.input('tipoCama', sql.VarChar(50), reservaCliente.acomodacion);
    request.input('fechaInicio', sql.DateTime, reservaCliente.fechaInicio);
    request.input('fechaFin', sql.DateTime, reservaCliente.fechaFin);

    const result = await request.query(query);

    await sql.close();

    return result
  } catch (error) {
    console.error(error);

    throw new Error('Error en la consulta de camas disponibles');
  }
}
// Fin de la función consultar camas disponibles si el tipo de habitación es ordinaria


//  Funcion para consultar si hay servicios disponibles en el rango de fechas seleccionadas
async function reservarCupos(fechaInicio, fechaFin, tipoServicio, res) {
  try {
    await sql.connect(config);

    const pool = await sql.connect(config);
    const request = pool.request();

    // Convertir las fechas a objetos Date
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);

    // Verificar si hay cupos disponibles para todas las fechas
    const query = `
      SELECT 1
      FROM CuposDisponibles
      WHERE Fecha >= @FechaInicio AND Fecha <= @FechaFin
      AND [${tipoServicio}] > 0
    `;
    request.input('FechaInicio', sql.DateTime, fechaInicioObj);
    request.input('FechaFin', sql.DateTime, fechaFinObj);

    const result = await request.query(query);

    const diferenciaMs = fechaFinObj - fechaInicioObj;

    // Convertir la diferencia a días
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    console.log('Diferencia en días:', dias);

    if (!(result.recordset.length === dias+1)) {
      res.status(300).send(`No hay cupos disponibles para todas las fechas en: ${tipoServicio}`);
      return; // Detener la ejecución de la función
    }

    // Actualizar los cupos disponibles para cada fecha
    const updateQuery = `
      UPDATE CuposDisponibles
      SET [${tipoServicio}] = [${tipoServicio}] - 1
      WHERE Fecha >= @FechaInicioInput AND Fecha <= @FechaFinInput
      AND [${tipoServicio}] > 0
    `;

    request.input('FechaInicioInput', sql.DateTime, fechaInicioObj);
    request.input('FechaFinInput', sql.DateTime, fechaFinObj);

    const result1 = await request.query(updateQuery);

    console.log('Reserva exitosa.');
    return result1;
  } catch (error) {
    console.error('No se pudo realizar la reserva:', error.message);
  } finally {
    await sql.close();
  }
}

// Fin de la función consultar si hay servicios disponibles en el rango de fechas seleccionadas


// Función para obtener los IDs de las habitaciones compartidas
async function obtenerHabitacionesCompartidas(res) {
  try {
    // Conectarse a la base de datos
    await sql.connect(config);

    const pool = await sql.connect(config);
    const request = pool.request();

    // Consulta SQL para obtener los IDs de las habitaciones compartidas
    const query = `SELECT id FROM habitaciones WHERE tipo = 'compartida'`;

    // Ejecutar la consulta
    const result = await request.query(query);

    // Extraer los IDs de los resultados de la consulta
    const ids = result.recordset.map((row) => row.id);

    // Devolver los IDs de las habitaciones compartidas
    return ids;
  } catch (error) {
    console.error('Error al obtener las habitaciones compartidas:', error);
    throw error;
  } finally {
    // Cerrar la conexión a la base de datos
    sql.close();
  }
}
// Fin de la función para obtener los IDs de las habitaciones compartidas

async function revertirInsert(codigoReserva, res) {
  try {
    await sql.connect(config);

    // Realizar la lógica para revertir el insert en la base de datos
    const query = `
      DELETE FROM reserva_compartida
      WHERE  codigo_reserva = '${codigoReserva}';
    `;

    const pool = await sql.connect(config);
    const request = pool.request();

    await request.query(query);
    await sql.close();
  } catch (error) {
    console.error('Error al revertir insert:', error);
    throw error;
  }
}

// Funcion para reservar habitaciones compartidas
async function reservaHabitaciones(reservaCliente, idsHabitaciones, fechaInicio, fechaFin, res) {
  try {

    const codigoReserva = await generarValorUnico();
    await sql.connect(config);
    let habitacionReservada = null;
    let reservo = 0;
    let acomododar = 0;
    let personas = reservaCliente.numPersonas

    for (const idHabitacion of idsHabitaciones) {
      let fin = personas - acomododar;
      for (let i = 0; i < fin; i++) {

        const query = `
          DECLARE @fecha_inicio datetime;
          DECLARE @fecha_fin datetime;
          DECLARE @numero_habitacion int;

          SET @fecha_inicio = '${fechaInicio}'; -- Fecha de inicio del rango
          SET @fecha_fin = '${fechaFin}'; -- Fecha de fin del rango
          SET @numero_habitacion = ${idHabitacion}; -- ID de la habitación a verificar

          SELECT COUNT(*) AS total_reservas
          FROM reserva_compartida
          WHERE numero_habitacion = @numero_habitacion
              AND fecha_inicio <= @fecha_fin
              AND fecha_fin >= @fecha_inicio;
        `;

        const pool = await sql.connect(config);
        const request = pool.request();

        const result = await request.query(query);



        await sql.close();

        const totalReservas = result.recordset[0].total_reservas;

        console.log('Total de reservas:', totalReservas);
        if (totalReservas <= 5 && !(acomododar == personas)) {

          await insertarReservaCompartida(reservaCliente, idHabitacion, codigoReserva, res)


          acomododar++;

          habitacionReservada = codigoReserva;

        } else {
          break;
        }
      }
    }

    if (acomododar == personas) {
      return codigoReserva;

    } else {
      revertirInsert(codigoReserva);
      return null;
    }

    return habitacionReservada;
  } catch (error) {
    console.error('Error al reservar habitación:', error);
    throw error;
  }
}
// Fin de la función para reservar habitaciones compartidas



// Función para insertar una nueva reserva compartida
async function insertarReservaCompartida(reservaCliente, idHabitacion, codigoReserva, res) {
  try {
    // Generar un valor único para el código de reserva


    // Conectarse a la base de datos
    await sql.connect(config);

    // Crear una instancia de solicitud de consulta
    const pool = await sql.connect(config);
    const request = pool.request();

    // Consulta SQL para insertar una nueva reserva compartida
    const query = `
        INSERT INTO reserva_compartida (codigo_reserva, numero_habitacion, id_cliente, fecha_inicio, fecha_fin, desayuno, almuerzo, cena, transporte, parqueadero, lavanderia, guia, descipcion)
        VALUES (@codigoReserva, @idHabitacion, @idCliente, @fechaInicio, @fechaFin, @desayuno, @almuerzo, @cena, @transporte, @parqueadero, @lavanderia, @guia, @descripcion)
    `;

    // Definir los parámetros de la consulta
    request.input('codigoReserva', sql.VarChar(100), codigoReserva);
    request.input('idHabitacion', sql.Int, idHabitacion);
    request.input('idCliente', sql.VarChar(50), reservaCliente.docCliente);
    request.input('fechaInicio', sql.DateTime, reservaCliente.fechaInicio);
    request.input('fechaFin', sql.DateTime, reservaCliente.fechaFin);
    request.input('numPersonas', sql.Int, reservaCliente.numPersonas);
    request.input('desayuno', sql.Bit, reservaCliente.desayuno ? 1 : 0);
    request.input('almuerzo', sql.Bit, reservaCliente.almuerzo ? 1 : 0);
    request.input('cena', sql.Bit, reservaCliente.cena ? 1 : 0);
    request.input('transporte', sql.Bit, reservaCliente.transporte ? 1 : 0);
    request.input('parqueadero', sql.Bit, reservaCliente.parqueadero ? 1 : 0);
    request.input('lavanderia', sql.Bit, reservaCliente.lavanderia ? 1 : 0);
    request.input('guia', sql.Bit, reservaCliente.guia ? 1 : 0);
    request.input('descripcion', sql.Text, reservaCliente.descripcion);



    // Ejecutar la consulta
    await request.query(query);

    console.log('Reserva compartida insertada correctamente y el id es: ', codigoReserva);


    // Cerrar la conexión a la base de datos
    sql.close();
  } catch (error) {
    console.error('Error al insertar la reserva compartida:', error);
    throw error;
  }
}
// Fin de la función para insertar una nueva reserva compartida



// Funcion para validar fechas inactivas
async function validarParo(reservaCliente) {
  try {
    await sql.connect(config);

    // Crear una instancia de solicitud de consulta
    const pool = await sql.connect(config);
    const request = pool.request();

    const query = `
      SELECT *
      FROM fechas_inactivas
      WHERE fecha_inicio <= @FechaFin
      AND fecha_fin >= @FechaInicio;
    `;

    request.input('fechaInicio', sql.DateTime, reservaCliente.fechaInicio);
    request.input('fechaFin', sql.DateTime, reservaCliente.fechaFin);

    const paro = await request.query(query);

    return paro;
  } catch (error) {
    console.error('Error al consultar en la BD:', error);
    throw error;
  }
}

// Fin funcion de validacion de fechas inactivas

// Exportamos este modulo para usarlo en app.js
module.exports = router;