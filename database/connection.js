const { Sequelize } = require("sequelize");

const dbExport = new Sequelize(
  process.env.DB_PRIMARY,
  process.env.USER_BD,
  process.env.PASS_BD,
  {
    host: process.env.SERVER_BD,
    dialect: "mariadb",
    timezone: "-04:00",
  }
);
const dbVegetables = new Sequelize(
  process.env.DB_SECONDARY,
  process.env.USER_BD,
  process.env.PASS_BD,
  {
    host: process.env.SERVER_BD,
    dialect: "mariadb",
    timezone: "-04:00",
  }
);

const dbExportProd = new Sequelize(
  process.env.DB_PRIMARY,
  process.env.USER_BD,
  process.env.PASS_BD,
  {
    host: process.env.SERVER_BD_PROD,
    dialect: "mariadb",
    timezone: "-04:00",
  }
);
const dbVegetablesProd = new Sequelize(
  process.env.DB_SECONDARY,
  process.env.USER_BD,
  process.env.PASS_BD,
  {
    host: process.env.SERVER_BD_PROD,
    dialect: "mariadb",
    timezone: "-04:00",
  }
);

const dbExportPrueb = new Sequelize(
  process.env.DB_PRIMARY,
  process.env.USER_BD,
  process.env.PASS_BD,
  {
    host: process.env.SERVER_BD_PRUEBAS,
    dialect: "mariadb",
    timezone: "-04:00",
  }
);
const dbVegetablesPrueb = new Sequelize(
  process.env.DB_SECONDARY,
  process.env.USER_BD,
  process.env.PASS_BD,
  {
    host: process.env.SERVER_BD_PRUEBAS,
    dialect: "mariadb",
    timezone: "-04:00",
  }
);

const conectarseABd = async (accion) => {
  switch (accion) {
    case 1 /* desarrollo export */:
      await dbExport.authenticate();
      console.log("Database Export Online...");
      return dbExport;

    case 2 /* desarrollo vegetables */:
      await dbVegetables.authenticate();
      console.log("Database Vegetables Online...");
      return dbVegetables;
    case 3 /*  produccion export */:
      await dbExportProd.authenticate();
      console.log("Database export Produccion Online...");
      return dbExportProd;
    case 4:
      await dbVegetablesProd.authenticate();
      console.log("Database Vegetables Produccion Online...");
      return dbVegetablesProd;

    case 5 /*  pruebas export */:
      await dbExportPrueb.authenticate();
      console.log("Database export Pruebas Online...");
      return dbExportPrueb;
    case 6:
      await dbVegetablesPrueb.authenticate();
      console.log("Database Vegetables Pruebas Online...");
      return dbVegetablesPrueb;
  }
};
module.exports = {
  dbExport,
  dbVegetables,
  dbExportProd,
  dbVegetablesProd,
  conectarseABd,
  dbVegetablesPrueb,
  dbExportPrueb,
};
