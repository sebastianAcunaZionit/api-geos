const  fs  = require("fs");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const parseKMZ = require("parse2-kmz");
const { decode } = require("decode-tiff");
const  PNG  = require("pngjs").PNG;

const kmzType = ['application/vnd.google-earth.kmz']


const subirArchivo = ( files, extensionesValidas =  [ 'png','jpg', 'jpeg', 'gif', 'tiff'], carpeta = '' ) => {


    return new Promise( (resolve, reject) => {

        const { archivo } = files;

        const nombreCortado = archivo.name.split('.');
        const extension = nombreCortado[ nombreCortado.length - 1 ];
    
        //validar la extension
        if( !extensionesValidas.includes( extension )){
            return reject(` la extension ${extension} no es permitida, las permitidas son [ ${extensionesValidas} ] `);
        }
    
        const nombreTemp = uuidv4() + '.' + extension;
        const uploadPath = path.join(__dirname, '../uploads/', carpeta , nombreTemp);
    
        // Use the mv() method to place the file somewhere on your server
        archivo.mv(uploadPath, (err) => {
            if (err){  reject(err); }
            resolve(uploadPath);
        });
    });
}


const transformarPNG = ( nombreRutaImagen ) => {
  const { width, height, data } = decode( fs.readFileSync(nombreRutaImagen));
  const png = new PNG({ width, height })
  png.data = data;
  return  PNG.sync.write(png);
}

// transformamos kmz en json.
const transformarKmz = async ( kmz ) => await parseKMZ.toJson( kmz );


const prepararKmz = async ( files ) => {

    if( !kmzType.includes( files.archivo.mimetype ) ){
      return { ok:false, msg:`Archivo debe ser .kmz` }
    }

    const archivoSubido = await subirArchivo( files, ["kmz"], "kmz" );
    const parsedKmz  = await transformarKmz( archivoSubido );

    fs.rmSync( archivoSubido );


    const LatLongKmz = parsedKmz.features[0].geometry.coordinates[0];

    const coordenadas = LatLongKmz.map( ( punto, index ) => {
        punto.pop();
        return punto;
    })

    const indexGuionAnexo = files.archivo.name.indexOf("-");
    if(indexGuionAnexo.length < 0){
      return { ok:false, msg:`Archivo contener solo un '-' para el nombre de anexo (20-AB123)` }
    }
    let nombreAgricultor = files.archivo.name.split("_");
    if(nombreAgricultor.length <= 1){
      return { ok:false, msg:`Archivo contener solo un '_' separando el nombre de agricultor con el anexo (agricultor_anexo)` }
    }

    nombreAgricultor = nombreAgricultor[0];
    let nombreAnexo = "";
    for(let i = -2; i <= 6; i++){
      nombreAnexo+=`${files.archivo.name[indexGuionAnexo + i]}`;
    }

    const jsonFinal = {
      nombreAnexo,
      nombreAgricultor,
      coordenadas
    }

    return { ok:true, jsonFinal };
}


module.exports = {
  subirArchivo,
  prepararKmz,
  transformarPNG
}