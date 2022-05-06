var express = require('express');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var fft = require('fft-js').fft;
var categoryFinder = require('./categoryFinder.js');
var dataRedefinder = require('./dataRedefinder.js');

module.exports = {
  /* GET home page. */
  index: function(req, res, next){
    res.render('index');
  },
  main: function(req,res,next){
    res.render('setting');
  },
  streamPage: function(req,res,next){
    console.log('stream');
    res.render('streamPage');
  },
  /* get data */
  getVideoList: function(req,res,next){
    fs.readdir('./public/videos', function(error, filelist){
      res.json([{videolist: filelist}]);
    });
  },
  getVideoCategory: function(req,res,next){
    categoryFinder.default(`./public/videodatas/${req.params.video}.csv`, function(category){
      var cate = Array.from(category);
      res.json([{category: cate}]);
    });
  },
  getObjectData: function(req,res,next){
    var filepath = `./public/videos/${req.params.video}.mp4`;
    ffmpeg.ffprobe(filepath, function(err, metadata){
      if (err) {
        console.log("MetaData not Found. " + err);
        res.status(err.status || 500);
        res.render('error');
      } else {
        var totalFrame = metadata.streams[0].nb_frames;
        var frame = Math.round(eval(metadata.streams[0].r_frame_rate));
        var target = req.params.cate;
        var timerange = req.params.timerange;
        dataRedefinder.default(`./public/videodatas/${req.params.video}.csv`, target, totalFrame, frame, timerange,function(refineData){
          var signal = [1,0,1,0];
          var fftspeed = fft(signal);
          var analysisData = [{
            minute: refineData.minute,
            seconds: refineData.seconds,
            time: refineData.time,
            count: refineData.count,
            speeds: refineData.speed,
            fftspeed: fftspeed,
          }];
          console.log(fftspeed);

          res.json(analysisData);
        });
      }
    });
  },
  getObjectBox: function(req, res, next){
    var filepath = `./public/videos/${req.params.video}.mp4`;
    ffmpeg.ffprobe(filepath, function(err, metadata){
      if (err) {
        console.log("MetaData not Found. " + err);
        res.status(err.status || 500);
        res.render('error');
      } else {
        var totalFrame = metadata.streams[0].nb_frames;
        var frame = Math.round(eval(metadata.streams[0].r_frame_rate));
        var time = req.params.times;
        var target = req.params.cate;
        var timerange = req.params.timerange;
        dataRedefinder.getBbox(`./public/videodatas/${req.params.video}.csv`, target, totalFrame, frame, time, timerange,function(bbox){
          res.json(bbox);
        });
      }
    });
  },

  /* video controls */
  makeStreamVideo: function(req,res,next){
    var timerange = req.params.timerange;
    var filepath = `./public/videos/${req.params.videoname}.mp4`;
    var tempDir = `./public/temp/${req.params.videoname}${req.params.times}_range_${timerange}.mp4`;
    var times = `${req.params.times}`* timerange;
    var makeVideo = new Promise((resolve, reject) =>{
      ffmpeg(filepath)
      .setStartTime(times)
      .setDuration(timerange)
      .save(tempDir)
      .on('end', function(){
        resolve();
      })
      .on('error', function(){
        reject();
      });
    });
    makeVideo
    .then(()=>{
      res.status(200).send();
    })
    .catch(()=>{
      res.status(500);
      res.render('error');
    });
  },
  streamVideo: function(req,res,next){
    const fileName = `./public/temp/${req.params.videoname}${req.params.times}_range_${req.params.timerange}.mp4`;
    const fileStat = fs.statSync(fileName);
    const size = fileStat.size;
    const range = req.header.range;
    // 범위에 대한 요청이 있을 경우
    if (range) {
      // bytes= 부분을 없애고 - 단위로 문자열을 자름
      const parts = range.replace(/bytes=/, '').split('-');
      // 시작 부분의 문자열을 정수형으로 변환
      const start = parseInt(parts[0]);
      // 끝 부분의 문자열을 정수형으로 변환 (끝 부분이 없으면 총 파일 사이즈에서 - 1)
      const end = parts[1] ? parseInt(parts[1]) : size - 1;
      // 내보낼 부분의 길이
      const chunk = end - start + 1;
      // 시작 부분과 끝 부분의 스트림을 읽음
      const stream = fs.createReadStream(fileName, { start, end });
      // 응답
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunk,
        'Content-Type': 'video/mp4'
      })
      // 스트림을 내보냄
      stream.pipe(res);
    } else {
      // 범위에 대한 요청이 아님
      res.writeHead(200, {
        'Content-Length': size,
        'Content-Type': 'video/mp4'
      })
      // 스트림을 만들고 응답에 실어보냄
      fs.createReadStream(fileName).pipe(res);
    }
  }
}
