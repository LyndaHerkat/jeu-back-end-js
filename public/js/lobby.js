'use strict';

window.addEventListener('DOMContentLoaded', function () {

    ///////LOBBY////////
    $('p.wait, p.chrono, p.score, p.question, p.count, div.final-score, div.questions').hide();
    
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
        $('.welcome-screen').css('display', 'block');
        $('.game-screen').css('display', 'none');
        socketClient.emit('ready');
    });

    //Click deconnection
    $('a.deconnection').click(function () {
        socketClient.close();
    });

    //Attente d'un second joueur lobby
    socketClient.on('wait', function () {
        $('p.wait').show();
        $('a.ready').hide();
    });
    socketClient.on('waitingPlayer', function (player_username) {
        var pPlayerName = $("<p></p>").text(player_username);
        $('div#players-ready').append(pPlayerName);
    });

    //Lancement du jeu + decompte + chrono 
    var clearCounter;
    var counter = 6;
    var finish = function () {
        clearInterval(clearCounter);
    };
    var count = function () {
        console.log('entrée dans la fonction count()');
        counter--;
        console.log("TCL: count -> counter", counter)
        if (counter <= 0) {
            console.log('entrée dans la fonction count() condition if counter === 0');
            finish();
            $('p.count span.message').empty();
            socketClient.emit('askChrono');
            socketClient.emit('startQuestions');
        } else {
            console.log('entrée dans la fonction count() condition if counter != 0');
            $('span.count').html(counter);
        }
    };
    
    var start = function () {
        console.log('entrée dans la fonction start()');
        clearCounter = setInterval(count, 1000);
    };
    
    socketClient.on('letsgo', function () {
        console.log('entrée dans la socketClient.on letsgo');
        $('div.final-score').hide();
        $('p.wait, a.ready').hide();
        $('p.count, p.littleStory').show();
        $('div#players-ready').empty();
        $('.welcome-screen').css('display', 'none');
        $('.game-screen').css('display', 'block');
        $('span.score').html('0');
        $('p.count span.message').html('Début du Quiz dans ');
        $('p.count span.unity').html(' s');
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
        $('p.count span.message, p.count span.count, p.count span.unity').empty();
        $('p.chrono, p.score, div.questions, p.question').show();
        $('span.questionNumber').html(data.questionNumber);
        $('span.question').html(data.question);
        $('a#answer-a').html(data.answersTab[0]).css('background-color', '#E5BA44');
        $('a#answer-b').html(data.answersTab[1]).css('background-color', '#E5BA44');
        $('a#answer-c').html(data.answersTab[2]).css('background-color', '#E5BA44');
        $('a#answer-d').html(data.answersTab[3]).css('background-color', '#E5BA44');
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
        $(answerRef).css('background-color', '#9FCF67');
        questionNumber++;
        setTimeout(function () {
            socketClient.emit('nextQuestion');
        }, 5000);
    });

    socketClient.on('wrongAnswer', function (correction) {
        freezeClick = true;
        console.log("TCL: correction", correction);
        $('p.littleStory').text(correction.littleStory)
        var answerRef = "#" + correction.answerRef;
        $(answerRef).css('background-color','#CA5741');
        var goodAnswerRef = "#" + correction.goodAnswerRef;
        $(goodAnswerRef).css('background-color', '#9FCF67');
        questionNumber++;
        setTimeout(function () {
            socketClient.emit('nextQuestion');
        }, 3000);
    });

    //Arret du jeu
    socketClient.on('Preumsss', function(){
        socketClient.emit('onStoppeTout');
    });
    socketClient.on('stopGame', function () {
        $('div.questions').hide();
        $('p.littleStory').empty();
        $('p.chrono, p.score, p.question, p.littleStory').hide();
        socketClient.emit('stopChrono');
        counter = 6;
        // $('span.question, p.littleStory, a.answer').html('');
    });
    
    //Affichage du score final
    socketClient.on('finalScore', function(finalScores){
        console.log("TCL: finalScores", finalScores);
        $('div.final-score').show();
        $('div.final-score a.ready').show();
        $('div.player1 p.pseudo').html(finalScores[0].player);
        $('div.player2 p.pseudo').html(finalScores[1].player);
        $('div.player1 p.score-aff').html(finalScores[0].score);
        $('div.player2 p.score-aff').html(finalScores[1].score);
    });


});
// quiz potentielement à problème
// 5d1c6c2bc667ad6a524089b8
// 5d1c6c2bc667ad6a524089b8
// 5d1c6c2bc667ad6a524089b8