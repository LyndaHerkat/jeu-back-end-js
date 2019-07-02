'use strict';

let express = require('express');
let router = express.Router();

let bodyParser = require('body-parser');

let dbTools = require('../my_modules/db');

//Variable de transfert de donnees entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.post('/connexion/check', function (req, res, next) {


    //Verification des identifiants de connections

    let user = {
        pseudo: req.body['login-id'],
        password: req.body['login-password']
    }

    let URI = 'mongodb+srv://lynda_admin:ugdyEBGb64bug44X@clusterquizz-2hfjf.mongodb.net/test?retryWrites=true&w=majority';
    dbTools.connectClientMongo(URI, {
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
                // dbTools.closeClientMongo();
                if (err) {
                    console.log('impossible de se connecter à la collection credentials');
                    next(err);
                } else {
                    
                    if (documents.length === 0) {
                        dataBox.messageLogin = "Ce compte n'existe pas. Veuillez entrer des identifiants corrects ou créer un nouveau compte";
                        res.render('home', dataBox);
                    } else {
                        req.session.user_id = documents[0]._id;
                        req.session.pseudo = documents[0].pseudo;

                        dataBox.session = req.session;
                        dataBox.title = 'Vérification de la connexion';
                        dataBox.h1 = 'Vérification de la connexion';
                        // dataBox.pseudo = req.body['login-id'];
                        res.render('home2', dataBox);
                    }
                }
            });

        }
    });

});


module.exports = router;