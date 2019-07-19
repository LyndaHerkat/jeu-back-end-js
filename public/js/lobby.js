'use strict';

window.addEventListener('DOMContentLoaded', function () {

    ///////LOBBY////////
    $('p.wait').hide();
    var socketClient = io();
    //Affichage des joueurs connectes
    socketClient.on('playersAvailableList', function (data) {
        console.log("TCL: data", data);

        $('div#players-connected p').remove();

        data.forEach(function (elmt) {
            console.log('tour de manège');
            var pPlayerName = $("<p></p>").text(elmt);
            $('div#players-connected').append(pPlayerName);
        });
    });

    //Click Rejoindre une partie lobby
    $('a.ready').click(function (e) {
        e.preventDefault();
        socketClient.emit('ready');
    });

    //Click deconnection
    $('a.deconnection').click(function(){
        socketClient.close();
    });

    //Attente d'un second joueur lobby
    socketClient.on('wait', function () {
        $('p.wait').show();
    });

    //Lancement du jeu + decompte + chrono 
    var clearCounter;
    var counter = 6;
    var finish = function () {
        clearInterval(clearCounter);
    };
    var count = function(){
        counter--;
        if (counter === -1) {
            finish();
            $('p.count').html('GO');
            socketClient.emit('askChrono');
        } else {
            $('p.count').html(counter);
        }
    };

    var start = function(){
        clearCounter = setInterval(count, 1000);
    };


    socketClient.on('letsgo', function () {
        $('p.wait').hide();
        $('a.ready').hide();
        start();
        // socketClient.emit('askChrono');
    });

    socketClient.on('sendChrono', function(data){
        $('p.chrono span.seconds').html(data.time);
    });


});