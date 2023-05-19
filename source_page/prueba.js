function generarValorUnico() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let valorUnico = '';
    
    for (let i = 0; i < 10; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      valorUnico += caracteres.charAt(indice);
    }
    
    return valorUnico;
  }
  
  // Ejemplo de uso
  const valorAleatorioUnico = generarValorUnico();
  console.log(valorAleatorioUnico);
  