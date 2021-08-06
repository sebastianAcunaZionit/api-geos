
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const parseKMZ = require("parse2-kmz");

const porDefecto = ['png', 'jpg', 'jpeg', 'tiff']
const kmzType = ['application/vnd.google-earth.kmz']


const subirArchivo = ( files, extensionesValidas =  [ 'png','jpg', 'jpeg', 'gif'], carpeta = '' ) => {


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


// transformamos kmz en json.
const transformarKmz = async ( kmz ) => await parseKMZ.toJson( kmz );


const prepararKmz = async ( files ) => {

    if( !kmzType.includes( files.archivo.mimetype ) ){
      return { ok:false, archivo: files.archivo }
    }

    const archivoSubido = await subirArchivo( files, ["kmz"], "kmz" );
    const parsedKmz  = await transformarKmz( archivoSubido );


    const LatLongKmz = parsedKmz.features[0].geometry.coordinates[0];

    const coordenadas = LatLongKmz.map( ( punto, index ) => {
        punto.pop();
        return punto;
    })

    const indexGuionAnexo = files.archivo.name.indexOf("-");
    const nombreAgricultor = files.archivo.name.split("_")[0];
    let nombreAnexo = "";
    for(let i = -2; i <= 6; i++){
      nombreAnexo+=`${files.archivo.name[indexGuionAnexo + i]}`;
    }

    const jsonFinal = {
      nombreAnexo,
      nombreAgricultor,
      coordenadas
    }

    return { ok:true, archivo: files.archivo,  jsonFinal};
}


module.exports = {
  subirArchivo,
  prepararKmz
}