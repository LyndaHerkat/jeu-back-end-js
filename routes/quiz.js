'use strict';

let express = require('express');
let router = express.Router();
let dbTools = require('../my_modules/db');
// let bodyParser = require('body-parser');

//Variable de transfert de donnees entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.get('/quiz/game', function (req, res, next) {

    res.render('quiz');
});


module.exports = router;