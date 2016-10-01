var child_process = require("child_process");
var fs = require('fs');
var partners = require('../config.partners');

var connstr = process.argv[2];

for (p in partners) {
    child_process.exec('node tools/export.js '+p+' '+connstr+' > exports/'+p+'.csv');
}
