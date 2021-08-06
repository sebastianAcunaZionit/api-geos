const {Router} = require('express')
const {check} = require('express-validator')
const { cargarArchivo, cargarKmz } = require('../controllers/uploads')

const router = Router()

router.post('/', cargarArchivo);

router.post('/kmz', cargarKmz);

module.exports = router