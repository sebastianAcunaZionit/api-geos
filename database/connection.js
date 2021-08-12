const { Sequelize } = require('sequelize');

const dbExport  = new Sequelize(process.env.DB_PRIMARY, process.env.USER_BD, process.env.PASS_BD,{
    host: process.env.SERVER_BD,
    dialect: 'mariadb',
    timezone:'-04:00'
});
const dbVegetables  = new Sequelize(process.env.DB_SECONDARY, process.env.USER_BD, process.env.PASS_BD,{
    host: process.env.SERVER_BD,
    dialect: 'mariadb',
    timezone:'-04:00'
});

module.exports = { dbExport, dbVegetables }