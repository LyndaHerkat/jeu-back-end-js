'use strict';

/************************************************************************/
/***************************** Sevreur HTTP *****************************/
/************************************************************************/
const express = require('express');
const app = express();
const myServer = require('http').createServer(app);
const io = require('socket.io')(myServer);
const PORT = process.env.PORT || 8080;
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
    name: 'sessionID',
    resave: false, //false : pas de re enregisrtement de la session (preconisé par connect-mongo)
    saveUninitialized: true, //
    cookie: {
        maxAge: 7 * 24 * 60 * 60, // 7 jours
        httpOnly: false, //permet de rendre invisible le cookie coté client
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
io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

//Moteur de rendu
app.set('view engine', 'pug');

//Gestion des routes
app.use('/', require('./routes/home.js'));
app.use('/', require('./routes/login-check.js'));
app.use('/', require('./routes/signin-check.js'));
app.use('/', require('./routes/quiz-home.js'));
// app.use('/', require('./routes/quiz.js'));
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
myServer.listen(PORT, function () {
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
let roomsList = {}; //Info de la partie en cours (nom de la room, joueurs, questions)
let pending_room = null; // room en attente d'un second joueur
let roomID = function () {
    return 'room_' + Math.random().toString(36).substr(2, 9);
};

//Caracteristique joueur
let Player = function (sessionID, username, user_id, socketID) {
    this.sessionID = sessionID;
    this.user_id = user_id;
    this.socketID = socketID;
    this.username = username;
    this.score = 0;
};

//Connection websocket
io.on('connection', function (socketServer) {

    //Creation de l'objet joueur avec toutes ses caracteristiques
    // et ajout aux tableaux playersAvailable et playersAvailableList
    let player_sessionID = socketServer.request.sessionID,
        player_username = socketServer.request.session.pseudo,
        player_user_id = socketServer.request.session.user_id,
        player_socketID = socketServer.request.session.ioID;

    playersAvailable.push(new Player(player_sessionID, player_username, player_user_id, player_socketID));

    //Envoi du tableau des noms de joueurs connectes
    console.log("TCL: playersAvailable lors de la socket connection de ", player_username, playersAvailable);
    playersAvailable.forEach(function (elmt) {
        if (playersAvailableList.indexOf(elmt.username) === -1) {
            playersAvailableList.push(elmt.username);
        }
    });
    io.emit('playersAvailableList', playersAvailableList);

    //Deconnection et Mise à jour du tableau des joueurs connectes
    socketServer.on('disconnect', function (reason) {
        console.log("TCL: reason", reason)

        for (var i = 0; i < playersAvailable.length; i++) {
            if (playersAvailable[i].socketID === player_socketID) {
                playersAvailable.splice(i, 1);
                playersAvailableList.splice(playersAvailableList.indexOf(player_username), 1);
                io.emit('playersAvailableList', playersAvailableList);
            }
        }
        console.log("TCL: playersAvailable apres déconnection de ", player_username, playersAvailable);
        console.log("TCL: playersAvailableList apres déconnection", playersAvailableList);
    });

    //Rejoindre une partie
    socketServer.on('ready', function () {
        //atrribution d'un room aux joueurs pret à jouer
        if (pending_room === null) {
            pending_room = roomID();
            roomsList[pending_room] = {};
            roomsList[pending_room].players = [];
            roomsList[pending_room].scores = [];
        }
        //Mise à jour des infos de la room
        socketServer.room = pending_room;
        socketServer.join(socketServer.room);
        roomsList[socketServer.room].players.push(player_username);

        //Ouverture de la room
        playersReadyToPlayList.push(player_username);
        console.log("TCL: playersReadyToPlayList AVANT", playersReadyToPlayList)
        if (playersReadyToPlayList.length === 2) {
            //Debut de l'echange dans la room
            io.to(socketServer.room).emit('letsgo');

            // remise à zero du tableau des joueurs en attente de jouer 
            pending_room = null;
            playersReadyToPlayList = [];
            console.log("TCL: playersReadyToPlayList APRES", playersReadyToPlayList);
            console.log("TCL: playersAvailable apres acces room", playersAvailable)
            console.log("TCL: socketServer.room", socketServer.room);
            console.log("TCL: roomsList", roomsList);

        } else {
            socketServer.emit('wait');
            io.emit('waitingPlayer', player_username);
        }
    });

    //Lancement du chrono
    let timer;
    let seconds = 30;
    let chrono = function () {
        timer = setInterval(function () {
            seconds -= 1;
            if (seconds >= 0) {
                io.to(socketServer.room).emit('sendChrono', {
                    time: seconds
                });
            } else {
                stopGameSwitcher = true;
                stopChrono();
                stopGame();
            }
        }, 1000);
    };
    let stopChrono = function () {
        clearInterval(timer);
    };
    socketServer.on('askChrono', function () {
        chrono();
    });

    //Récupération du Quiz dans la base de données(choix aléatoire de la collection)
    socketServer.on('startQuestions', function () {
        if (roomsList[socketServer.room].players[0] === player_username) { //un seul joueur fait cette requete
            dbTools.connectClientMongo(dbTools.URI, {
                useNewUrlParser: true
            }, function (err) {
                if (err) {
                    console.log('Impossible de se connecter au client Mongo');
                    next(err);
                } else {
                    const myDb = dbTools.getClientMongo().db('questions');
                    const myCollection = myDb.collection('quizz-culture');
                    myCollection.aggregate([{
                        $sample: {
                            size: 1
                        }
                    }]).toArray(
                        function (err, doc) {
                            if (err) {
                                console.log('impossible de se connecter à la collection quizz-culture');
                                next(err);
                            } else {
                                //stockage des questions sur le serveur dans l'objet roomList
                                roomsList[socketServer.room].quizz_id = objectId(doc[0]._id);
                                roomsList[socketServer.room].quizzRound1 = doc[0].quizz['débutant'];
                                roomsList[socketServer.room].quizzRound2 = doc[0].quizz['confirmé'];
                                roomsList[socketServer.room].quizzRound3 = doc[0].quizz['expert'];
                                console.log(player_username, 'recupere les questions ', 'roomsList', roomsList);
                                io.to(socketServer.room).emit('startQuestions', getQuestion());
                            }
                        }
                    );
                }
            });
        }
    });

    //Envoi des questions
    let questionNumber = 1;
    let roundNumber = 1;
    let roundText = 'quizzRound' + roundNumber;
    let correction = {};
    let stopGameSwitcher = false;

    let getQuestion = function () {
        let question = {
            questionNumber: roomsList[socketServer.room][roundText][questionNumber - 1].id,
            question: roomsList[socketServer.room][roundText][questionNumber - 1].question,
            answersTab: roomsList[socketServer.room][roundText][questionNumber - 1].propositions,
            round: roundText
        };
        return question;
    };

    socketServer.on('nextQuestion', function () {
        console.log('next question pleeeeeeaaaase !!!');
        console.log('questionNumber', questionNumber);
        console.log('roundNumber', roundNumber);
        console.log('roundText', roundText);
        if (stopGameSwitcher === false) {
            socketServer.emit('startQuestions', getQuestion());
        }
    });

    //Verification reponse
    socketServer.on('checkAnswer', function (answerToCheck) {
        correction.answerRef = answerToCheck.id;
        correction.littleStory = roomsList[socketServer.room][roundText][questionNumber - 1].anecdote;
        correction.solution = roomsList[socketServer.room][roundText][questionNumber - 1]['réponse'];
        getQuestion().answersTab.forEach(function (elmt) {
            if (elmt === correction.solution) {
                let tabAnswers = roomsList[socketServer.room][roundText][questionNumber - 1].propositions;
                let index = tabAnswers.indexOf(elmt);
                switch (index) {
                    case 0:
                        correction.goodAnswerRef = "answer-a";
                        break;
                    case 1:
                        correction.goodAnswerRef = "answer-b";
                        break;
                    case 2:
                        correction.goodAnswerRef = "answer-c";
                        break;
                    case 3:
                        correction.goodAnswerRef = "answer-d";
                        break;
                }
            }
        });

        if (answerToCheck.answer === roomsList[socketServer.room][roundText][questionNumber - 1]['réponse']) {
            console.log('Bien joué !');
            correction.result = 'right';
            console.log("TCL: correction right answer", correction)
            playersAvailable.forEach(function (elmt) {
                console.log("TCL: socketServer.request.session.ioID", socketServer.request.session.ioID)
                for (var [key, value] of Object.entries(elmt)) {
                    console.log("TCL: key", key)
                    console.log("TCL: value", value)
                    if (value === socketServer.request.session.ioID) {
                        elmt.score++;
                        correction.score = elmt.score;
                        console.log("TCL: elmt.score", elmt.score);
                        socketServer.emit('rightAnswer', correction);
                    }
                }
                console.log("TCL: elmt", elmt)
            });
        } else {
            console.log('bouuuuhhhh');
            correction.result = 'wrong';
            console.log("TCL: correction wrong answer", correction)
            socketServer.emit('wrongAnswer', correction);
        }
        questionNumber++;
        if (questionNumber === 11) {
            questionNumber = 1;
            roundNumber++;
            if (roundNumber <= 3) {
                roundText = roundText = 'quizzRound' + roundNumber;
            } else {
                stopGameSwitcher = true;
                stopGame();
                stopChrono();
            }
        }
    });
    let stopGame = function () {
        console.log("TCL: stopGame -> roomsList[pending_room]", roomsList[pending_room])

        // enregistrement du score perso en base de données (collection users)
        playersAvailable.forEach(function (elmt) {
            for (var [key, value] of Object.entries(elmt)) {
                if (value === socketServer.request.session.ioID) {
                    let user_id = objectId(elmt.user_id);
                    let finalScore = elmt.score;
                    roomsList[socketServer.room].scores.push({
                        player : player_username,
                        score : finalScore
                    });
                    console.log('Enregistrement score DB');
                    dbTools.connectClientMongo(dbTools.URI, {
                        useNewUrlParser: true
                    }, function (err) {
                        if (err) {
                            console.log('Impossible de se connecter au client Mongo');
                            next(err);
                        } else {
                            const myDb = dbTools.getClientMongo().db('users');
                            const myCollection = myDb.collection('credentials');
                            myCollection.findOneAndUpdate({
                                _id: user_id
                            }, {
                                $push: {
                                    scores: {
                                        date: new Date(),
                                        score: finalScore
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
        // enregistrement du score du match en base de données (collection games)
        if (roomsList[socketServer.room].players[0] === player_username && roomsList[socketServer.room].scores.length === 2) { //un seul joueur fait cette requete ET si les scores des 2 joueurs sont disponibles

            let records = {
                date: new Date(),
                scores: roomsList[socketServer.room].scores
            }
    
            dbTools.connectClientMongo(dbTools.URI, {
                useNewUrlParser: true
            }, function (err) {
                if (err) {
                    console.log('Impossible de se connecter au client Mongo');
                    next(err);
                } else {
                    const myDb = dbTools.getClientMongo().db('users');
                    const myCollection = myDb.collection('games');
    
                    myCollection.insertOne(records, function (err, result) {
                        if (err) {
                            console.log('impossible de se connecter à la collection games');
                            dbTools.closeClientMongo();
                            next(err);
                        } else {
                            console.log("Enregistrement des scores dans la base de données");
                            io.to(socketServer.room).emit('finalScore', roomsList[socketServer.room].scores);
                        }
                        dbTools.closeClientMongo();
                    });
                }
            });
        }

        io.to(socketServer.room).emit('stopGame');
    
        console.log("TCL: stopGame -> roomsList", roomsList);
    };

});






// console.log("socketServer.request.sessionID", socketServer.request.sessionID);
// console.log("socketServer.handshake.headers", socketServer.handshake.headers
// );
// console.log("socketServer.handshake.headers", player_username, socketServer.handshake.headers);
// console.log("TCL: socketServer.request.session.ioID", socketServer.request.session.ioID)
// console.log("TCL: socketServer.id", socketServer.id)