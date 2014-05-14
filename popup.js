var youTubeApiKey = "AIzaSyCA7iPoVDwBhhRQd4RlDFk393FZMFV4JP0";
var a={};
if (!localStorage.hasOwnProperty("watchNextPlaylist")){
  localStorage.watchNextPlaylist = "[]";
}

var playlist={
  enableDisable: function(){
    if ($("#watchNextEnabled").prop('checked')){
      localStorage.watchNext="true";
      chrome.browserAction.setIcon({path: "icon32.png"});
    }else{
      localStorage.watchNext="false";
      chrome.browserAction.setIcon({path: "icon32_disabled.png"});
    }
  },
  
  isCheckboxEnabled: function(){
    if(localStorage.hasOwnProperty("watchNext")){
      if (JSON.parse(localStorage.watchNext)){
        $("#watchNextEnabled").prop('checked', true);
      } else {
        $("#watchNextEnabled").prop('checked', false);
      }
    } else {
      localStorage.watchNext = "true";
      $("#watchNextEnabled").prop('checked', true);
    }
  },
  
  videoIds: function(){
    var localIds = JSON.parse(localStorage.watchNextPlaylist);
    var idsToSend="";
    for (var i in localIds){
      if (i==0){
        idsToSend += localIds[i];
      }else{
        idsToSend += ","+localIds[i];
      };
    };
    return idsToSend;
  },

  saveDataFromYoutube: function(){
    a = JSON.parse(this.responseText).items;
    playlist.generate();
  },

  getDataFromYoutube: function(){
    var request = "https://www.googleapis.com/youtube/v3/videos?id="+this.videoIds()+"&key="+youTubeApiKey+"\
    &fields=items(id,snippet(title,channelTitle,thumbnails(default)),contentDetails(duration),statistics(viewCount))&part=snippet,contentDetails,statistics";
    var oReq = new XMLHttpRequest();
    oReq.open("get", request, true);
    oReq.send();
    oReq.onload = this.saveDataFromYoutube;
  },

  convertDuration: function(t){
    //if there are only minutes
    if (t[t.length-1]=="M") {
      t+="00S";
    }
    var time = t.substring(2,t.length-1);
    //if there are only seconds
    if (time.length<3){
      time = "00M"+time.substring(0,t.length-1);
    }
    var timeArray = time.split("M");
    //if there is less than 10 seconds
    if (timeArray[1].length<2){
      timeArray[1]= "0"+timeArray[1];
    }
    time = timeArray[0]+":"+timeArray[1];
    return time;
  },

  convertViews: function(v){
    v += '';
    x = v.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  },

  generate: function(){
    for (var i in a) {
      var id = a[i].id;
      var duration = this.convertDuration(a[i].contentDetails.duration);
      var author = a[i].snippet.channelTitle;
      var title = a[i].snippet.title;
      var views = this.convertViews(a[i].statistics.viewCount);
      var thumbnail = a[i].snippet.thumbnails.default.url;
      this.newNode(id, thumbnail, duration, title, author, views, i);
    };
  },
  
  newNode:function(id, thumbnail, duration, title, author, views, i){
    var newDiv = ' \
      <div class="playlist-item" id="'+id+'"> \
        <div class="thumbnail-container"> \
          <img src="'+thumbnail+'" alt="'+title+' thumbnail" /> \
          <div class="duration">'+duration+'</div> \
        </div> \
        <div class="info-container"> \
          <span class="title">'+title+'</span> \
          <span class="author">by <b>'+author+'</b></span> \
          <span class="views">'+views+' views</span> \
          <div class="controls"> \
            <img class="watch-now" id="watch'+i+'" src="icon32.png" title="Watch Now" alt="Watch Now" /> \
            <img class="delete" id="delet'+i+'" src="icon32_disabled.png" title="Delete" alt="Delete" /> \
          </div> \
        </div> \
        <div class="clearfix"></div> \
      </div>';
    $("#watchNext").append(newDiv);
  },

};

$(document).ready(function() {
  playlist.isCheckboxEnabled();
  $("#watchNextEnabled").change(function(){
    playlist.enableDisable();
  });
  if (JSON.parse(localStorage.watchNextPlaylist).length>0){
    playlist.getDataFromYoutube();
  };
  $("#watchNext").on("click", "img.delete", function() {
    chrome.runtime.sendMessage({whatToDo: "deleteVideo", videoId: $(this).attr("id").substring(5)}, function(response) {
      window.location.reload(true);
    });
  });
  $("#watchNext").on("click", "img.watch-now", function() {
    var linkId = $(this).attr("id").substring(5);
    var link = "https://www.youtube.com/watch?v="+ JSON.parse(localStorage.watchNextPlaylist)[linkId] +"&feature=watchnext";
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tab = tabs[0];
        chrome.tabs.update(tab.id, {url: link});
        chrome.runtime.sendMessage({whatToDo: "deleteVideo", videoId: linkId}, function(response) {
          window.close();
        });
    });
  });
});