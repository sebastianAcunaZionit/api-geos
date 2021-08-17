const { default: axios } = require("axios");
const { json } = require("express");



const createGeometry = async (request, response) => { 

    const {  field_id } = request.body


    try{

        const field = await axios.get(
            `${process.env.URLBASEFIELD}/${field_id}?api_key=${process.env.APIKEYGEOS}`);


        if(!field){
            response.status(404)
            .json({ ok:false, msg:"No se encontro field con ese id" }) 
        }


        const geometryResponse = await axios.post(`${process.env.URLBASEFEATURE}`,
        {
            action:'create',
            type:'Feature',
            message:'hello',
            properties:{
                shop:true,
                name:"texto cualquiera"
            },
            geometry:{
                type:'Polygon',
                coordinates:field.data.geometry.coordinates
            }            

        }, 
        {
            headers:{
                'Authorization':`ApiKey ${process.env.APIKEYGEOS}`,
                'Content-Type':'application/json'
            }
        });



        if(!geometryResponse){
            response.status(500).json({ pk:false, msg:'Poligono no creado' }) 
        }


        response.status(200).json({ ok:true, polygon:geometryResponse.data }) 



    }catch(error){
        console.log("==============================");
        console.log(err, 'Error conectandose a API');  
        response.status(500).json({ err }) 
    }


}




const getAllgeometries = async (request , response) => {

    try{
        const instancia  = axios.create({
            baseURL:`${process.env.URLBASEFEATURE}/collection`,
            method:'get',
            headers:{
               Authorization: `ApiKey ${process.env.APIKEYGEOS}`,
            },
            params:{
                limit:100,
                page:1
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
    createGeometry
}