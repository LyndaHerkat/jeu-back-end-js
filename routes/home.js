'use strict';

let express = require('express');
let router = express.Router();

// let pug = require('pug');
// let bodyParser = require('body-parser');
// let session = require('express-session');

// let mongodb = require('mongodb');
// let MongoClient = mongodb.MongoClient;
// let objectId = require('mongodb').ObjectID;

//Variable de transfert de donnes entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.get('/', function(req, res, next){
    dataBox.title = "Page d'accueil";
    dataBox.h1 = 'Accueil';
    res.render('home', dataBox);
});

module.exports = router;
