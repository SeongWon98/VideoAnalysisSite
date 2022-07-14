var parse = require('csv-parse');
var fs = require('fs');

var category=new Set();
var categoryTotal={};

categoryTotal.default = function(originalCsv, callback){
  fs.createReadStream(originalCsv)
  .pipe(
    parse.parse({
      delimiter:','
    })
  )
  .on('data', function(dataRow){
    if(category.has(dataRow[3]) == false && dataRow[3] != 'class_name'){
        category.add(dataRow[3]);
      }
  })
  .on('end', function(){
    callback(category);
    category.clear();
  });
}

module.exports=categoryTotal;
