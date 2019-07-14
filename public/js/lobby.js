'use strict';

window.addEventListener('DOMContentLoaded', function () {

    var socketClient = io();

    console.log('coucou');
    
    socketClient.on('playersList', function(data){
        console.log("TCL: data", data);
        $('div#players-connected p').remove();
        
        data.forEach(function(elmt) {
            console.log('tour de manège')
            var pPlayerName = $("<p></p>").text(elmt);
            $('div#players-connected').append(pPlayerName);
        });
    });







});