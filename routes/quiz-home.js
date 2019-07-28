'use strict';

const express = require('express');
const router = express.Router();
let dbTools = require('../my_modules/db');

//Variable de transfert de donnes entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.get('/quiz/accueil', function (req, res, next) {

    dbTools.connectClientMongo(dbTools.URI, {
        useNewUrlParser: true
    }, function (err) {
        if (err) {
            console.log('Impossible de se connecter au client Mongo');
            next(err);
        } else {
            const myDb = dbTools.getClientMongo().db('users');
            const myCollection = myDb.collection('games');

            myCollection.find({}, {
                projection : {_id : 0},
                sort : {date : -1},
                limit : 10
            }).toArray(function (err, documents) {
                if (err) {
                    console.log('impossible de se connecter à la collection games');
                    next(err);
                } else {
                    
                    if (documents.length === 0) {
                        console.log('Pas de match a affcicher pour le moement');
                    } else {
                        dataBox.scoresTab = documents;
                    }
                }
                dataBox.session = req.session;
                dataBox.title = 'Accueil quiz';
                dataBox.h1 = 'Accueil quiz';
                res.render('quiz-home', dataBox);
            });
        }
    });



    

});


module.exports = router;