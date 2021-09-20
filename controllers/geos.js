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
const { conectarseABd } = require("../database/connection");
const { transformarPNG } = require("../helpers/subir-archivo");

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


const rutaFtp = (ambiente , sistema) => {
    return (ambiente == "desarrollo") ?
            (sistema == "export") ? 
                `${process.env.RUTAFTP}/${process.env.RUTAVAR}` : 
                `${process.env.RUTAFTPVEGETABLES}/${process.env.RUTAVARVEG}` 
            :
            (sistema == "export") ? 
                `${process.env.RUTAFTPPROD}/${process.env.RUTAVAR}`:  
                `${process.env.RUTAFTPVEGETABLESPROD}/${process.env.RUTAVARVEG}` ;
}


const rutaBDImage = (ambiente , sistema) => {
    return (ambiente == "desarrollo") ?
    (sistema == "export") ? `${process.env.RUTAVAR}` : `${process.env.RUTAVARVEG}` :
    (sistema == "export") ? `${process.env.RUTAVAR}`:  `${process.env.RUTAVARVEG}` ;
}

const obtenerViewId = async (jsonReq = {}) => {
        /*  
            se rescatan los datos de peticion
            meta : contiene cantidad de campos encontrados
            results: los campos en si
        */
            // return {meta:{ found:0 }, results:[]};
        try{

            const resp = await axios.post(
                `${process.env.URLBASESEARCH}/sentinel2?api_key=${process.env.APIKEYGEOS}`,
                JSON.stringify(jsonReq),
                { headers:{ 'Content-Type':'application/json' } }
            );
            return resp.data;

        }catch(error){
            return {meta:{ found:0 }, results:[], error};
        }
}

const crearTareaImagen = async (jsonReq = {}) => {


    try{

        const resp = await axios.post(
            `https://gate.eos.com/api/gdw/api?api_key=${process.env.APIKEYGEOS}`,
            JSON.stringify(jsonReq),
            { headers:{ 'Content-Type':'application/json' } }
        );
        return resp.data;

    }catch(error){
        return error;
    }
}


const fieldExiste = async (field_id) => {

      // se consulta por poligono en eos
      try{
        const poligono =  await axios.get(`https://gate.eos.com/api/cz/backend/api/field/${field_id}?api_key=${ process.env.APIKEYGEOS }`);

        return poligono.data;

    }catch( error ){
        return null;
    }
    
}

//peticion para ver si poligono existe o no en eos.
const poligonoExiste = async (polygon_id) => {

    // se consulta por poligono en eos
    try{
        const poligono =  await axios.get(`${process.env.URLBASEFEATURE}/${polygon_id}`,
        {headers:{
            "Authorization":`ApiKey ${ process.env.APIKEYGEOS }`
        }});

        return poligono.data;

    }catch( error ){
        return null;
    }
    
    
}

const taskStatus = async(task_id, responseType) => {

      // se consulta por poligono en eos
      try{
        const task =  await axios.get(`https://gate.eos.com/api/gdw/api/${task_id}?api_key=${ process.env.APIKEYGEOS }`, {responseType:responseType});
            return task.data;
        }catch( error ){
            console.log("entro a error task status", error)
            return null;
        }
}


const conexionFTP = async (sistema) =>{
    const client = new ftp.Client()
    // client.ftp.verbose = true
    
    try {
        await client.access({
            host:`${ process.env.IPFTP }`,
            user:`${ (sistema == "export") ? process.env.USERFTP : process.env.USERFTPVEG }`,
            password:`${ (sistema == "export") ?  process.env.PASSFTP : process.env.PASSFTPVEG }`,
            port:21,
            secure: false
        });

        return client;
    } catch (error) {
        return null;
    }


}

//obtener imagenes de campo y estadisticas
const getHighLevel = async (request, response) => {

    try{

        const { 
            polygon_id, from, to, px_size = 1, 
            bm_type = ["NDVI"], 
            satellites = ["sentinel2"],limit = 3, 
            ambiente = 'desarrollo', sistema = 'export'
        } = request.body;



        if(!polygon_id){
            return response.status(496).json({
                ok:false, msg:"Debe incluir un id de polygono."
            })
        }

        const poligono = await fieldExiste(polygon_id);
        if(!poligono){
            return response.status(404).json({
                ok:false, msg:"poligono no encontrado en EOS."
            })
        }

        // return response.status(201).json({
        //     ok:false, msg:poligono
        // })


        //se obtiene conexion a bd y se busca anexo por id poligono 
        const accion = 
            (ambiente === 'desarrollo') 
                ? (sistema === 'export') ? 1 : 2 
                : (sistema === 'export') ? 3 : 4;


        const bdCon = await conectarseABd(accion);

        const existeAnexo = await bdCon.query(`SELECT * FROM anexo_contrato WHERE id_field_eos = ${polygon_id} `);

        if(existeAnexo[0].length <= 0){
            return response.status(404).json({
                ok:false, msg:"Polygono no esta asociado a ningun anexo."
            })
        }

        //se obtienen las coordenadas.
        const coordinates = poligono.geometry.coordinates;

        const data = {
            limit:1,
            page:1,
            intersection_validation:true,
            sort:{"date":"desc"},
            search:{
                date:{ 
                    nombre:{ from, to }
                },
                cloudCoverage:{ from: 0, to: 100 },
                shape:{
                    type:"Polygon",
                    coordinates
                },
                shapeRelation:'INTERSECTS'
            }
        }

        const { meta, results:resultadoView, error } = await obtenerViewId(data);

        if(meta.found <= 0){
            return response.status(201).json({
                ok:false,
                msg:"sin datos encontrados",
            })
        }

        if(error){
            return response.status(201).json({
                ok:false,
                msg:`problemas [${error}]`,
            })
        }
    
        const arregloTareaImagen = {
            type:"jpeg",
            params:{
                view_id:resultadoView[0].view_id,
                bm_type:"NDVI",
                geometry:{
                    type:"Polygon",
                    coordinates
                },
                px_size:4,
                format:"png",
                reference:uuidv4()
            }
        }

        const tareaImagen = await crearTareaImagen(arregloTareaImagen);


        if(!tareaImagen){
            return response.status(406).json({
                ok:false,
                msg:"no se creo tarea para imagen",
            })
        }

        var sta;

        sta =  await taskStatus(tareaImagen.task_id,'json');
        await delay(10000);
        if(sta.status === "created"){
            await delay(10000);
            sta =  await taskStatus(tareaImagen.task_id, 'arraybuffer');
        }
        if(!sta){
            console.log("es null ", sta)
            return response.status(201).json({
                ok:false, msg: sta
            })
        }

        const existeAnexoR = existeAnexo[0][0];

        
        const rutaFtps = rutaFtp(ambiente, sistema);

        const nombreImagen = `${existeAnexoR.num_anexo}_imagen_DNVI.png`;
        const nombreRutaImagen = `${__dirname}/../uploads/img/tiff/${nombreImagen}`;
        // console.log("nombreRutaImagen", nombreRutaImagen);
        const nombreRutaImagenFTP = `${rutaFtps}/${process.env.CARPETAIMGGEOS}/${nombreImagen}`;
        // console.log("nombreRutaImagenFTP", nombreRutaImagenFTP);
        fs.writeFileSync(nombreRutaImagen,  sta); 

       const client =  await conexionFTP(sistema);

        if(!client.closed){
            await client.uploadFrom(`${nombreRutaImagen}`, `${nombreRutaImagenFTP}`)
            fs.rmSync(nombreRutaImagen)
        }
        // transformarPNG(nombreRutaImagen);
        client.close();




        const stats = await axios.post(
            `${process.env.URLBASESTATS}?api_key=${process.env.APIKEYGEOS}`, {
                type:'mt_stats',
                params:{
                    bm_type:["NDVI", "NDMI"],
                    // sensors:satellites,
                    sensors:["sentinel2"],
                    date_start:from,
                    date_end:to,
                    limit:1,
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


        const nombreBdImagen = rutaBDImage(ambiente , sistema);

        const imgBd = `${nombreBdImagen}/${process.env.CARPETAIMGGEOS}/${nombreImagen}`


        const {errors, result } = statics.data;

        if(errors.length > 0){
            //recorrer errores

            const existeDato = await bdCon.query(`SELECT * FROM datos_geos WHERE id_poligono_geos = ${polygon_id} `);


            if(existeDato[0].length > 0){
                console.log(existeDato[0][0]);

                const sql = `UPDATE datos_geos  SET
                ruta_ndvi_imagen = '${imgBd}',fecha_imagen_ndvi = '${resultadoView[0].date}', 
                obs_stats_error = '${errors[0].date} ${errors[0].error}'
                WHERE id_poligono_geos = ${polygon_id};`;
                // console.log(sql)
                await bdCon.query(sql);
            }else{
                const sql = `INSERT INTO datos_geos 
                (id_poligono_geos, ruta_ndvi_imagen,fecha_imagen_ndvi, obs_stats_error ) 
                VALUES (${polygon_id}, '${imgBd}', '${resultadoView[0].date}', '${errors[0].date} ${errors[0].error}');`;

                // console.log(sql)

                await bdCon.query(sql);
            }

        }

        

        if(result.length > 0){

            for (const estadisticas of result ) {
                
                const existeDato = await bdCon.query(`SELECT * FROM datos_geos WHERE id_poligono_geos = ${polygon_id} `);


                if(existeDato[0].length > 0){
                    console.log(existeDato[0][0]);

                    const sql = `UPDATE datos_geos  SET
                    ruta_ndvi_imagen = '${imgBd}',fecha_imagen_ndvi = '${resultadoView[0].date}', 
                    fecha_stats_ndvi = '${estadisticas.date}', stats_average_ndvi = '${estadisticas.indexes.NDVI.average}'  
                    WHERE id_poligono_geos = ${polygon_id};`;
                    // console.log(sql)
                    await bdCon.query(sql);
                }else{
                    const sql = `INSERT INTO datos_geos 
                    (id_poligono_geos, ruta_ndvi_imagen,fecha_imagen_ndvi, fecha_stats_ndvi, stats_average_ndvi ) 
                    VALUES (${polygon_id}, '${imgBd}', '${resultadoView[0].date}', '${estadisticas.date}', 
                    '${estadisticas.indexes.NDVI.average}');`;

                    // console.log(sql)

                    await bdCon.query(sql);
                }
            }
        }

        // bdCon.close();
        return response.status(201).json({
            ok:true, msg:"se encontro todo", errors
        })

    }catch( err ){
        console.log("==============================");
        console.log(err, 'Error conectandose a API');  
        console.log(err.response)
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