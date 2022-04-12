var parse = require('csv-parse');
var fs = require('fs');

var category=new Set();
var categoryM={};

categoryM.default = function(originalCsv, callback){
  fs.createReadStream(originalCsv)
  .pipe(
    parse.parse({
      delimiter:','
    })
  )
  .on('data', function(dataRow){
    if(category.has(dataRow[3]) == false){
        category.add(dataRow[3]);
      }
  })
  .on('end', function(){
    callback(category);
    category.clear();
  });
}

module.exports=categoryM;
