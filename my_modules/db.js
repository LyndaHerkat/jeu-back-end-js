'use strict';

let mongodb = require('mongodb');
let MongoClient = mongodb.MongoClient; // on instancie MongoCLient
//https://github.com/mongodb/node-mongodb-native/blob/master/lib/mongo_client.js


var state = {
    client: null,
};

exports.connectClientMongo = function (url, option, done) {
    if (state.client) {
        return done();
    }

    MongoClient.connect(url, option, function (err, client) {
        if (err) {
            return done(err);
        }
        state.client = client;
        done();
    });
};

exports.getClientMongo = function () {
    return state.client;
};

exports.closeClientMongo = function (done) {
    if (state.client) {
        state.client.close(function (err, result) {
            state.client = null;
            state.mode = null;
            if (err) {
                done(err);
            }
        });
    };
};