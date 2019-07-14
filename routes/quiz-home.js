'use strict';

const express = require('express');
const router = express.Router();

//Variable de transfert de donnes entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.get('/quiz/accueil', function (req, res, next) {

    dataBox.session = req.session;
    dataBox.title = 'Accueil quiz';
    dataBox.h1 = 'Accueil quiz';
    res.render('quiz-home', dataBox);

});


module.exports = router;