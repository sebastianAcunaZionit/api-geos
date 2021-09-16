const { Router } = require('express');
const { check } = require('express-validator');
const { createField } = require('../controllers/fields');

const {validarCampos}  = require('../helpers/validar-campos')

const router = Router();

router.post('/create', [
    validarCampos
], createField);

module.exports = router;