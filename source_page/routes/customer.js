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
async function addReservas(reservaCliente,id_habitacion) {
  try {

    // Insertar la reserva en la base de datos
    await sql.connect(config);
    const query = `
      -- INSERT en la tabla 'reservas'
      INSERT INTO reservas (codigo_reserva, id_cliente, fecha_inicio, fecha_fin, num_personas, desayuno, almuerzo, cena, transporte, parqueadero, lavanderia, guia, descripcion)
      VALUES (@codigoReserva, @idCliente, @fechaInicio, @fechaFin, @numPersonas, @desayuno, @almuerzo, @cena, @transporte, @parqueadero, @lavanderia, @guia, @descripcion);

      -- Obtener el ID de la reserva recién insertada
      DECLARE @idReserva INT;
      SET @idReserva = SCOPE_IDENTITY();

      -- INSERT en la tabla 'reservas_habitaciones'
      INSERT INTO reservas_habitaciones (id_reserva, id_habitacion)
      VALUES (@idReserva, @idHabitacion);
    `;
    const pool = await sql.connect(config);
    const request = pool.request();
    const codigo= await generarValorUnico();
    request.input('codigoReserva', sql.VarChar(100), codigo);
    request.input('idHabitacion', sql.Int, id_habitacion);
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
    
    if(tipo==="ordinaria"){
    
        const disponibilidad = await consultarCamasDisponibles(reservaCliente);
        if (disponibilidad.recordset.length===0) {
          res.status(404).send(`No hay habitaciones disponibles en el rango de fechas seleccionadas`)
        } else {
          const id = disponibilidad.recordset[0].id;
          console.log('Valido')
          const result = await addReservas(req.body,id);

          if (result){
            res.status(200).send(`Reserva realizada exitosamente codigo de reserva # ${result}`)
          }
        }

    } else if (tipo==="compartido") {
        // Verificar si se acomodaron todas las personas
        const reservacompartidas = await reservarHabitacionesCompartidas(reservaCliente);
        const codigos = [];
        if (reservacompartidas.personasRestantes === 0) {
          // Aquí iría el código para guardar las reservas en la base de datos
          
          for (const reserva of reservacompartidas.reservas) {
            const codigo =  await addreservas(reservaCliente, reserva.id_habitacion, reserva.personas);
            codigos.push(codigo);
          }

          if (codigos.length>0){
            res.status(200).send(`Reserva realizada exitosamente con codigos de reserva # ${codigos}`)
          }
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
async function consultarCamasDisponibles(reservaCliente) {
    try {

      await sql.connect(config);
  
      const query = `
      SELECT TOP 1 h.id, h.numero_habitacion, h.tipo, h.acomodacion
      FROM habitaciones h
      WHERE h.tipo = @tipoHabitacion
      AND h.acomodacion = @tipoCama
      AND h.id NOT IN (
        SELECT rh.id_habitacion
        FROM reservas_habitaciones rh
        INNER JOIN reservas r ON rh.id_reserva = r.id_reserva
        WHERE (
            (r.fecha_inicio >= @fechaInicio AND r.fecha_inicio < @fechaFin)
            OR (r.fecha_fin > @fechaInicio AND r.fecha_fin <= @fechaFin)
            OR (r.fecha_inicio <= @fechaInicio AND r.fecha_fin >= @fechaFin)
        )
      )`;
        
      const pool = await sql.connect(config);
      const request = pool.request();

      request.input('tipoHabitacion', sql.VarChar(50), reservaCliente.tipo);
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
const sql = require('mssql');

const config = {
  user: 'tu_usuario',
  password: 'tu_contraseña',
  server: 'tu_servidor',
  database: 'tu_base_de_datos',
};

async function reservarCupos(fechaInicio, fechaFin, tipoServicio) {
  try {
    await sql.connect(config);

    const transaction = new sql.Transaction();
    await transaction.begin();

    const request = new sql.Request(transaction);
    
    // Verificar si hay cupos disponibles para todas las fechas
    const query = `
      SELECT 1
      FROM CuposDisponibles
      WHERE Fecha >= @FechaInicio AND Fecha <= @FechaFin
      AND [${tipoServicio}] > 0
    `;
    const result = await request.query(query, { FechaInicio: fechaInicio, FechaFin: fechaFin });

    if (result.recordset.length === 0) {
      throw new Error('No hay cupos disponibles para todas las fechas.');
    }

    // Actualizar los cupos disponibles para cada fecha
    const updateQuery = `
      UPDATE CuposDisponibles
      SET [${tipoServicio}] = [${tipoServicio}] - 1
      WHERE Fecha >= @FechaInicio AND Fecha <= @FechaFin
      AND [${tipoServicio}] > 0
    `;
    await request.query(updateQuery, { FechaInicio: fechaInicio, FechaFin: fechaFin });

    await transaction.commit();
    console.log('Reserva exitosa.');
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error('No se pudo realizar la reserva:', error.message);
  } finally {
    sql.close();
  }
}
// Fin de la función consultar si hay servicios disponibles en el rango de fechas seleccionadas


// Ruta para hacer una reserva de habitaciones compartidas para un grupo de personas
async function reservarHabitacionesCompartidas(reservaCliente) {

  try {
    // Obtener las habitaciones compartidas disponibles
    await sql.connect(config);
  
    const query = `
    SELECT h.id, h.numero_habitacion, h.tipo, h.acomodacion, h.camas_disponibles
    FROM habitaciones h
    WHERE h.tipo = @tipoHabitacion
    AND h.id NOT IN (
    SELECT rh.id_habitacion
    FROM reservas_habitaciones rh
    INNER JOIN reservas r ON rh.id_reserva = r.id_reserva
    WHERE (
        (r.fecha_inicio >= @fechaInicio AND r.fecha_inicio < @fechaFin)
        OR (r.fecha_fin > @fechaInicio AND r.fecha_fin <=  @fechaFin)
        OR (r.fecha_inicio <= @fechaInicio AND r.fecha_fin >=  @fechaFin)
    )
    AND rh.id_habitacion = h.id
    AND h.camas_disponibles = 0 -- Verificar camas disponibles
    )`;
      
    const pool = await sql.connect(config);
    const request = pool.request();

    request.input('tipoHabitacion', sql.VarChar(50), reservaCliente.tipo);
    request.input('fechaInicio', sql.DateTime, reservaCliente.fechaInicio);
    request.input('fechaFin', sql.DateTime, reservaCliente.fechaFin);

    const result = await request.query(query);

    await sql.close();
    

    const habitacionesDisponibles = result.recordset;

    // Asignar personas a habitaciones hasta que no haya más personas por acomodar
    const reservas = [];
    const idsHabitaciones = [];
    let personasRestantes = reservaCliente.numPersonas;

    for (const habitacion of habitacionesDisponibles) {
      const camasDisponibles = habitacion.camas_disponibles;

      if (personasRestantes === 0) {
        break; // Ya no hay más personas por acomodar, salir del bucle
      }

      if (camasDisponibles > 0) {
        const personasAsignadas = Math.min(personasRestantes, camasDisponibles);
        const reserva = {
          id_habitacion: habitacion.id,
          numero_habitacion: habitacion.numero_habitacion,
          personas: personasAsignadas,
        };
        reservas.push(reserva);
        idsHabitaciones.push(habitacion.id);
        personasRestantes -= personasAsignadas;
      }
    }

    // Verificar si se acomodaron todas las personas
    console.log('personas restantes: ', personasRestantes);
    
    return {personasRestantes, reservas, idsHabitaciones}
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
  }
}

// Fin de la función Hacer reserva de habitaciones compartidas para un grupo de personas
async function addreservas(reservaCliente,id_habitacion, personas) {
  try {

    // Insertar la reserva en la base de datos
    await sql.connect(config);
    const query = `
      -- INSERT en la tabla 'reservas'
      INSERT INTO reservas (codigo_reserva, id_cliente, fecha_inicio, fecha_fin, num_personas, desayuno, almuerzo, cena, transporte, parqueadero, lavanderia, guia, descripcion)
      VALUES (@codigoReserva, @idCliente, @fechaInicio, @fechaFin, @numPersonas, @desayuno, @almuerzo, @cena, @transporte, @parqueadero, @lavanderia, @guia, @descripcion);

      -- Obtener el ID de la reserva recién insertada
      DECLARE @idReserva INT;
      SET @idReserva = SCOPE_IDENTITY();

      -- INSERT en la tabla 'reservas_habitaciones'
      INSERT INTO reservas_habitaciones (id_reserva, id_habitacion)
      VALUES (@idReserva, @idHabitacion);

      -- Actualizar las camas disponibles en la tabla 'habitaciones'
      UPDATE habitaciones
      SET camas_disponibles = camas_disponibles - @numPersonas
      WHERE id = @idHabitacion;
    `;
    const pool = await sql.connect(config);
    const request = pool.request();
    const codigo= await generarValorUnico();
    request.input('codigoReserva', sql.VarChar(100), codigo);
    request.input('idHabitacion', sql.Int, id_habitacion);
    request.input('idCliente', sql.VarChar(50), reservaCliente.docCliente);
    request.input('fechaInicio', sql.DateTime, reservaCliente.fechaInicio);
    request.input('fechaFin', sql.DateTime, reservaCliente.fechaFin);
    request.input('numPersonas', sql.Int, personas);
    request.input('desayuno', sql.Bit, reservaCliente.desayuno ? 1 : 0);
    request.input('almuerzo', sql.Bit, reservaCliente.almuerzo ? 1 : 0);
    request.input('cena', sql.Bit, reservaCliente.cena ? 1 : 0);
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

// Exportamos este modulo para usarlo en app.js
module.exports = router;