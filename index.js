/**
 * Created by HAZE on 6/1/2016.
 * Updated for Auth by lrossy on 7/7/2016
 */
var GoogleSpreadsheet = require('google-spreadsheet'),
  json2csv = require('json2csv'),
  knox  = require('knox'),
  moment = require('moment'),
  _ = require('lodash'),
  EventEmitter = require('events').EventEmitter,
  util = require('util');

var drive2s3 = function(opts){
  var self    = this;

  self.key     = opts.key;
  self.secret  = opts.secret;
  self.bucket     = opts.bucket;
  self.connected     = false;

  // Create the S3 Client

  var client = knox.createClient({
    key: self.key,
    secret: self.secret,
    bucket: self.bucket
  });
  console.log(self.key, self.secret, self.bucket);

  // Test the S3 client connection if not throw a error
  client.list({ prefix: '*' }, function(err, data){
    if(err){
      self.emit('error', err);
    }else{
      self.connected=true;
    }
  });


  /**
   *
   * @param arr
   */

  var keyMapper = function(arr){
    console.log('arr', arr)
    var ret = {
      keys:[],
      rows:[]
    }
    var keys = [];
    _.forEach(arr,function(row){
      var rowKeys = _.keys(row);
      var dateKey = rowKeys[0];
      var date = row[dateKey];
      var parsedDate = moment(date,"MM/DD/YYYY HH:mm.ss").format("YYYY-MM-DDTHH");
      var parts = parsedDate.split("T");
      var hour = _.last(parts);
      var range = roundDown(hour, 0);
      row[dateKey] = parts[0] + 'T' + range + ':00:00';
      ret.keys =_.union(ret.keys, rowKeys);
      ret.rows.push(row);

    });
    return ret;
  };

  /**
   *
   * @param number
   * @returns {*}
   */
  function roundDown(number) {
    if(!isEven(number)){
      number--;
      if(number < 10){
        number = '0'+number;
      }
    }
    return number;
  }

  /**
   *
   * @param n
   * @returns {boolean}
   */
  function isEven(n) {
    return n % 2 == 0;
  }


  /**
   *
   * @param id
   * @param path
   * @param next
   */
  var fetch = function(id,path,next){
    if(typeof next !== "function"){
      next = function(){};
    }

    var doc = new GoogleSpreadsheet(id);
    var creds_json = {
      client_email: process.env.GOOGLE_SERVICE_ACCT,
      private_key: process.env.GOOGLE_PRIVATE_KEY
    };
    // var creds = require('somefile.json');
    doc.useServiceAccountAuth(creds_json, function(){
      doc.getInfo(function(err, info) {

        if(err){
          console.error('Could not access the spreadsheet.');
          return next('Could not access the spreadsheet.');
        }
        // console.log('Loaded doc: '+info.title+' by '+info.author.email);
        sheet = info.worksheets[0];
        // console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
        sheet.getRows({}, function( err, rows ){
          // console.log('Read '+rows.length+' rows');

          rows.forEach(function(r){
            // todo: find a better way to strip out all non data fields
            delete r._xml;
            delete r.id;
            delete r.save;
            delete r.del;
            delete r._links;
            delete r['app:edited'];
          });
          var mapped = keyMapper(rows);
          // console.log('mapped', mapped);

          json2csv({ data: mapped.rows, fields: mapped.keys }, function(err, csv) {
            if (err) {
              self.emit('error', err);
              return next(err);
            }
            var req = client.put('/'+path+'/custom.csv', {
              'x-amz-acl': 'public-read',
              'Content-Length': Buffer.byteLength(csv)
              , 'Content-Type': 'application/csv'
            });
            req.on('response', function(res){
              if (200 == res.statusCode) {
                self.emit('data', res);
                return next(null,res);
              }else{
                self.emit('error', 'unable to save to path ' + path);
                return next('unable to save');
              }
            });
            req.on('error', function(err) {
              self.emit('error', err);
              return next(err);
            });
            req.end(csv);
          });
        });
      });
    });
  };

  self.fetch = fetch;

};

util.inherits(drive2s3, EventEmitter);
module.exports = drive2s3;