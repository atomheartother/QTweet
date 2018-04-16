var fs = require('fs');
var config = require('./config.json');

// This is the stream variable, which handles receiving the twitter feed
var stream = null;

var users = require('./userList.js');

module.exports = {
    list : users,

    showList : listUsers,

    save : saveUsers,

    load : loadUsers,

    stream : createStream
};
