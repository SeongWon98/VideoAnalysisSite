/* object select option 추가 */
function selectAddObjectList(){
    var pathname = location.pathname;
    pathname = pathname.replace('analysis','objectlist');
    fetch(`${pathname}`)
    .then(res =>{
        return res.json();
    })
    .then(data => {
        var objList = data[0].objlist;
        var selectEl = document.getElementById('object-menu');
        var i = 0;
        while(i < objList.length){
            var objOption = document.createElement('option');
            objOption.text = objList[i];
            objOption.value = objList[i];
            selectEl.options.add(objOption);
            i++;
        }
    });
}
selectAddObjectList();



var selectObj = document.getElementById('object-menu');
var selectTime = document.getElementById('range');
var path = `${window.location.pathname}`;
path = path.replace('/analysis/','');

var linectx = document.getElementById('line-chart');
var lineConfig = {
    type: 'line',
    data: {},
    options: {
        maintainAspectRatio: false,
        onClick : function(event){
            var point = lineChart.getElementsAtEvent(event);
            if(point.length != 0){
                var timeSet = parseInt(point[0]._index)*parseInt(selectTime.value);
                var video = document.getElementById('video-player');
                video.currentTime = timeSet;
            }
        }
    }
};
var lineChart = new Chart(linectx, lineConfig);

/* chart 초기세팅 */
function initLineChart(){
    var postData = {
        video : path,
        cate : 'car',
        timerange : selectTime.value,
    };
    fetch('/objectChartData', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
    .then((res) => res.json())
    .then((data) => {
        lineConfig.data.labels = data.time;
        var newCountDataset = {
            label: '수',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            lineTension: .1,
            data:[],
            fill: false
        }
        var newSpeedDataset = {
            label: '속도',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            lineTension: .1,
            data:[],
            fill: false
        }
        for(var i=0 ; i < data.targetNum.length ; i++){
            newCountDataset.data[i]=parseInt(data.targetNum[i]);
            newSpeedDataset.data[i]=parseInt(data.targetSpeed[i]);
        }
        lineConfig.data.datasets.push(newCountDataset);
        lineConfig.data.datasets.push(newSpeedDataset);
        lineChart.update();
        pieChartbtnSet(data.time);
    })
    .catch((err)=>{
        console.log(err);
    })
}

initLineChart();

/* object select 변경시 chart update */
selectObj.addEventListener('change', function(e){
    var postData = {
        video : path,
        cate : e.target.value,
        timerange : selectTime.value,
    };
    fetch('/objectChartData', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
    .then((res) => res.json())
    .then((data) => {
        for(var i=0 ; i < data.targetNum.length ; i++){
            lineConfig.data.datasets[0].data[i]=parseInt(data.targetNum[i]);
            lineConfig.data.datasets[1].data[i]=parseInt(data.targetSpeed[i]);
        }
        lineChart.update();
    })
    .catch((err)=>{
        console.log(err);
    })
});

/* time select 변경시 chart update */
selectTime.addEventListener('change', function(e){
    var postData = {
        video : path,
        cate : selectObj.value,
        timerange : e.target.value,
    };
    fetch('/objectChartData', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
    .then((res) => res.json())
    .then((data) => {
        lineConfig.data.datasets[0].data = [];
        lineConfig.data.datasets[1].data = [];
        lineConfig.data.labels = data.time;
        for(var i=0 ; i < data.targetNum.length ; i++){
            lineConfig.data.datasets[0].data[i]=parseInt(data.targetNum[i]);
            lineConfig.data.datasets[1].data[i]=parseInt(data.targetSpeed[i]);
        }
        lineChart.update();
        initPieChart();
        pieChartbtnSet(data.time);
    })
    .catch((err)=>{
        console.log(err);
    })
});

var piectx = document.getElementById('pie-chart');
var pieConfig = {
    type: 'doughnut',
    data: {
        labels: [
      ],
      datasets: [{
        label: 'My First Dataset',
        data: [],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
          'rgb(54, 200, 135)'
        ],
        hoverOffset: 4
      }]},
};
var pieChart = new Chart(piectx, pieConfig);

function initPieChart(){
    var postData = {
        time : 0,
        video : path,
        timerange : selectTime.value,
    }
    console.log(postData);
    fetch('/objectPieChartData', {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
    .then((res) => res.json())
    .then((data) => {
        pieConfig.data.labels=data.cate;
        pieConfig.data.datasets[0].data=data.cateNum;
        pieChart.update();
    })
    .catch((err)=>{
        console.log(err);
    })
}
initPieChart();
function pieChartbtnSet(time){
    var timeDiv = document.getElementById('time-list');
    while (timeDiv.hasChildNodes()) {
        timeDiv.removeChild(timeDiv.firstChild);
      }
    for(var i = 0; i < time.length; i++){
        var btn = document.createElement('BUTTON');
        var br = document.createElement('BR');
        btn.innerText = time[i];
        btn.value = i;
        btn.className = 'time-btn';
        timeDiv.appendChild(btn);
        timeDiv.appendChild(br);
    }
    var btnList = document.getElementsByClassName('time-btn');
    for(var i = 0; i < btnList.length; i++){
        btnList[i].addEventListener('click',(e)=>{
            var postData = {
                time : e.target.value,
                video : path,
                timerange : selectTime.value,
            }
            console.log(postData);
            fetch('/objectPieChartData', {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            })
            .then((res) => res.json())
            .then((data) => {
                pieConfig.data.labels=data.cate;
                pieConfig.data.datasets[0].data=data.cateNum;
                pieChart.update();
            })
            .catch((err)=>{
                console.log(err);
            })
        });
    }
}