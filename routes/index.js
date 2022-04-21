var express = require('express');
var router = express.Router();

var controller = require('../controllers/mainController.js');

/* GET home page. */
router.get('/', controller.index);
router.get('/analysis/:video', controller.main);
router.get('/stream/:videoname/cate/:cate/time/:times/timerange/:timerange', controller.streamPage);

/* get data */
router.get('/videolist', controller.getVideoList);
router.get('/objectCategory/:video', controller.getVideoCategory);
router.get('/analysisData/:video/cate/:cate/timerange/:timerange', controller.getObjectData);
router.get('/objectBox/:video/cate/:cate/time/:times/timerange/:timerange', controller.getObjectBox);

/* video */
router.get('/videopart/video/:videoname/time/:times/timerange/:timerange', controller.makeStreamVideo);
router.get('/video/:videoname/cate/:cate/time/:times/timerange/:timerange', controller.streamVideo);

module.exports = router;
