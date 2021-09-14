const { Router } = require('express');
const { check } = require('express-validator');
const { getAllPredios } = require('../controllers/vilab');


const router = Router();

router.get('/predios', [] , getAllPredios);

module.exports = router;