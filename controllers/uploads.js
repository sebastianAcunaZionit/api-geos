const { response } = require("express")
const { subirArchivo, prepararKmz } = require("../helpers/subir-archivo");

const cargarArchivo = async(req, res = response) => {

  if (!req.files || Object.keys(req.files).length === 0 || !req.files.archivo) {
    res.status(400).json('No hay archivos en la peticion.');
    return
  }

  const nombre = await subirArchivo(req.files)
  console.log(nombre);
  res.json({nombre})
}



const cargarKmz  = async (req = require, res = response) => {

  const { archivo } = req.files;

  if (!archivo || Object.keys(archivo).length === 0 || !archivo) {
    return res.status(400).json('No hay archivos en la peticion.');
  }
  
  const kmz = await prepararKmz( req.files )

  res.status(201).json({
    req:kmz
  })

}

module.exports = {
  cargarArchivo,
  cargarKmz
}