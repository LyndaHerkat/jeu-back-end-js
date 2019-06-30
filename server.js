'use strict';


/************************************************************************/
/***************************** Sevreur HTTP *****************************/
/************************************************************************/
let express = require('express');
let app = express();
let pug = require('pug');
let bodyParser = require('body-parser');
// let cookieParser = require('cookie-parser');
let session = require('express-session');

let mongodb = require('mongodb');
let MongoClient = mongodb.MongoClient;
let objectId = require('mongodb').ObjectID;
let dbTools = require ('./my_modules/db');



//Acces aux ressources statiques
app.use('/public', express.static(__dirname + '/public'));

//Parse du corps de la requete sur toutes les routes
app.use(bodyParser.urlencoded({
    extended: false
}));

//Session
app.use(session({
    secret: 'my secret text',
    resave: false,
    saveUninitialized: true
}));

//Moteur de rendu
app.set('view engine', 'pug');

let routerHome = require('./routes/home.js');
let routerLogin = require('./routes/login-check.js');


//Gestion des routes
app.use('/', routerHome);
app.use('/', routerLogin);


//Variable de transfert de donnes entre le serveur et les vues pour les erreurs uniqument(après toutes les routes)
let dataBox;
app.use(function (req, res, next) {
    dataBox = {};
    next();
});

//Gestion des erreurs
app.use(function (req, res, next) {
    res.status(404);
    next(new Error());
})

app.use(function (err, req, res, next) {
    if (res.statusCode === 404) {
        console.log(`Erreur de type ${res.statusCode}: `, err);
        res.render('page404', dataBox);
    } else {
        if (res.statusCode >= 300 && res.statusCode <= 400 && res.statusCode != 404) {
            dataBox.titre = 'Une erreur s\'est produite.'
            console.log(`Erreur de type ${res.statusCode}: `, err);
            res.render('error', dataBox);
        } else {
            // dataBox.titre = 'Erreur serveur.'
            console.log(`Erreur de type ${res.statusCode}: `, err);
            res.status(500).render('error', dataBox);
        }
    }

});


//Ecoute serveur
let srever = app.listen(8080, function () {
    console.log('Écoute sur le port 8080');
});