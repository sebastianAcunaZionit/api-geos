const { Router } = require('express');
const { check } = require('express-validator');
const { getAllgeometries, createGeometry } = require('../controllers/geometry');

const {validarCampos}  = require('../helpers/validar-campos')


const router = Router();


router.get('/', [] , getAllgeometries);


router.post('/create', [], createGeometry);

module.exports = router;