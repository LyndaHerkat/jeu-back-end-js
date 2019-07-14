'use strict';

let express = require('express');
let router = express.Router();
let dbTools = require('../my_modules/db');
// let bodyParser = require('body-parser');

//Variable de transfert de donnees entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.post('/connexion/check', function (req, res, next) {

    dbTools.connectClientMongo(dbTools.URI, {
        useNewUrlParser: true
    }, function (err) {
        if (err) {
            console.log('Impossible de se connecter au client Mongo');
            next(err);
        } else {
            const myDb = dbTools.getClientMongo().db('users');
            const myCollection = myDb.collection('credentials');

            myCollection.find({
                $and: [
                    {pseudo: req.body['login-id']},
                    {password: req.body['login-password']}
                ]
            }).toArray(function (err, documents) {
                if (err) {
                    console.log('impossible de se connecter à la collection credentials');
                    next(err);
                } else {
                    
                    if (documents.length === 0) {
                        dataBox.messageLogin = "Ce compte n'existe pas. Veuillez entrer des identifiants corrects ou créer un nouveau compte";
                        res.render('home', dataBox);
                    } else {
                        // ajout des _id et nom du joueur dans la session
                        req.session.user_id = documents[0]._id;
                        req.session.pseudo = documents[0].pseudo;
                        req.session.sessionID = req.sessionID;
                        req.session.ioID = req.cookies.io;
                        res.redirect('/quiz/accueil');
                    }
                }
            });
        }
    });
});


module.exports = router;