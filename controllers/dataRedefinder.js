var parse = require("csv-parse");
var fs = require("fs");

var csvData = [];
var redefine = {};
var unrefineData = {
  counter:[],
  distance:[],
}
var refineData = {
  minute:[],
  seconds:[],
  count:[],
  speed:[],
}

function dataExtraction(objData, max){
  var counter = Array.from({length: max}, () => 0);
  var distance = Array.from({length: max}, () => 0);
  var i = 0;
  while(i < csvData.length){
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

    for(var j in data){
      // 출현한 프레임
      if(data[j]==2)counter[0]++;
      counter[data[j]-1]++;
      // 각프레임을 간격으로 이동거리 구하기
      if(locX[j-1]>0 && locY[j-1]>0){
        let temp = Math.abs(locX[j-1] - locX[j]) + Math.abs(locY[j-1] - locY[j]);
        temp = parseInt(temp);
        distance[data[j]-2] += temp;
      }
    }
    i++;
  }
  unrefineData.counter = counter;
  unrefineData.distance = distance;
}

function reestablish(frame, max){
  var i = 0, k = 0;
    var minute= Array.from({length: parseInt(max/frame)+1}, () => 0);
    var seconds= Array.from({length: parseInt(max/frame)+1}, () => 0);
    var count = Array.from({length: parseInt(max/frame)+1}, () => 0);
    var speed = Array.from({length: parseInt(max/frame)+1}, () => 0);
    var timeframe = frame/10;
    while(i < max){
      count[k] = count[k]+unrefineData.counter[i];
      speed[k]= speed[k]+unrefineData.distance[i];
      if(i != 0&&i % frame == 0){
        if(count[k] > 0 && count[k] < frame)count[k] = 1;
        else count[k] = parseInt(count[k]/frame);
        minute[k] = parseInt(i/timeframe/60);
        seconds[k] = i/timeframe % 60;
        if(count[k]!= 0)speed[k]= parseInt(speed[k]/frame/count[k]);
        else speed[k] = 0;
        k++;
      }
      else if(i == max-1){
        if(count[k] > 0 && count[k] < (i%frame))count[k] = 1;
        else count[k] = parseInt(count[k]/(i%frame));
        minute[k] = parseInt(i/timeframe/60);
        seconds[k] = parseInt(i/timeframe % 60);
        if(count[k]!= 0)speed[k]= parseInt(speed[k]/(i%frame)/count[k]);
        else speed[k] = 0;
        k++;
      }
      i++;
    }
    refineData.minute = minute;
    refineData.seconds = seconds;
    refineData.count = count;
    refineData.speed = speed;
}

function frameLength(csvData){
  var i = csvData.length - parseInt(csvData.length / 4);
  var max = parseInt(0);
  var frame = 150;

  while(i < csvData.length){
    var data = csvData[i][4].substring(1,csvData[i][4].length-1);
    data = data.split(", ");
    if(max < parseInt(data[data.length-1]))max = parseInt(data[data.length-1]);
    i++;
  }
  return max;
}

redefine.default = function(originalCsv, cate, totalFrame, frame, callback){
  fs.createReadStream(originalCsv)
  .pipe(
    parse.parse({
      delimiter: ','
    })
  )
  .on('data', function(dataRow){
    if(cate == dataRow[3])csvData.push(dataRow);
  })
  .on('end', function(){
    dataExtraction(csvData, totalFrame);
    reestablish(frame*10, totalFrame);
    csvData = [];
    callback(refineData);
  });
}

module.exports = redefine;