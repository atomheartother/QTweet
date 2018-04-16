var Twitter = require('twitter');
var pw = require('./pw.json');

var tClient = new Twitter({
    consumer_key: pw.tId,
    consumer_secret: pw.tSecret,
    access_token_key: pw.tToken,
    access_token_secret: pw.tTokenS
});

module.exports = tClient;
