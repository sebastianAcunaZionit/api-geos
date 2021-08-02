const { default: axios } = require("axios");
const { json } = require("express");


const urlBase = "https://vt.eos.com/api/data/feature";

const getAllgeometries = async (request , response) => {

    try{
        const instancia  = axios.create({
            baseURL:`${urlBase}/collection`,
            method:'get',
            headers:{
               Authorization: `ApiKey ${process.env.APIKEYGEOS}`,
            },
            params:{
                limit:4,
                page:4
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


module.exports = {
    getAllgeometries,
}