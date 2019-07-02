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
let dbTools = require('../my_modules/db');

//Variable de transfert de donnes entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.all('/inscription/check', function (req, res, next) {
    let URI = 'mongodb+srv://lynda_admin:ugdyEBGb64bug44X@clusterquizz-2hfjf.mongodb.net/test?retryWrites=true&w=majority';
    //Requete AJAX pour tester la presence de l'identifiant lors du sign-in
    if (req.xhr) {
        // let URI = ;
        dbTools.connectClientMongo(URI, {
            useNewUrlParser: true
        }, function (err) {
            if (err) {
                console.log('Impossible de se connecter au client Mongo');
                next(err);
            } else {
                const myDb = dbTools.getClientMongo().db('users');
                const myCollection = myDb.collection('credentials');
                let myProjection = {
                    pseudo: 1,
                    _id: 0
                };
                myCollection.find({}, {
                    projection: myProjection
                }).toArray(function (err, data) {
                    dbTools.closeClientMongo();
                    if (err) {
                        console.log('Impossible de se connecter à la base users');
                    } else {
                        console.log('requete ajax recu par le serveur');
                        res.json(data);
                    }
                });
            }
        });
    } else {
        //insertion des nouveaux identifiants

        let user = {
            pseudo: req.body['signin-id'],
            password: req.body['signin-password']
        }

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
                    pseudo: req.body['signin-id']
                }, function (err, data) {
                    if (err) {
                        console.log('impossible de se connecter à la collection credentials');
                        dbTools.closeClientMongo();
                        next(err);
                    } else {
                        myCollection.insertOne(user, function (err, result) {
                            if (err) {
                                next(err);
                            } else {
                                // ajout des _id et nom du joueur dans la session
                                req.session.user_id = result.ops[0]._id;
                                req.session.pseudo = result.ops[0].pseudo;

                                dataBox.session = req.session;
                                dataBox.title = 'Vérification de la connexion';
                                dataBox.h1 = 'Vérification de la connexion';
                                // dataBox.pseudo = req.body['signin-id'];
                                res.render('home2', dataBox);

                            }
                            dbTools.closeClientMongo();

                        });
                    }
                });

            }
        });

    }

});


module.exports = router;