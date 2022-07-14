var express = require('express');
var router = express.Router();
var controller = require('../controllers/indexctrl.js');

/* GET home page. */
router.get('/', controller.index);
router.get('/analysis/:video', controller.analysis);
router.get('/test', controller.test);

/* GET data*/
router.get('/videolist', controller.videoList);
router.get('/objectlist/:videoname', controller.objectList);
router.post('/objectChartData', controller.objectChartData);
router.post('/objectPieChartData', controller.objectPieChartData);
router.get('/getBoundingBox/:video', controller.boundingBox);

/* GET content */
router.get('/img/:imgName', controller.img);
router.get('/stream/:videoname', controller.videoStream);

module.exports = router;
