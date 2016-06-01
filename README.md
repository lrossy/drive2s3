Usage


````
var Drive2s3 = require('drive2s3');

var drive2s3 = new Drive2s3({
    key: 'AWS_KEY'
    , secret: 'AWS_SECRET'
    , bucket: 'AWS_BUCKET'
});

drive2s3.on('error',function(err){
    console.error(err)
})

drive2s3.on('data',function(data){
    //console.log(data)
})

drive2s3.fetch('1oNZ5TvEKqvbxHKnu4T9ZKvuKzYrHZ5opQInl0MZKJkA',193,function(err,data){

});
````


Methods :

fetch(googleDocID,path,callback)
