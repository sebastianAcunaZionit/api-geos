const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const {
  dbExport,
  dbVegetables,
  dbExportProd,
  dbVegetablesProd,
  dbExportPrueb,
  dbVegetablesPrueb,
} = require("../database/connection");

class Server {
  constructor() {
    this.baseUrl = "/api";

    this.app = express();
    this.port = process.env.PORT;

    this.server = require("http").createServer(this.app);

    this.rutas = {
      geos: `${this.baseUrl}/geos`,
      vilab: `${this.baseUrl}/vilab`,
      geometry: `${this.baseUrl}/geometry`,
      uploads: `${this.baseUrl}/uploads`,
      fields: `${this.baseUrl}/fields`,
    };

    // this.conectarDB();
    this.dbConnection();

    this.middlewares();

    this.routes();
  }

  async dbConnection() {
    try {
      await dbExport.authenticate();
      console.log("Database Export Online...");

      await dbVegetables.authenticate();
      console.log("Database Vegetables Online...");

      await dbExportProd.authenticate();
      console.log("Database export Produccion Online...");

      await dbVegetablesProd.authenticate();
      console.log("Database Vegetables Produccion Online...");

      await dbExportPrueb.authenticate();
      console.log("Database export Pruebas Online...");

      await dbVegetablesPrueb.authenticate();
      console.log("Database Vegetables Pruebas Online...");

      // dbExport.close();
    } catch (error) {
      throw new Error(error);
    }
  }

  middlewares() {
    this.app.use(
      cors({
        origin: "http://www.zcloud.cl",
        methods: ["POST", "GET", "PUT"],
      })
    );

    // lectura y parseo del body
    this.app.use(express.json());

    //directorio publico
    this.app.use(express.static("public"));

    // carga de archivos
    this.app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
      })
    );
  }

  routes() {
    this.app.use(this.rutas.geos, require("../routers/geos"));
    this.app.use(this.rutas.geometry, require("../routers/geometry"));
    this.app.use(this.rutas.uploads, require("../routers/uploads"));
    this.app.use(this.rutas.fields, require("../routers/fields"));
    this.app.use(this.rutas.vilab, require("../routers/vilab"));
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log(`Sistema corriendo en puerto : ${this.port}`);
    });
  }
}

module.exports = Server;
