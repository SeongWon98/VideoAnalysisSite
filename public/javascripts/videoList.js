function addVideoList(){
    fetch('/videolist',{
        method: 'GET'
    })
    .then(res =>{
        return res.json();
    })
    .then(data => {
        var videolist=data[0].videolist;
        videolist = videolist.toString().replaceAll('.mp4','');
        videolist = videolist.split(',');
        var ul = document.getElementById('sidebar');
        videolist.forEach(function(item){
            var li = document.createElement('li');
            var img = document.createElement('img');
            img.src=`/img/${item}`;
            img.className='list-img';
            img.innerText=`${item}`;
            li.className='video-list';
            li.innerText=`${item}`;
            li.appendChild(img);
            ul.appendChild(li);
        });
        var list = document.getElementsByClassName('video-list');
        for(var i = 0; i < list.length; i++){
            list[i].addEventListener('click',(e)=>{
                var target= '';
                if(e.target.tagName == 'IMG'){
                    target = e.target.parentElement.innerText;
                }
                else target = e.target.innerText;
                location.replace(`/analysis/${target}`);
            });
        }
    });
}

addVideoList();