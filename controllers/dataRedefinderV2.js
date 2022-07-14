var parse = require("csv-parse");
var fs = require("fs");

var csvData = [];
var redefine ={};
// function objectFrameBbox(objData, totalFrame){
//   var bbox = Array.from({length: totalFrame}, () => '');
//   var i=0;
//   while(i < objData.length){
//     var data = objData[i][4].substring(1,objData[i][4].length-1);
//     data = data.split(", ");
//     var box = objData[i][7].substring(2,objData[i][7].length-2);
//     box = box.split("], [");
//     var acc = objData[i][2].replaceAll('[','');
//     acc = acc.replaceAll(']','');
//     acc= acc.split(',');
//     for(var j in data){
//       if(acc[j]> 0.98){
//         if(bbox[data[j]] != '')bbox[data[j]] +=', ';
//         bbox[data[j]] += box[j];
//       }
//     }
//     i++;
//   }
//   return bbox;
// }

redefine.getBbox = function(originalCsv, totalFrame, callback){
  var bbox = Array.from({length: totalFrame}, () => '');
  fs.createReadStream(originalCsv)
  .pipe(
    parse.parse({
      delimiter: ','
    })
  )
  .on('data', function(dataRow){
    var data = dataRow[4].substring(1,dataRow[4].length-1);
    data = data.split(", ");
    var box = dataRow[7].substring(2,dataRow[7].length-2);
    box = box.split("], [");
    for(var j in data){
      if(bbox[data[j]] != '')bbox[data[j]] +=', ';
      bbox[data[j]] += box[j];
    }
  })
  .on('end', function(){
    var box = {
      bbox : bbox
    }
    callback(box);
  });
}

redefine.rangeData = function(originalCsv, frame, time, timerange, callback){
  var start = parseInt(time*1.5/timerange)+time * timerange * frame;
  var end = parseInt(time*1.5/timerange)+time * timerange * frame + timerange* frame;
  var range = timerange * frame;
  var cate = [];
  var cateNum = [];
  var test = 0;
  fs.createReadStream(originalCsv)
  .pipe(
    parse.parse({
      delimiter: ','
    })
  )
  .on('data', function(dataRow){
    if(dataRow[3] != 'class_name'){
      if(!cate.includes(dataRow[3])){
        cate.push(dataRow[3]);
        cateNum.push(0);
      }
      var idx = cate.indexOf(dataRow[3]);
      var data = dataRow[4].substring(1,dataRow[4].length-1);
      data = data.split(", ");
      var temp = 0;
      for(var i = 0; i < data.length; i++){
        if(i == data.length-1){
          temp = temp/range;
          if(temp > 0.3)cateNum[idx] = cateNum[idx]+ 1;
        }
        else if(data[i] >= start &&data[i] <= end){
          temp += 1;
        }
        else if(data[i] > end){
          temp =temp/range;
          if(temp > 0.3)cateNum[idx] += 1;
          temp = 0;
          break;
        }
      }
    }
  })
  .on('end', function(){
    console.log(start +' '+ end);
    result = {
      cate : cate,
      cateNum : cateNum,
    }
    console.log(result);
    callback(result);
  });
}

redefine.getObjData = function(originalCsv, cate, totalFrame, frame, timerange,callback){
  var start = 0;
  var range = frame * timerange;
  var size = parseInt(totalFrame/range)+1
  var end = 0;
  var targetSpeed = Array.from({length: size}, () => 0);
  var targetNum = Array.from({length: size}, () => 0);
  fs.createReadStream(originalCsv)
  .pipe(
    parse.parse({
      delimiter: ','
    })
  )
  .on('data', function(dataRow){
    if(dataRow[3] == cate){
      var data = dataRow[4].substring(1,dataRow[4].length-1);
      data = data.split(", ");
      var idx = parseInt(data[0]/range);

      start = parseInt(idx * range);
      end = parseInt(idx * range) + range;

      var location = dataRow[2].replaceAll('[','');
      location = location.replaceAll(']','');
      location = location.split(', ');
      var locX = Array.from({length: parseInt(location.length/2)}, () => 0);
      var locY = Array.from({length: parseInt(location.length/2)}, () => 0);
      var idxX = 0;
      var idxY = 0;
      for(var j in location){
        if(j % 2 == 0){
          locX[idxX] = parseInt(location[j]);
          idxX++;
        }
        else {
          locY[idxY] = parseInt(location[j]);
          idxY++;
        }
      }
      
      // console.log(data[0] + " " + data[data.length-1] + " " + dataRow[3]);
      var temp = 0;
      var dis = 0;
      for(var i = 0; i < data.length; i++){
        if(i == data.length-1){
          temp = temp/range;
          if(temp > 0.3)targetNum[idx] = targetNum[idx]+ 1;
          if(dis > 0.3)targetSpeed[idx]= targetSpeed[idx]+dis;
        }
        else if(data[i] >= start && data[i] <= end){
          temp += 1;
          // if(data[0]== 148)console.log(idx + " " + start + " " + end + " " + i + " " + data.length);
          if(i > 0){
            var tmpDis = Math.abs(locX[i-1] - locX[i]) + Math.abs(locY[i-1] - locY[i]);
            tmpDis = parseInt(tmpDis);
            dis += tmpDis;
          }
          
        }
        else if(data[i] > end){
          temp = temp/range;
          if(temp > 0.3)targetNum[idx] = targetNum[idx]+ 1;
          if(dis > 0.3)targetSpeed[idx]= targetSpeed[idx]+dis;
          // if(data[0]== 148)console.log(data);
          temp = 0;
          dis = 0;
          start = start + range;
          end = end + range;
          idx++;
          i--;
        }
      }
    }
  })
  .on('end', function(){
    for(var i = 0; i < targetSpeed.length; i++){
      targetSpeed[i] = (targetNum[i] == 0) ? 0 : parseInt(targetSpeed[i]/range/targetNum[i]);
    }
    var i = 0, k = 0;
    var minute= Array.from({length: size}, () => 0);
    var seconds= Array.from({length: size}, () => 0);
    var time = Array.from({length: size}, () => 0);
    while(i < totalFrame){
      if(i != 0&&i % range == 0){
        minute[k] = parseInt(i/frame/60);
        seconds[k] = i/frame % 60;
        time[k]= minute[k]+":"+seconds[k];
        k++;
      }
      else if(i == totalFrame-1){
        minute[k] = parseInt(i/frame/60);
        seconds[k] = parseInt(i/frame % 60);
        time[k]= minute[k]+":"+seconds[k];
        k++;
      }
      i++;
    }
    result = {
      targetNum : targetNum,
      targetSpeed : targetSpeed,
      time : time,
      minute : minute,
      seconds : seconds,
    }
    callback(result);
  });
}
module.exports = redefine;