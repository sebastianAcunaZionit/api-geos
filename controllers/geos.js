const { default: axios } = require("axios");
const { config } = require("dotenv");
const { json } = require("express");

const urlBase = "https://gate.eos.com/api/cz/backend/api";

const getAllGeos = async (request , response) => {

    try{
        const instancia  = axios.create({
            baseURL:`${urlBase}/fields`,
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

const obtenerImagenNDVI = ( url ) => {

    return new Promise( (resolve, reject ) => {

        try {
            const image  = axios.get( url , { method:'GET'});
            
            if(image.task_type === "finished"){
                resolve({ok:true, img:image.data});
            }else{
                reject({ok:false})
            }
                
        } catch (error) {
            reject({ok:false, error})
        }
        
    });
}

// ?api_key=<your api key> fc1d121b-434c-4d55-a04c-6cfd738886ad
const getHighLevel = async (request, response) => {

    try{

        const {id, from, to, px = 1} = request.body
        const data  = {
            date:{
                from:from,
                to:to
            },
            bm_type:["NDVI"],
            satellites:["landsat8"],
            polygon_id:id,
            px_size:px
        }
        

        const resp = await axios.post(
            `https://hlv.eos.com/api/v1/search?api_key=${process.env.APIKEYGEOS}`,
            JSON.stringify(data),
            {
                headers:{
                    'Content-Type':'application/json'
                }
            });

        
            const { meta, results } = resp.data;

            if(meta.found <= 0){

                return response.status(201).json({
                    ok:false,
                    resp:"sin datos encontrados"
                })
            }

            //recorro respuesta y armo array con todo lo necesario.
            const arrayImagenes = await Promise.all(results.map( async ( level ) => {
                const imagenes = []

                const firstReq = await axios.get(level.image.NDVI, { method:'GET'});

                await delay(4000);

                const image = await axios.get(level.image.NDVI, { method:'GET'});

                
                
                imagenes.push({original:level, pre:firstReq.data, post:image.data});

                return imagenes;

            }));



            const arrayFinal = await Promise.all(arrayImagenes.map( async ( levels ) => {
                const imagenes = []
                const elementos  = levels[0];
                let rawImage = '';
                if(elementos.post.task_type === "finished"){

                    rawImage = await axios.get(elementos.post.url, { method:'GET'});

                    const archivoSubido = await subirArchivo( files, ["kmz"], "kmz" );

                    imagenes.push({original:level, pre:firstReq.data, post:image.data});
                    return imagenes;
                    
                }

            } ));


            






            

            response.status(200).json({
                resp: arrayFinal
            })
             



    }catch( err ){
        console.log("==============================");
        console.log(err, 'Error conectandose a API');  
        response.status(500).json({ err }) 
    }
}


const deleteField = async(request, response) => {

    try{

        const { idField } = request.body

        const instancia  = axios.create({
            baseURL:`${urlBase}/field/${idField}`,
            method:'delete',
            params:{
                api_key:process.env.APIKEYGEOS
            }
        });

        const resp = await instancia.delete();

        console.log(resp);


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