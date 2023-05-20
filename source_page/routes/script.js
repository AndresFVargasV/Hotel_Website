function validarTipo() {
    var tipoSelect = document.getElementById("tipo");
    var acomodacionSelect = document.getElementById("acomodacion");
  
    if (tipoSelect.value === "compartido") {
      acomodacionSelect.value = "sencilla";
      acomodacionSelect.disabled = true;
    } else {
      acomodacionSelect.disabled = false;
    }
  }