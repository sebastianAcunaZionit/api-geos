
const { DataTypes, Sequelize }  = require('sequelize');
const  {dbExport, dbVegetables, dbExportProd, dbVegetablesProd}  = require('../../database/connection');

const columns = {
    id_dato_geos:{
        type: DataTypes.BIGINT,
        primaryKey:true
    },
    id_poligono_geos:{
        type: DataTypes.STRING
    },
    ruta_ndvi_imagen:{
        type: DataTypes.STRING
    },
    stats_max_ndvi:{
        type: DataTypes.DECIMAL(10,4)
    },
    stats_min_ndvi: {
        type: DataTypes.DECIMAL(10,4)
    },
    stats_average_ndvi: {
        type: DataTypes.DECIMAL(10,4)
    },
    ruta_ndmi_imagen: {
        type: DataTypes.STRING
    },
    stats_max_ndmi: {
        type: DataTypes.DECIMAL(10,4)
    },
    stats_min_ndmi: {
        type: DataTypes.DECIMAL(10,4)
    },
    stats_average_ndmi:{
        type: DataTypes.DECIMAL(10,4)
    },
    fecha_imagen_ndvi:{
        type: DataTypes.DATEONLY
    },
    fecha_imagen_ndmi:{
        type: DataTypes.DATEONLY
    },
    fecha_stats_ndvi:{
        type: DataTypes.DATEONLY
    },
    fecha_stats_ndmi:{
        type: DataTypes.DATEONLY
    },
    obs_stats_error:{
        type:DataTypes.TEXT
    },
    ruta_img_vilab:{
        type:DataTypes.TEXT
    },
    promedio_vilab:{
        type:DataTypes.TEXT
    },
    id_vilab:{
        type:DataTypes.TEXT
    }
}


const DatoExport = dbExport.define(
    'dato', columns, 
    {
        tableName:'datos_geos',
        timestamps:false       
    }
);
const DatoVegetable = dbVegetables.define(
    'dato', columns, 
    {
        tableName:'datos_geos',
        timestamps:false       
    }
);

const DatoExportProd = dbExportProd.define(
    'dato', columns, 
    {
        tableName:'datos_geos',
        timestamps:false       
    }
);
const DatoVegetableProd = dbVegetablesProd.define(
    'dato', columns, 
    {
        tableName:'datos_geos',
        timestamps:false       
    }
);



module.exports = {
    DatoExport,DatoVegetable,
    DatoExportProd,DatoVegetableProd
};