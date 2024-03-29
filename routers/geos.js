const { Router } = require('express');
const { check } = require('express-validator');
const { getAllGeos, deleteField, getHighLevel } = require('../controllers/geos');

const {validarCampos}  = require('../helpers/validar-campos')


const router = Router();

router.get('/', [] , getAllGeos);

router.post('/high-level', [
    check("polygon_id", "debe venir un polygon_id de poligono").notEmpty(),
    validarCampos
], getHighLevel);

router.delete('/delete-field',[
    check('idField', 'Id de campo es obligatorio').notEmpty(),
    validarCampos
], deleteField)

module.exports = router;