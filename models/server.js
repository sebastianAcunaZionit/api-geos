const express = require('express')
const cors = require('cors');
const fileUpload = require('express-fileupload');

class Server{

    constructor(){

        this.baseUrl = '/api';

        this.app = express();
        this.port = process.env.PORT;

        this.server = require('http').createServer( this.app );


        this.rutas = {
            geos: `${this.baseUrl}/geos`,
            geometry: `${this.baseUrl}/geometry`,
            uploads: `${this.baseUrl}/uploads`
        }


        this.middlewares();

        this.routes();

    }

    middlewares(){

        this.app.use( cors( {
            origin: "*"
        }) );

         // lectura y parseo del body
         this.app.use(express.json());


         //directorio publico
         this.app.use( express.static('public') );

         // carga de archivos
         this.app.use(fileUpload({
             useTempFiles: true,
             tempFileDir: '/tmp/'
         }))

    }


    routes(){
        this.app.use(this.rutas.geos, require('../routers/geos'))
        this.app.use(this.rutas.geometry, require('../routers/geometry'))
        this.app.use(this.rutas.uploads, require('../routers/uploads'))
    }


    listen(){
        this.server.listen(this.port, () => {
            console.log(`Sistema corriendo en puerto : ${this.port}`);
        })
    }




}


module.exports = Server;