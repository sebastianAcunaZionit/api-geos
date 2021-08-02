const { default: axios } = require("axios");
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
            px_size:px,
            limit:1
        }

        const resp = await axios.post(
            `https://hlv.eos.com/api/v1/search?api_key=${process.env.APIKEYGEOS}`,
            JSON.stringify(data),
            {
                headers:{
                    'Content-Type':'application/json'
                }
            });

        response.status(200).json({
            resp: resp.data
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