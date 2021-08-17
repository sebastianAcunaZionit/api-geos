const { response } = require("express")
const { subirArchivo, prepararKmz } = require("../helpers/subir-archivo");

const cargarArchivo = async(req, res = response) => {

  if (!req.files || Object.keys(req.files).length === 0 || !req.files.archivo) {
    res.status(400).json('No hay archivos en la peticion.');
    return
  }

  const nombre = await subirArchivo(req.files)
  res.json({nombre})
}


const cargarKmz  = async (archivos) => await prepararKmz( archivos.files );


module.exports = {
  cargarArchivo,
  cargarKmz
}