const { Router } = require('express');
const { check } = require('express-validator');
const { createField } = require('../controllers/fields');

const {validarCampos}  = require('../helpers/validar-campos')


const router = Router();




router.post('/create', [
    check("especie", "Debe agregar una especie").notEmpty(),
    check("anno", "Debe agregar un año").notEmpty(),
    validarCampos
], createField);

module.exports = router;