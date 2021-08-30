const { default: axios } = require("axios");
const { json } = require("express");

const { cargarKmz } =  require("./uploads");
const { 
    AnexoExport, 
    AnexoVegetable, 
    AnexoExportProd,
    AnexoVegetableProd
} = require('../models/database/anexo-contrato');

const createField = async (request, response) => { 

    const {  id_ficha, id_anexo_envia, ambiente = 'desarrollo', sistema = 'export' } = request.body
    const { files } = request;

    // console.log(files);
    if(!files){
        return response.status(406)
        .json({ ok:false, msg:"Debe ingresar un archivo" }) 
    }


    const Entity = 
    (ambiente === 'desarrollo') ?
    (sistema === 'export') ? AnexoExport : AnexoVegetable :
    (sistema === 'export') ? AnexoExportProd: AnexoVegetableProd;

    const existeAnexo = await Entity.findOne({where:{id_ficha:id_ficha}})

    if(!existeAnexo){
        return response.status(400)
        .json({ ok:false, msg:"Ficha sin anexo asociado. " }) 
    }

    const archivo = await cargarKmz(files);

    if(!archivo.ok){
        return response.status(400)
        .json({ ok:false, msg:archivo.msg }) 
    }


    if(existeAnexo.id_field_eos != "" && existeAnexo.id_field_eos != null){
        return response.status(400)
        .json({ ok:false, msg:"Field ya creado para esta ficha/anexo "}) 
    }


    const jsonEnviar = {
        type:"Feature",
        monetization_included:true,
        properties:{
            name:`${existeAnexo.num_anexo}`,
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
        return response.status(404)
        .json({ ok:false, msg:"Field no creado" }) 
    }

    const createdField = fieldResponse.data;

    

    const updateAnexo = await Entity.update(
    { id_field_eos:createdField.id  },
    { where: {id_ac:existeAnexo.id_ac} }
    );

    if(!updateAnexo){
        return response.status(400)
        .json({ ok:false, msg:"No updateo anexo" });
    }


   return  response.status(200)
        .json({ ok:true, createdField, anexo:updateAnexo.data}) 

}


module.exports = {
    createField
}