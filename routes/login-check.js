'use strict';

let express = require('express');
let router = express.Router();

// let pug = require('pug');
// let bodyParser = require('body-parser');
// let cookieParser = require('cookie-parser');
// let session = require('express-session');

// let mongodb = require('mongodb');
// let MongoClient = mongodb.MongoClient;
// let objectId = require('mongodb').ObjectID;
// let dbTools = require ('../my_modules/db');

//Variable de transfert de donnes entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.post('/inscription/check', function(req, res, next){ 
    console.log('Entrer dans le router post');
    dataBox.title = 'Vérification de la connexion';
    dataBox.h1 = 'Vérification de la connexion';
    res.render('home2', dataBox);
});

module.exports = router;
