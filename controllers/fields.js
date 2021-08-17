const { default: axios } = require("axios");
const { json } = require("express");

const { cargarKmz } =  require("./uploads");
const { 
    AnexoExport, 
    AnexoVegetable 
} = require('../models/database/anexo-contrato');

const createField = async (request, response) => { 

    const {  id_ficha, id_anexo_envia, ambiente = 'export' } = request.body
    const { files } = request;

    // console.log(files);
    if(!files){
        response.status(406)
        .json({ ok:false, msg:"Debe ingresar un archivo" }) 
    }

    const Entity = 
    (ambiente === 'export') ?
    AnexoExport :
    AnexoVegetable;

    const existeAnexo = await Entity.findOne({where:{id_ficha:id_ficha}})

    if(!existeAnexo){
        response.status(400)
        .json({ ok:false, msg:"No existe anexo" }) 
    }

    const archivo = await cargarKmz(files);

    console.log(archivo);

    const jsonEnviar = {
        type:"Feature",
        properties:{
            name:`${archivo.jsonFinal.nombreAnexo}`,
            group:`BY API`,
            // years_data:[
            //     {
            //         crop_type:`${existeAnexo.especie}`,
            //         year:`${existeAnexo.anno}`,
            //         sowing_date:'2021-08-17'
            //     }
            // ]
        },
        geometry:{
            type:"Polygon",
            coordinates:[archivo.jsonFinal.coordenadas]
        }
    }

    const fieldResponse = await axios.post(`${process.env.URLBASEFIELD}?api_key=${process.env.APIKEYGEOS}`,
        jsonEnviar, 
        {
            headers:{
                'Content-Type':'application/json'
            }
        });

    
    if(!fieldResponse){
        response.status(404)
        .json({ ok:false, msg:"Field no creado" }) 
    }

    const createdField = fieldResponse.data;

    

    const updateAnexo = await Entity.update({
        id_field_eos:createdField.id
    },
    { where: {id_ac:existeAnexo.id_ac} });

    if(!updateAnexo){
        response.status(400)
        .json({ ok:false, msg:"No updateo anexo" }) 
    }


    response.status(200)
        .json({ ok:true, createdField, anexo:updateAnexo.data}) 

}


module.exports = {
    createField
}