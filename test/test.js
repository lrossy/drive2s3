/**
 * Created by HAZE on 6/1/2016.
 */

var Drive2s3 = require('./../index');

var drive2s3 = new Drive2s3({
  key: process.env.AWS_KEY
  , secret: process.env.AWS_SECRET
  , bucket: process.env.AWS_BUCKET
});

drive2s3.on('error',function(err){
  console.error(err)
})

drive2s3.on('data',function(data){
  //console.log(data)
})

drive2s3.fetch('1xhaQIvv6hNqdppUcWepm-8A9tb-t0Py9v3CGc9g0x0w',193);

// drive2s3.fetch('1oNZ5TvEKqvbxHKnu4T9ZKvuKzYrHZ5opQInl0MZKJkA',193);


