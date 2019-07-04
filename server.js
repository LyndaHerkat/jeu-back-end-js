'use strict';

/************************************************************************/
/***************************** Sevreur HTTP *****************************/
/************************************************************************/
let express = require('express');
let app = express();
let pug = require('pug');
let bodyParser = require('body-parser');
let session = require('express-session');
let MongoStore = require('connect-mongo')(session);

let mongodb = require('mongodb');
let MongoClient = mongodb.MongoClient;
let objectId = require('mongodb').ObjectID;
// let dbTools = require ('./my_modules/db');




//Acces aux ressources statiques
app.use('/public', express.static(__dirname + '/public'));

//Parse du corps de la requete sur toutes les routes
app.use(bodyParser.urlencoded({
    extended: false
}));

//Session
app.use(session({
    secret : 'jeubackendifocop',
    resave : false, //pas de re enregisrtement de la session (preconisé par connect-mongo)
    saveUninitialized : true, //
    cookie : {
        maxAge : 7 * 24 * 60 * 60, // 7 jours
        httpOnly : true , //permet de rendre invisible le cookie coté client
        secure : false // permet de l'envoi du cookie meem si pas en https
    },
    store : new MongoStore({
        url : 'mongodb+srv://lynda_admin:ugdyEBGb64bug44X@clusterquizz-2hfjf.mongodb.net/users?retryWrites=true&w=majority',// on specifie dans L'URI la database ou la colelction sessions sera creee
        ttl : 7 * 24 * 60 * 60 // 7jours
    })
}));

//Moteur de rendu
app.set('view engine', 'pug');

//Gestion des routes
app.use('/', require('./routes/home.js'));
app.use('/', require('./routes/login-check.js'));
app.use('/', require('./routes/signin-check.js'));
app.use('/', require('./routes/quiz-home.js'));
app.get('/deconnexion', function(req,res){
    //Destruction de la session
    if (req.session.user_id){
        
        req.session.destroy();
        res.redirect('/');

    } else {
        res.redirect('/');
    }
});

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
});

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
let myServer = app.listen(8080, function () {
    console.log('Écoute sur le port 8080');
});




