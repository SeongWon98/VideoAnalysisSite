var bboxData;
fetch('/getBoundingBox/etriDeajeon', {
method: 'GET', // 또는 'PUT'
})
.then((res) => res.json())
.then((bboxData) => {
    this.bboxData = bboxData;
    streamingVideo();
});

function streamingVideo(){
    var video = document.getElementById('video-player');
    var fps = 15;
    videosrc = location.pathname;
    videosrc = videosrc.replace('/analysis','/stream');
    video.src = videosrc;
    var canvas = document.getElementById('stream-canvas');
    var ctx = canvas.getContext('2d');
    var canvasInterval = null;
    var i = 0;
    function drawBbox(videotime){
        var box = bboxData.bbox[videotime].split(", ");
        ctx.beginPath();
        ctx.lineWidth = "3";
        ctx.strokeStyle = "red";
        for(var j = 0; j < box.length; j++){
            ctx.rect(parseInt(box[j++]/4), parseInt(box[j++]/4), parseInt(box[j++]/4), parseInt(box[j]/4));
        }
        ctx.stroke();
    }

    function drawImage(video) {
        ctx.drawImage(video, 0, 0, 480, 270);
    }

    canvasInterval = window.setInterval(() => {
        drawImage(video);
    }, 1000 / fps);

    video.onpause = function() {
        clearInterval(canvasInterval);
    };

    video.onended = function() {
        clearInterval(canvasInterval);
    };
    
    video.onseeking = function(e){
        console.log(e);
        i = parseInt(video.currentTime)*15;
    };

    video.onplay = function() {
        clearInterval(canvasInterval);
        canvasInterval = window.setInterval(() => {
            drawImage(video);
            drawBbox(i);
            i++;
        }, 1000 / fps);
    };
}