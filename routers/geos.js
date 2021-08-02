const { Router } = require('express');
const { check } = require('express-validator');
const { getAllGeos, deleteField, getHighLevel } = require('../controllers/geos');

const {validarCampos}  = require('../helpers/validar-campos')


const router = Router();


router.get('/', [] , getAllGeos);


router.get('/high-level', [], getHighLevel);




router.delete('/delete-field',[
    check('idField', 'Id de campo es obligatorio').notEmpty(),
    validarCampos
], deleteField)

module.exports = router;