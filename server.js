'use strict';

/************************************************************************/
/***************************** Sevreur HTTP *****************************/
/************************************************************************/
const express = require('express');
const app = express();
const myServer = require('http').createServer(app);
const io = require('socket.io')(myServer);
//DB
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const objectId = require('mongodb').ObjectID;
let dbTools = require('./my_modules/db');

//PUG
const pug = require('pug');
//PARSER
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
//SESSION
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const sessionMiddleware = session({
    secret: 'jeubackendifocop',
    name : 'sessionID',
    resave: false, //false : pas de re enregisrtement de la session (preconisé par connect-mongo)
    saveUninitialized: true, //
    cookie: {
        maxAge: 7 * 24 * 60 * 60, // 7 jours
        httpOnly: true, //permet de rendre invisible le cookie coté client
        secure: false // permet de l'envoi du cookie meem si pas en https
    },
    store: new MongoStore({
        url: 'mongodb+srv://lynda_admin:ugdyEBGb64bug44X@clusterquizz-2hfjf.mongodb.net/users?retryWrites=true&w=majority', // on specifie dans L'URI la database ou la collection sessions sera creee
        ttl: 7 * 24 * 60 * 60 // 7jours
    })
});
// const sharedsession = require("express-socket.io-session"); //module partage de session entre socket.io et express (req.session)


//Acces aux ressources statiques
app.use('/public', express.static(__dirname + '/public'));

//Parse du corps de la requete sur toutes les routes et des cookies
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());


//Session
app.use(sessionMiddleware);
io.use(function(socket, next){
    sessionMiddleware(socket.request, socket.request.res, next);
});


// io.use(sharedsession(session, { //Permet de partager les sessions entre express et socket.io
//     autoSave:true
// }));


//Moteur de rendu
app.set('view engine', 'pug');

//Gestion des routes
app.use('/', require('./routes/home.js'));
app.use('/', require('./routes/login-check.js'));
app.use('/', require('./routes/signin-check.js'));
app.use('/', require('./routes/quiz-home.js'));
app.get('/deconnexion', function (req, res) {
    //Destruction de la session
    if (req.session.user_id) {

        req.session.destroy();
        res.redirect('/');

    } else {
        res.redirect('/');
    }
});

//Variable de transfert de donnees entre le serveur et les vues pour les erreurs uniqument(après toutes les routes)
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
myServer.listen(8080, function () {
    console.log('Écoute sur le port 8080');
    console.log('Joueurs dispo list', playersList);
    console.log('Joueurs available ', playersAvailable);
});


/************************************************************************/
/*************************** Sevreur Websocket **************************/
/************************************************************************/

let playersAvailable = []; // Joueurs connectés
let playersList = [];
let playerReadyToPlay = []; // Joueurs voulant jouer
let timer = 0;

let Player = function(sessionID, username, user_id, socketID){
    this.sessionID = sessionID;
    this.user_id = user_id;  
    this.socketID = socketID;
    this.username = username;
    this.score = 0;
}

//Socket.io

io.on('connection', function (socketServer) {

    //creation du player 
    let player_sessionID = socketServer.request.sessionID,
        player_username = socketServer.request.session.pseudo,
        player_user_id = socketServer.request.session.user_id,
        player_socketID = socketServer.request.session.ioID;
    let player_id = 'player' + player_user_id; 

    //Envoi du tableau des noms de joueurs connectes
    playersAvailable.push( new Player(player_sessionID, player_username, player_user_id, player_socketID));
    console.log("TCL: playersAvailable", playersAvailable);
    playersAvailable.forEach(function(elmt){
        if(playersList.indexOf(elmt.username) === -1){
            playersList.push(elmt.username);
        }
    });
    io.emit('playersList', playersList);

    //Deconnection et Mise à jour des joueuers
    socketServer.on('disconnect', function(reason){
        
        for(var i = 0; i < playersAvailable.length ; i++){
            if(playersAvailable[i].socketID === player_socketID){
                playersAvailable.splice(i-1, 1);
                playersList.splice(playersList.indexOf(player_username), 1);
                io.emit('playersList', playersList);
            }
        }
    });

    // console.log("socketServer.request.sessionID", socketServer.request.sessionID);
    // console.log("socketServer.handshake.headers.cookie", socketServer.handshake.headers.cookie
    // );
    // console.log("socketServer.handshake.headers", socketServer.handshake.headers
    // );
    
    // console.log("TCL: socketServer.id", socketServer.id)

});