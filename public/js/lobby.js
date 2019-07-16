'use strict';

window.addEventListener('DOMContentLoaded', function () {
    $('p.wait').hide();
    var socketClient = io();

    socketClient.on('playersAvailableList', function(data){
        console.log("TCL: data", data);

        $('div#players-connected p').remove();
        
        data.forEach(function(elmt) {
            console.log('tour de manège');
            var pPlayerName = $("<p></p>").text(elmt);
            $('div#players-connected').append(pPlayerName);
        });
    });

    //Rejoindre une partie
    $('a.ready').click(function(e){
        e.preventDefault();
        socketClient.emit('ready');
    });

    socketClient.on('wait', function(){
        $('p.wait').show();
    });

    socketClient.on('letsgo', function(){
        $('p.wait').hide();
        window.location.href = "/quiz/game";
        // $('a.ready').click();
        // console.log('C\'est dartyyyyy mon kiki !!!');
    });


});