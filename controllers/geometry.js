const { default: axios } = require("axios");
const { 
    AnexoExport, 
    AnexoVegetable 
} = require('../models/database/anexo-contrato');


const createGeometry = async (request, response) => { 

    const {  field_id, ambiente = 'export' } = request.body


    const Entity = 
    (ambiente === 'export') ?
    AnexoExport :
    AnexoVegetable;

    try{

        const existeAnexo = await Entity.findOne({where:{id_field_eos:field_id}});

        if(!existeAnexo){
            return response.status(404)
            .json({ok:false, msg:"No existe ningun anexo con esta id."})
        }
        

        const field = await axios.get(
            `${process.env.URLBASEFIELD}/${field_id}?api_key=${process.env.APIKEYGEOS}`);


        if(!field){
            return response.status(404)
            .json({ ok:false, msg:"No se encontro field con ese id" }) 
        }


        const geometryResponse = await axios.post(`${process.env.URLBASEFEATURE}`,
        {
            action:'create',
            type:'Feature',
            message:'message a definir',
            properties:{
                shop:true,
                name:"texto a definir"
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
            return response.status(500).json({ ok:false, msg:'Poligono no creado' }) 
        }

        const updateAnexo = await Entity.update(
            { id_polygon_eos:geometryResponse.data.id  },
            { where: {id_field_eos:existeAnexo.id_field_eos} }
            );

        if(!updateAnexo){
            return response.status(500).json({ ok:false, msg:'No se actualizo poligono.' }) 
        }

        return response.status(200).json({ ok:true, polygon:geometryResponse.data }) 



    }catch(error){
        console.log("==============================");
        console.log(err, 'Error conectandose a API');  
        return response.status(500).json({ err }) 
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