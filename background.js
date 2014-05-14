if (!localStorage.hasOwnProperty("watchNextPlaylist")){
  localStorage.watchNextPlaylist = "[]";
}

var watchNext = {
  youtube_parser: function(url){
    var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[1].length==11){
      return match[1];
    }else{
      alert("Url incorrect");
    }
  },

  startLS: function() {
    localStorage.watchNextPlaylist = "[]";
    localStorage.watchNext = "true";
  },

  addVideo: function(videoUrl){
    var toStore = this.youtube_parser(videoUrl);
    var tempPlaylist =[];
    if (!localStorage.hasOwnProperty("watchNextPlaylist")){
      this.startLS();
    } else {
      tempPlaylist = JSON.parse(localStorage.watchNextPlaylist);
    }
    if (!(tempPlaylist[tempPlaylist.length-1]==toStore)) {
      tempPlaylist.push(toStore);
    } 
    localStorage.watchNextPlaylist = JSON.stringify(tempPlaylist);
  },

  deleteFromPlaylist: function(id){
    playlist = JSON.parse(localStorage.watchNextPlaylist);
    playlist.splice(id,1);
    localStorage.watchNextPlaylist = JSON.stringify(playlist);
  }
};

function onClickHandler(info, tab) {
  watchNext.addVideo(info.linkUrl);
}

chrome.contextMenus.onClicked.addListener(onClickHandler);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.whatToDo == "getNextVideoId") {
      if (!localStorage.hasOwnProperty("watchNextPlaylist")){
        watchNext.startLS();
      }
      var toSend = JSON.parse(localStorage["watchNextPlaylist"])
      if (toSend.length == 0 || !JSON.parse(localStorage["watchNext"])) {
        sendResponse({videoId: false});
      } else {
        sendResponse({videoId: toSend[0]});
      }
    }
    if (request.whatToDo == "videoWatched"){
      watchNext.deleteFromPlaylist(0);
    };
    if (request.whatToDo == "addVideoToPlaylist"){
      var video = "http://youtu.be/" + request.videoId;
      watchNext.addVideo(video);
    }
    if (request.whatToDo == "deleteVideo"){
      watchNext.deleteFromPlaylist(request.videoId);
      sendResponse({videoId: false});
    }
    return true;
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    "title": "Watch Next",
    "contexts": ["link"],
    "targetUrlPatterns": ["*://*.youtube.com/watch*", "*://*.youtu.be/*"],
    "id": "watchNext",
  });
});