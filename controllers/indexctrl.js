var express = require('express');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var categoryFinder = require('./categoryFind.js');
var dataRedefinder = require('./dataRedefinderV2.js');

module.exports={
    index: function(req, res, next){
        res.render('index');
    },
    analysis: function(req, res, next){
        res.render('analysis');
    },

    test: function(req,res,next){
        res.render('test');
    },
    videoList: function(req,res,next){
        fs.readdir('./public/videos', function(error, filelist){
            res.json([{videolist: filelist}]);
        });
    },
    objectList:function(req, res, next){
        categoryFinder.default(`./public/videodatas/${req.params.videoname}.csv`, function(category){
            var objlist = Array.from(category);
            res.json([{objlist: objlist}]);
        });
    },
    
    objectChartData:function(req, res, next){
        var filepath = `./public/videos/${req.body.video}.mp4`;
        ffmpeg.ffprobe(filepath, function(err, metadata){
            if (err) {
                console.log("MetaData not Found. " + err);
                res.status(err.status || 500);
                res.render('error');
            } else {
                var totalFrame = metadata.streams[0].nb_frames;
                var frame = Math.round(eval(metadata.streams[0].r_frame_rate));
                var target = req.body.cate;
                var timerange = req.body.timerange;
                dataRedefinder.getObjData(`./public/videodatas/${req.body.video}.csv`, target, totalFrame, frame, timerange,function(refineData){
                    res.json(refineData);
                });
            }
        });
    },
    objectPieChartData:function(req, res, next){
        var filepath = `./public/videos/${req.body.video}.mp4`;
        ffmpeg.ffprobe(filepath, function(err, metadata){
            if (err) {
                console.log("MetaData not Found. " + err);
                res.status(err.status || 500);
                res.render('error');
            } else {
                var frame = Math.round(eval(metadata.streams[0].r_frame_rate));
                var timerange = req.body.timerange;
                var time = req.body.time;
                dataRedefinder.rangeData(`./public/videodatas/${req.body.video}.csv`, frame, time, timerange, function(refineData){
                    res.json(refineData);
                });
            }
        });
    },

    boundingBox : function(req,res,next){
        var filepath = `./public/videos/${req.params.video}.mp4`;
        ffmpeg.ffprobe(filepath, function(err, metadata){
            if (err) {
                console.log("MetaData not Found. " + err);
                res.status(err.status || 500);
                res.render('error');
            } else {
                var totalFrame = metadata.streams[0].nb_frames;
                dataRedefinder.getBbox(`./public/videodatas/${req.params.video}.csv`, totalFrame, function(bbox){
                    res.json(bbox);
                });
            }
        });
    },
    img: function(req, res, next){
        const imgPath = `./public/images/${req.params.imgName}.PNG`;
        fs.readFile(imgPath, function(err, data){
          res.writeHead(200);
          res.write(data);
          res.end();
        });
    },
    videoStream: function(req, res, next){
        const videoPath = `./public/videos/${req.params.videoname}.mp4`;
        const range = req.headers.range;
        if (!range) {
            res.status(400).send("Requires Range header");
        }
        const videoSize = fs.statSync(videoPath).size;
        const CHUNK_SIZE = 10 ** 6;
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        };
        res.writeHead(206, headers);
        const videoStream = fs.createReadStream(videoPath, { start, end });
        videoStream.pipe(res);
    },

}