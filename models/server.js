const express = require('express')
const cors = require('cors');

class Server{

    constructor(){

        this.baseUrl = '/api';

        this.app = express();
        this.port = process.env.PORT;

        this.server = require('http').createServer( this.app );


        this.rutas = {
            geos: `${this.baseUrl}/geos`,
            geometry: `${this.baseUrl}/geometry`
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

    }


    routes(){
        this.app.use(this.rutas.geos, require('../routers/geos'))
        this.app.use(this.rutas.geometry, require('../routers/geometry'))
    }


    listen(){
        this.server.listen(this.port, () => {
            console.log(`Sistema corriendo en puerto : ${this.port}`);
        })
    }




}


module.exports = Server;