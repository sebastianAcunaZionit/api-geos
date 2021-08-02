const { Router } = require('express');
const { check } = require('express-validator');
const { getAllgeometries } = require('../controllers/geometry');

const {validarCampos}  = require('../helpers/validar-campos')


const router = Router();


router.get('/', [] , getAllgeometries);

module.exports = router;