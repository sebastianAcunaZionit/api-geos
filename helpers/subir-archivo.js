const path = require('path')
const {v4: uuidv4} = require('uuid');

const porDefecto = ['png', 'jpg', 'jpeg', 'tiff']

const subirArchivo = (files, extendsionesValidas = porDefecto, carpeta = '') => {

  return new Promise((resolve, reject) => {

    const {archivo} = files;
    const cortarNombre = archivo.name.split('.');
    const extension = cortarNombre[cortarNombre.length -1]

    if (!extendsionesValidas.includes(extension)) {
      return reject(
        res.status(400).json({
          msg: `la extension ${extension} no es permitida, debe ser una de estas: ${extendsionesValidas}`
        }))
    }

    const nombreTemp = uuidv4() + '.' + extension

    const uploadPath = path.join(__dirname, '../uploads', carpeta, nombreTemp);

    archivo.mv(uploadPath, (err) => {
      if (err){
        reject(err)
        // return res.status(500).json({err});
      }
      resolve(nombreTemp);
      // res.json({msg: 'El archivo se subio correctamente'} + uploadPath);
    });

  })

}

module.exports = {
  subirArchivo
}