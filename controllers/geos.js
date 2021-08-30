const  fs  = require("fs");
const { default: axios } = require("axios");
const ftp = require("basic-ftp")
const { v4: uuidv4 } = require('uuid');
const { Op } = require("sequelize");

const { 
    DatoExport, 
    DatoVegetable, 
    DatoVegetableProd,
    DatoExportProd
} = require('../models/database/datos-geos');

const { 
    AnexoExport, 
    AnexoVegetable, 
    AnexoExportProd,
    AnexoVegetableProd
} = require('../models/database/anexo-contrato');

//endpoint high-level
//endpoint statistics

const getAllGeos = async (request , response) => {

    try{
        const instancia  = axios.create({
            baseURL:`${process.env.URLBASEBACKEND}/fields`,
            method:'get',
            withCredentials:true,
            headers:{
               "Access-Control-Allow-Origin": "*",
            },
            params:{
                api_key:process.env.APIKEYGEOS
            }
        });
        const resp = await instancia.get();

        response.status(200).json({
            resp: resp.data
        })
    }catch( err ){
        console.log("==============================");
        console.log(err, 'Error conectandose a API');  
        response.status(500).json({ err }) 
    }

}

const delay = ms => new Promise(res => setTimeout(res, ms));

//obtener imagenes de campo y estadisticas
const getHighLevel = async (request, response) => {

    try{

        const { 
            polygon_id, from, to, px_size = 1, 
            bm_type = ["NDVI", "NDMI"], 
            satellites = ["landsat8"],limit = 1, 
            ambiente = 'desarrollo', sistema = 'export'
        } = request.body;


        // se consulta por poligono en eos
        const poligono = await axios.get(`${process.env.URLBASEFEATURE}/${polygon_id}`,
        {headers:{
            "Authorization":`ApiKey ${ process.env.APIKEYGEOS }`
        }});

        if(!poligono.data){
            return response.status(404).json({
                ok:false, msg:"poligono no encontrado en EOS."
            })
        }


        //se obtiene conexion a bd y se busca anexo por id poligono 
        const Anexo = 
        (ambiente === 'desarrollo') ?
        (sistema === 'export') ? AnexoExport : AnexoVegetable :
        (sistema === 'export') ? AnexoExportProd: AnexoVegetableProd;

        
        const existeAnexo = await Anexo.findOne({where:{id_polygon_eos:polygon_id}})

        if(!existeAnexo){
            return response.status(404).json({
                ok:false, msg:"Polygono no esta asociado a ningun anexo."
            })
        }


        //se obtienen las coordenadas.
        const coordinates = poligono.data.geometry.coordinates;

        const data  = {
            date:{ from, to },
            bm_type,
            satellites,
            polygon_id,
            px_size,
            limit
        }
        
        //se ejecuta peticion para solicitar imagenes
        const resp = await axios.post(
                `${process.env.URLBASESEARCH}?api_key=${process.env.APIKEYGEOS}`,
                JSON.stringify(data),
                { headers:{ 'Content-Type':'application/json' } }
            );

        /*  
            se rescatan los datos de peticion
            meta : contiene cantidad de campos encontrados
            results: los campos en si
        */
        const { meta, results } = resp.data;

        if(meta.found <= 0){

            return response.status(201).json({
                ok:false,
                msg:"sin datos encontrados"
            })
        }



        //recorro respuesta y armo array con todo lo necesario.
        const arrayImagenes = await Promise.all(results.map( async ( level, index ) => {
            const client = new ftp.Client()
            const imagenes = [];
            const problemas = [];

            // client.ftp.verbose = true
            

            try {
                await client.access({
                    host:`${ process.env.IPFTP }`,
                    user:`${ (sistema == "export") ? process.env.USERFTP : process.env.USERFTPVEG }`,
                    password:`${ (sistema == "export") ?  process.env.PASSFTP : process.env.PASSFTPVEG }`,
                    port:21,
                    secure: false
                });
            } catch (error) {
                problemas.push({ ok:false, smg:error })
            }


            const nombreImagen = `${uuidv4()}_${existeAnexo.num_anexo}_imagen_${index}_DNVI`;
            const nombreImagenNDMI = `${uuidv4()}_${existeAnexo.num_anexo}_imagen_${index}_NDMI`;

            //peticion para primera respuesta imagen ( pre )
            await axios.get(level.image.NDVI, { method:'GET'});
            await axios.get(level.image.NDMI, { method:'GET'});
 
            await delay(4000);
                
            //despues de esperar 4 segundos se obtiene link real de foto ( post )
            const imageNDVI = await axios.get(level.image.NDVI, { method:'GET'});
            const imageNDMI = await axios.get(level.image.NDMI, { method:'GET'});

            const rutaFtp = (ambiente == "desarrollo") ?
            (sistema == "export") ? process.env.RUTAFTP : process.env.RUTAFTPVEGETABLES :
            (sistema == "export") ? process.env.RUTAFTPPROD:  process.env.RUTAFTPVEGETABLESPROD ;

            const nombreRutaImagen = `${__dirname}/../uploads/img/tiff/${nombreImagen}.tiff`;
            const nombreRutaImagenFTP = `${rutaFtp}/${process.env.CARPETAIMGGEOS}/${nombreImagen}.tiff`;

            if(imageNDVI.data.task_type === "finished"){
                // se descarga imagen tiff
                const rawImage = await axios.get(imageNDVI.data.url, { method:'GET', responseType:'arraybuffer'});
                //se guarda en ruta de backend.
                fs.writeFileSync(nombreRutaImagen,  rawImage.data); 
                if(!client.closed){
                    await client.uploadFrom(`${nombreRutaImagen}`, `${nombreRutaImagenFTP}`)
                    const tamano = await client.size(nombreRutaImagenFTP);
                    
                    if(tamano <= 0){
                        problemas.push({ok:false, msg:"imagen tiff no se subio correctamente."})
                    }else{
                        fs.rmSync(nombreRutaImagen)
                    }
                }
            }
            const nombreRutaImagenNDMI = `${__dirname}/../uploads/img/tiff/${nombreImagenNDMI}.tiff`;
            const nombreRutaImagenFTPNDMI = `${rutaFtp}/${process.env.CARPETAIMGGEOS}/${nombreImagenNDMI}.tiff`;

            if(imageNDMI.data.task_type === "finished"){
                const rawImageNDMI = await axios.get(imageNDMI.data.url, { method:'GET', responseType:'arraybuffer'});
                            
                fs.writeFileSync(nombreRutaImagenNDMI,  rawImageNDMI.data);

                if(!client.closed){
                    await client.uploadFrom(`${nombreRutaImagenNDMI}`, `${nombreRutaImagenFTPNDMI}`)
                    const tamano = await client.size(nombreRutaImagenFTP);

                    if(tamano <= 0){
                        problemas.push({ok:false, msg:" imagen tiff no se subio correctamente."})
                    }else{
                        fs.rmSync(nombreRutaImagenNDMI)
                    }
                }
            }

            client.close();

            const originalRes = {
                polygon_id,
                fecha: level.date,
                nubosidad:level.cloudCoverage,
                elevacionSol:level.sunElevation,
                satelite:level.satellite,
                imgNDMI:nombreRutaImagenFTPNDMI,
                imgNDVI:nombreRutaImagenFTP,
                problemas
            }

            imagenes.push( originalRes );

            return imagenes;

        }));

        // se crea tarea para obtener los stats
        const stats = await axios.post(
            `${process.env.URLBASESTATS}?api_key=${process.env.APIKEYGEOS}`, {
                type:'mt_stats',
                params:{
                    bm_type,
                    sensors:satellites,
                    date_start:from,
                    date_end:to,
                    limit,
                    // max_cloud_cover_in_aoi:50,
                    reference:uuidv4(),
                    geometry:{
                        type:"Polygon",
                        coordinates
                    }
                }
            },
            { headers:{ 'Content-Type':'application/json' } }
        )

        await delay(9000);

        const urlstatic = 
        `${ process.env.URLBASESTATS }/${ stats.data.task_id  }?api_key=${process.env.APIKEYGEOS}`;

        const statics = await axios.get(urlstatic);


        
        const Entity = 
        (ambiente === 'desarrollo') ?
        (sistema === 'export') ? DatoExport : DatoVegetable :
        (sistema === 'export') ? DatoExportProd: DatoVegetableProd;

        let insertProblems = [];
        // insert para el tema imagenes.
            for (const im of arrayImagenes ) {
                
                const where  = {
                    where:{
                        [Op.and]:[
                            {id_poligono_geos:im[0].polygon_id},
                            {fecha_imagen_ndvi:im[0].fecha}
                        ]
                    },
                    limit: 1
                }
                
                const existeGeos = await Entity.findOne(where);


                let stats_max_ndvi = 0;
                let stats_min_ndvi = 0;
                let stats_average_ndvi = 0;
                let stats_max_ndmi = 0;
                let stats_min_ndmi = 0;
                let stats_average_ndmi = 0;
                let fecha_stats_ndvi = '';
                let fecha_stats_ndmi = '';
                let obs_stats_error = '';

                if( statics.data.errors ){
                    fecha_stats_ndvi = statics.data.errors[0].date;
                    fecha_stats_ndmi = statics.data.errors[0].date;
                    obs_stats_error = statics.data.errors[0].error;
                }else if(statics.data.result){
                    fecha_stats_ndvi = statics.data.result[0].date;
                    fecha_stats_ndmi = statics.data.result[0].date;
                    stats_max_ndvi = statics.data.result[0].indexes.NDVI.max;
                    stats_min_ndvi = statics.data.result[0].indexes.NDVI.min;
                    stats_average_ndvi = statics.data.result[0].indexes.NDVI.average;
                    stats_max_ndmi = statics.data.result[0].indexes.NDMI.max;
                    stats_min_ndmi = statics.data.result[0].indexes.NDMI.min;
                    stats_average_ndmi = statics.data.result[0].indexes.NDMI.average;
                }


                if(existeGeos){
                    //update
                    const update = await Entity.update(
                        {
                            ruta_ndvi_imagen:im[0].imgNDVI,
                            ruta_ndmi_imagen:im[0].imgNDVI,
                            fecha_stats_ndvi,
                            fecha_stats_ndmi,
                            stats_max_ndvi,
                            stats_min_ndvi,
                            stats_average_ndvi,
                            stats_max_ndmi,
                            stats_min_ndmi,
                            stats_average_ndmi,
                            obs_stats_error

                        },
                        {  where:{ id_dato_geos : existeGeos.id_dato_geos } }
                    )

                    if(!update){
                        insertProblems.push({lugar:"update geos",problem: update})
                    }
                }else{
                    //insert
                    const nuevo = await Entity.create(
                        {
                            id_poligono_geos:im[0].polygon_id, 
                            ruta_ndvi_imagen:im[0].imgNDVI,
                            ruta_ndmi_imagen:im[0].imgNDVI,
                            fecha_imagen_ndvi:im[0].fecha,
                            fecha_imagen_ndmi:im[0].fecha,
                            fecha_stats_ndvi,
                            fecha_stats_ndmi,
                            stats_max_ndvi,
                            stats_min_ndvi,
                            stats_average_ndvi,
                            stats_max_ndmi,
                            stats_min_ndmi,
                            stats_average_ndmi,
                            obs_stats_error
                        }
                    );
    
                    if(!nuevo){
                        insertProblems.push({lugar:"insert geos",problem: nuevo})
                    }
                }
            }



            //insert para el tema de los stats
            return response.status(200).json({
                ok:true,
                img: arrayImagenes,
                stats:statics.data,
                insertProblems
            });

    }catch( err ){
        console.log("==============================");
        console.log(err, 'Error conectandose a API');  
        response.status(500).json({ ok:false, msg:err }) 
    }
}


const deleteField = async(request, response) => {

    try{

        const { idField } = request.body

        const instancia  = axios.create({
            baseURL:`${process.env.URLBASEBACKEND}/field/${idField}`,
            method:'delete',
            params:{
                api_key:process.env.APIKEYGEOS
            }
        });

        const resp = await instancia.delete();



    }catch( err ){
        console.log("==============================");
        console.log(err, 'Error conectandose a API');  
        response.status(500).json({ err }) 
    }

}


module.exports = {
    getAllGeos,
    deleteField,
    getHighLevel
}