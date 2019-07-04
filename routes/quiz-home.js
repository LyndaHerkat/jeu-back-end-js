'use strict';

let express = require('express');
let router = express.Router();

//Variable de transfert de donnes entre le serveur et les vues
let dataBox = {}; //on vide dataBox a chaque requete

router.get('/quiz/accueil', function (req, res, next) {
    console.log("TCL: req.session", req.session)
    // console.log("TCL: req.body", req.body)


    // let URI = 'mongodb+srv://lynda_admin:ugdyEBGb64bug44X@clusterquizz-2hfjf.mongodb.net/test?retryWrites=true&w=majority';

    dataBox.session = req.session;
    dataBox.title = 'Accueil quiz';
    dataBox.h1 = 'Accueil quiz';
    res.render('quiz-home', dataBox);

});


module.exports = router;