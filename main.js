document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    // Obtén los valores de los campos del formulario
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const tipoDocumento = document.getElementById('tipoDocumento').value;
    const documento = document.getElementById('documento').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const password = document.getElementById('password').value;

    // Aquí debes implementar la lógica para guardar los datos en la base de datos relacional
    // Puedes utilizar una API o una conexión directa a la base de datos, dependiendo de tu arquitectura
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    // Obtén los valores de los campos del formulario
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Aquí debes implementar la lógica para verificar si el usuario está registrado en la base de datos
    // Puedes utilizar una API o una conexión directa a la base de datos, dependiendo de tu arquitectura
});
