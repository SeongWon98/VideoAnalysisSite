var parse = require("csv-parse");
var fs = require("fs");

var csvData = [];
var redefine ={};
var refineData = {};
var unrefineData = {};
function dataExtraction(cate, objData, max, frame){
  var counter = Array.from({length: max}, () => 0);
  var distance = Array.from({length: max}, () => 0);
  var i = 0;
  while(i < objData.length){
    if (objData[i][3]== cate){
      var data = objData[i][4].substring(1,objData[i][4].length-1);
      data = data.split(", ");
      var location = objData[i][2].replaceAll('[','');
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
      var acc = objData[i][2].replaceAll('[','');
      acc = acc.replaceAll(']','');
      acc= acc.split(',');
      for(var j in data){
        // 출현한 프레임
        if(acc[j]>0.98){
          if(data[j]==2)counter[0]++;
          counter[data[j]-1]++;
          // 각프레임을 간격으로 이동거리 구하기
          if(locX[j-1]>0 && locY[j-1]>0){
            let temp = Math.abs(locX[j-1] - locX[j]) + Math.abs(locY[j-1] - locY[j]);
            temp = parseInt(temp);
            distance[data[j]-2] += temp;
          }
        }
      }
    }
    i++;
  }
  var i = 0, k = 0;
  var count = Array.from({length: parseInt(max/frame)+1}, () => 0);
  var speed = Array.from({length: parseInt(max/frame)+1}, () => 0);
  while(i < max){
    count[k] = count[k]+counter[i];
    speed[k]= speed[k]+distance[i];
    if(i != 0&&i % frame == 0){
      if(count[k] > 0 && count[k] < frame)count[k] = 1;
      else count[k] = parseInt(count[k]/frame);
      if(count[k]!= 0)speed[k]= parseInt(speed[k]/frame/count[k]);
      else speed[k] = 0;
      k++;
    }
    else if(i == max-1){
      if(count[k] > 0 && count[k] < (i%frame))count[k] = 1;
      else count[k] = parseInt(count[k]/(i%frame));
      if(count[k]!= 0)speed[k]= parseInt(speed[k]/(i%frame)/count[k]);
      else speed[k] = 0;
      k++;
    }
    i++;
  }
  eval("refineData."+cate+"_count = count;");
  eval("refineData."+cate+"_speed = speed;");
}

function timeSet(frame, max, timerange){
  var i = 0, k = 0;
  var minute= Array.from({length: parseInt(max/frame)+1}, () => 0);
  var seconds= Array.from({length: parseInt(max/frame)+1}, () => 0);
  var time = Array.from({length: parseInt(max/frame)+1}, () => 0);
  var timeframe = frame/timerange;
  while(i < max){
    if(i != 0&&i % frame == 0){
      minute[k] = parseInt(i/timeframe/60);
      seconds[k] = i/timeframe % 60;
      time[k]= minute[k]+":"+seconds[k];
      k++;
    }
    else if(i == max-1){
      minute[k] = parseInt(i/timeframe/60);
      seconds[k] = parseInt(i/timeframe % 60);
      time[k]= minute[k]+":"+seconds[k];
      k++;
    }
    i++;
  }
  refineData.minute = minute;
  refineData.seconds = seconds;
  refineData.time = time;
}

redefine.default = function(originalCsv, cate, totalFrame, frame, timerange,callback){
  fs.createReadStream(originalCsv)
  .pipe(
    parse.parse({
      delimiter: ','
    })
  )
  .on('data', function(dataRow){
    if(cate.includes(dataRow[3]))csvData.push(dataRow);
  })
  .on('end', function(){
    timeSet(frame*timerange, totalFrame, timerange);
    for(var l = 0; l < cate.length; l++){
      dataExtraction(cate[l], csvData, totalFrame, frame*timerange);
    }
    csvData = [];
    callback(refineData);
  });
}

function objectFrameBbox(objData, totalFrame){
  var bbox = Array.from({length: totalFrame}, () => '');
  var i=0;
  while(i < objData.length){
    var data = objData[i][4].substring(1,objData[i][4].length-1);
    data = data.split(", ");
    var box = objData[i][7].substring(2,objData[i][7].length-2);
    box = box.split("], [");
    var acc = objData[i][2].replaceAll('[','');
    acc = acc.replaceAll(']','');
    acc= acc.split(',');
    for(var j in data){
      if(acc[j]> 0.98){
        if(bbox[data[j]] != '')bbox[data[j]] +=', ';
        bbox[data[j]] += box[j];
      }
    }
    i++;
  }
  return bbox;
}

redefine.getBbox = function(originalCsv, cate, totalFrame, frame, time, timerange,callback){
  fs.createReadStream(originalCsv)
  .pipe(
    parse.parse({
      delimiter: ','
    })
  )
  .on('data', function(dataRow){
    if(cate.includes(dataRow[3]))csvData.push(dataRow);
  })
  .on('end', function(){
    var bbox = objectFrameBbox(csvData, totalFrame);
    var start = parseInt(time*1.5/timerange)+time * timerange * frame;
    var end = parseInt(time*1.5/timerange)+time * timerange * frame + timerange* frame;
    csvData = [];
    callback(bbox.slice(start, end));
  });
}


module.exports = redefine;
