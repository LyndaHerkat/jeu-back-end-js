'use strict';

let express = require('express');
let router = express.Router();

//Variable de transfert de donnes entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.get('/', function(req, res, next){
    dataBox.title = "Page d'accueil";
    dataBox.h1 = 'Accueil';
    res.render('home', dataBox);
});

module.exports = router;
