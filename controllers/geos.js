const  fs  = require("fs");
const { default: axios } = require("axios");
const ftp = require("basic-ftp")


const urlBase = "https://gate.eos.com/api/cz/backend/api";
//endpoint high-level
const baseSearch = `https://hlv.eos.com/api/v1/search`;
//endpoint statistics
const baseStatis = `https://gate.eos.com/api/gdw/api`;
// const baseStatis = `https://hlv.eos.com/api/v1/results/stats`;

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

// ?api_key=<your api key> fc1d121b-434c-4d55-a04c-6cfd738886ad
const getHighLevel = async (request, response) => {

    try{

        const { 
            polygon_id, from, to, px_size = 1, 
            bm_type = ["NDVI", "NDMI"], 
            satellites = ["landsat8"] 
        } = request.body;

        const data  = {
            date:{ from, to },
            bm_type,
            satellites,
            polygon_id,
            px_size
        }
        

        const resp = await axios.post(
            `${baseSearch}?api_key=${process.env.APIKEYGEOS}`,
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
            const arrayImagenes = await Promise.all(results.map( async ( level, index ) => {
                const client = new ftp.Client()
                client.ftp.verbose = true

                const imagenes = [];
                const problemas = [];

                const nombreImagen = `imagen_${index}_DNVI`;
                const nombreImagenNDMI = `imagen_${index}_NDMI`;

                //peticion para primera respuesta imagen ( pre )
                const preNDVI = await axios.get(level.image.NDVI, { method:'GET'});
                const preNDMI = await axios.get(level.image.NDMI, { method:'GET'});

                
                const urlstatic = 
                `${ baseStatis }/${ preNDVI.data.task_id }?api_key=${process.env.APIKEYGEOS}`;

                const urlstaticNDMI = 
                `${ baseStatis }/${ preNDMI.data.task_id }?api_key=${process.env.APIKEYGEOS}`;


                const stats = await axios.post(`https://gate.eos.com/api/gdw/api?api_key=${process.env.APIKEYGEOS}`, {
                    type:'mt_stats',
                    params:{
                        bm_type,
                        sensors:satellites,
                        date_start:from,
                        date_end:to,
                    }
                },
                {
                    headers:{
                        'Content-Type':'application/json'
                    }
                })


                
                // const statics = null;
                const statics = await axios.get(urlstatic);
                const staticsNDMI = await axios.get(urlstaticNDMI);
                await delay(4000);
                // const staticsNDMI = null;
                
                //despues de esperar 4 segundos se obtiene link real de foto ( post )
                const imageNDVI = await axios.get(level.image.NDVI, { method:'GET'});
                const imageNDMI = await axios.get(level.image.NDMI, { method:'GET'});


                const nombreRutaImagen = `${__dirname}/../uploads/img/tiff/${nombreImagen}.tiff`;
                const nombreRutaImagenFTP = `${process.env.RUTAFTP}/${process.env.CARPETAIMGGEOS}/${nombreImagen}.tiff`;

                if(imageNDVI.data.task_type === "finished"){
                    // se descarga imagen tiff
                    const rawImage = await axios.get(imageNDVI.data.url, { method:'GET', responseType:'arraybuffer'});
                    //se guarda en ruta de backend.
                    fs.writeFileSync(nombreRutaImagen,  rawImage.data); 

                    
                    try {
                        await client.access({
                            host:`${ process.env.IPFTP }`,
                            user:`${ process.env.USERFTP }`,
                            password:`${ process.env.PASSFTP }`,
                            port:21,
                            secure: false
                        })

                        
                        await client.uploadFrom(`${nombreRutaImagen}`, `${nombreRutaImagenFTP}`)
                        const tamano = await client.size(nombreRutaImagenFTP);

                        if(tamano <= 0){
                            problemas.push({ok:false, msg:"imagen tiff no se subio correctamente."})
                        }else{
                            fs.rmSync(nombreRutaImagen)
                        }


                    } catch (error) {
                        problemas.push({ ok:false, smg:error })
                    }
                    
                }


                const nombreRutaImagenNDMI = `${__dirname}/../uploads/img/tiff/${nombreImagenNDMI}.tiff`;
                const nombreRutaImagenFTPNDMI = `${process.env.RUTAFTP}/${process.env.CARPETAIMGGEOS}/${nombreImagenNDMI}.tiff`;

                if(imageNDMI.data.task_type === "finished"){

                    const rawImageNDMI = await axios.get(imageNDMI.data.url, { method:'GET', responseType:'arraybuffer'});
                            
                    fs.writeFileSync(nombreRutaImagenNDMI,  rawImageNDMI.data);

                    try {
                        await client.access({
                            host:`${ process.env.IPFTP }`,
                            user:`${ process.env.USERFTP }`,
                            password:`${ process.env.PASSFTP }`,
                            port:21,
                            secure: false
                        })
                        
                        await client.uploadFrom(`${nombreRutaImagenNDMI}`, `${nombreRutaImagenFTPNDMI}`)
                        const tamano = await client.size(nombreRutaImagenFTP);

                        if(tamano <= 0){
                            problemas.push({ok:false, msg:" imagen tiff no se subio correctamente."})
                        }else{
                            fs.rmSync(nombreRutaImagenNDMI)
                        }


                    } catch (error) {
                        problemas.push({ ok:false, smg:error })
                    }
                }

                client.close();

                imagenes.push(
                    {
                        original:level, 
                        preNDVI:preNDVI.data, 
                        preNDMI:preNDMI.data, 
                        postNDVI:imageNDVI.data, 
                        postNDMI:imageNDMI.data,
                        staticsNDVI:statics.data,
                        staticsNDMI:staticsNDMI.data,
                        problemas
                    }
                );

                return imagenes;

            }));


            response.status(200).json({
                resp: arrayImagenes
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