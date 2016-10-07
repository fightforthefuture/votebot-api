var fs = require('fs');
var Promise = require('bluebird');
var parse = Promise.promisify(require('csv-parse'));

var partners = require('../config.partners');
var db = require('../lib/db');
var util = require('../lib/util');
var user_model = require('../models/user');
var conversation_model = require('../models/conversation');


var inputFile = process.argv[2];
var file = fs.readFileSync(inputFile);

var headerKeys;
var options ={
  trim: true,
  relax_column_count: true
};

parse(file, options).then(function(rows) {
  rows.forEach(function(r) {
    var num_from = '+1'+r[0];
    var body = r[2];
    
    return check_conversation_partner(num_from, body);
  });
}).catch(function(err) {
  console.error(err);
});

var check_conversation_partner = function(username, body) {
    var convPartner = null,
        trimBody = body ? body.trim().toLowerCase() : '';
    for (var partner in partners) {
        if (partners.hasOwnProperty(partner)) {
            if (trimBody == partners[partner].intro_shortcode) {
                convPartner = partner;
            }
        }
    }
    if(convPartner) {
        return user_model.get_by_username(username).then(function(user) {
            return conversation_model.get_recent_by_user(user.id).then(function(conversation) {
                console.log('user '+user.id+
                            ' conversation '+conversation.id+
                            ' partner '+conversation.partner+
                            ' keyword '+trimBody);
                if (!conversation.partner) {
                    console.log('- setting partner', convPartner);
                    return conversation_model.update(conversation.id, {partner: convPartner});
                }
            });
        });
    }
};