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

//Pug
const pug = require('pug');

//Parser
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//Session
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

//Moteur de rendu
app.set('view engine', 'pug');

//Gestion des routes
app.use('/', require('./routes/home.js'));
app.use('/', require('./routes/login-check.js'));
app.use('/', require('./routes/signin-check.js'));
app.use('/', require('./routes/quiz-home.js'));
app.use('/', require('./routes/quiz.js'));
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
    console.log('playersAvailableList', playersAvailableList);
    console.log('playersAvailable ', playersAvailable);
});

/************************************************************************/
/*************************** Sevreur Websocket **************************/
/************************************************************************/

let playersAvailable = []; // tableau contenant un objet par joueur (caracteristique)
let playersAvailableList = []; // Joueurs connectes (username)
let playersReadyToPlayList = []; // Joueurs prets à jouer (userID ?? a definir)
let roomsList = [];
let pending_room = null;
let roomID = function () {
    return 'room_' + Math.random().toString(36).substr(2, 9);
};
let timer = 0;

let Player = function(sessionID, username, user_id, socketID){
    this.sessionID = sessionID;
    this.user_id = user_id;  
    this.socketID = socketID;
    this.username = username;
    this.score = 0;
};

io.on('connection', function (socketServer) {

    //Creation de l'objet joueur avec toutes ses caracteristiques
    // et ajout aux tbleaux playersAvailable et playersAvailableList
    let player_sessionID = socketServer.request.sessionID,
        player_username = socketServer.request.session.pseudo,
        player_user_id = socketServer.request.session.user_id,
        player_socketID = socketServer.request.session.ioID;

    playersAvailable.push(new Player(player_sessionID, player_username, player_user_id, player_socketID));

    //Envoi du tableau des noms de joueurs connectes
    console.log("TCL: playersAvailable", playersAvailable);
    playersAvailable.forEach(function(elmt){
        if(playersAvailableList.indexOf(elmt.username) === -1){
            playersAvailableList.push(elmt.username);
        }
    });
    io.emit('playersAvailableList', playersAvailableList);
    
    //Deconnection et Mise à jour du tableau des joueurs connectes
    socketServer.on('disconnect', function(reason){
        
        for(var i = 0; i < playersAvailable.length ; i++){
            if(playersAvailable[i].socketID === player_socketID){
                playersAvailable.splice(i-1, 1);
                playersAvailableList.splice(playersAvailableList.indexOf(player_username), 1);
                io.emit('playersAvailableList', playersAvailableList);
            }
        }
        console.log("TCL: playersAvailable apres déconnection", playersAvailable);
    });

    //Rejoindre une partie
    socketServer.on('ready', function(){
        if (pending_room === null){
            pending_room = roomID();
            roomsList.push(pending_room);
        } 
        socketServer.room = pending_room;
        socketServer.join(socketServer.room);
        playersReadyToPlayList.push(player_username);
        console.log("TCL: playersReadyToPlayList AVANT", playersReadyToPlayList)
        if (playersReadyToPlayList.length === 2){
            io.to(socketServer.room).emit('letsgo');
            pending_room = null; 
            // remise a zero du tabelau des joueurs en attente de jouer 
            playersReadyToPlayList = [];
            console.log("TCL: playersReadyToPlayList APRES", playersReadyToPlayList);
            console.log("TCL: socketServer.room", socketServer.room);
            console.log("TCL: playersAvailable apres acces room", playersAvailable)
        } else {
            socketServer.emit('wait');
        }
    });

    // console.log("socketServer.request.sessionID", socketServer.request.sessionID);
    // console.log("socketServer.handshake.headers.cookie", socketServer.handshake.headers.cookie
    // );
    // console.log("socketServer.handshake.headers", socketServer.handshake.headers
    // );
    
    // console.log("TCL: socketServer.id", socketServer.id)

});