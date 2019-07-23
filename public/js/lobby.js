'use strict';

window.addEventListener('DOMContentLoaded', function () {

    ///////LOBBY////////
    $('p.wait').hide();
    $('p.chrono').hide();
    $('p.score').hide();
    $('p.question').hide();
    $('p.count').hide();
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
    $('a.deconnection').click(function () {
        socketClient.close();
    });

    //Attente d'un second joueur lobby
    socketClient.on('wait', function (player_username) {
        var pPlayerName = $("<p></p>").text(player_username);
        $('div#players-ready').append(pPlayerName);
        $('p.wait').show();
        $('a.ready').hide();
    });

    //Lancement du jeu + decompte + chrono 
    var clearCounter;
    var counter = 6;
    var finish = function () {
        clearInterval(clearCounter);
    };
    var count = function () {
        counter--;
        if (counter === 0) {
            finish();
            $('span.count').html('GO');
            socketClient.emit('askChrono');
            socketClient.emit('startQuestions');
        } else {
            $('span.count').html(counter);
        }
    };

    var start = function () {
        clearCounter = setInterval(count, 1000);
    };

    socketClient.on('letsgo', function () {
        $('p.wait').hide();
        $('a.ready').hide();
        $('p.count').show();
        $('div#players-ready').empty();
        start();
    });

    socketClient.on('sendChrono', function (data) {
        $('p.chrono span.seconds').html(data.time);
    });

    //Questions
    var questionNumber = 1;
    var round = 1;
    var freezeClick = false;
    socketClient.on('startQuestions', function (data) {
        freezeClick = false;
        console.log("TCL: data (question)", data);
        round = data.round;
        $('p.chrono').show();
        $('p.score').show();
        $('p.question').show();
        $('span.questionNumber').html(data.questionNumber);
        $('span.question').html(data.question);
        $('a#answer-a').html(data.answersTab[0]).css('background-color', 'white');
        $('a#answer-b').html(data.answersTab[1]).css('background-color', 'white');
        $('a#answer-c').html(data.answersTab[2]).css('background-color', 'white');
        $('a#answer-d').html(data.answersTab[3]).css('background-color', 'white');
        $('p.littleStory').text('');
    });

    $('a.answer').click(function (e) {
        e.preventDefault();
        if (freezeClick === false) {
            var answerToCheck = {
                answer: $(this).text(),
                id: $(this).attr('id'),
                questionNumber: questionNumber,
                round: round
            };
            console.log("TCL: answerToCheck", answerToCheck);
            socketClient.emit('checkAnswer', answerToCheck);
        }
    });

    socketClient.on('rightAnswer', function (correction) {
        freezeClick = true;
        console.log("TCL: correction", correction);
        $('span.score').html(correction.score);

        $('p.littleStory').text(correction.littleStory)
        var answerRef = "#" + correction.answerRef;
        $(answerRef).css('background-color', 'green');
        questionNumber++;
        setTimeout(function () {
            socketClient.emit('nextQuestion');
        }, 5000);
    });

    socketClient.on('wrongAnswer', function (correction) {
        // $('span.question p').on('mouseover', function(){
        //     $('a.answer').off('click');
        // });
        freezeClick = true;
        console.log("TCL: correction", correction);
        $('p.littleStory').text(correction.littleStory)
        var answerRef = "#" + correction.answerRef;
        $(answerRef).css('background-color', 'red');
        var goodAnswerRef = "#" + correction.goodAnswerRef;
        $(goodAnswerRef).css('background-color', 'green');
        questionNumber++;
        setTimeout(function () {
            socketClient.emit('nextQuestion');
        }, 3000);
    });

    //Arret du jeu
    socketClient.on('stopGame', function () {
        $('span.question').html('');
        $('p.littleStory').html('');
        $('a.answer').html('');
    });


});
// quiz potentielement à problème
// 5d1c6c2bc667ad6a524089b8
// 5d1c6c2bc667ad6a524089b8
// 5d1c6c2bc667ad6a524089b8