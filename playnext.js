var html5VideoPlayer = document.getElementsByTagName('video')[0];
var m_ytplayer = null;
if (!localStorage.hasOwnProperty("watchNextPlaylist")){
  localStorage.watchNextPlaylist = "[]";
};

loadNext = function(id){
	chrome.runtime.sendMessage({whatToDo: "videoWatched"}, function(response){});
	document.location.href = "https://www.youtube.com/watch?v="+id+"&feature=watchnext";
};

getNextVideo = function(){
	chrome.runtime.sendMessage({whatToDo: "getNextVideoId"}, function(response) {
			if (response.videoId) {
				loadNext(response.videoId);
			};
	});
};

addVideoToPlaylist = function(id){
	chrome.runtime.sendMessage({whatToDo: "addVideoToPlaylist", videoId: id}, function(response) {});
};

if (html5VideoPlayer) {
	html5VideoPlayer.onended = function() {
		getNextVideo();
	};
};

createWatchNextButton = function(id){
	var styleButton = "right:26px;width:22px;height:22px;padding:0;border-radius:2px;";
	var tempButton = '\
	<button class="addto-button video-actions spf-nolink hide-until-delayloaded addto-watch-next-button yt-uix-button yt-uix-button-default yt-uix-button-size-small yt-uix-tooltip" \
	title="Watch Next" \
	type="button" \
	onclick=";return false;" \
	style="'+styleButton+'" \
	data-video-ids="'+id+'" \
	role="button">\
		<span class="yt-uix-button-content">\
			<img src="'+chrome.extension.getURL('icon16.png')+'" alt="Watch Next">\
 		</span>\
 	</button>';
 	return tempButton;
};

//if the player is not html5, here is how we handle it:

function getPlayerObject() {
	m_ytplayer = document.getElementById("movie_player");
	return m_ytplayer;
};

function executePageScript(fn, params) {
		
	   // returned value container
	   var val = document.createElement("div");
	   val.id = "" + Math.floor((Math.random() * 100) + 1) + ((new Date()).getTime());
	   val.innerHTML = ""; 
	   document.body.appendChild(val); 
	   
	   var script = document.createElement('script');
	   script.setAttribute("type", "application/javascript");
	   script.textContent = ((params != null) ? ('var params = ' + JSON.stringify(params) + ';') : "") + 
							'document.getElementById("' + val.id + '").innerHTML=(' + fn + ')();';
	   document.documentElement.appendChild(script); // run the script
	   var returnedVal = document.getElementById(val.id).innerHTML;
	   document.documentElement.removeChild(script); // clean up
	   document.body.removeChild(val); 
	   
	   return returnedVal;
	}

function runPlayerCmd(cmdName, params) {
	if (!params) {
		params = {};
	}
	params.ytplayerName = m_ytplayer.id;
	params.cmdName = cmdName;
	var val = executePageScript(function(){
		var ytPlayerObj = document.getElementById(params.ytplayerName);
		if ((ytPlayerObj != null) && (ytPlayerObj[params.cmdName] != null)) {
			return ytPlayerObj[params.cmdName]();
		}
		return null;
	}, params);
	return val;
}

function getPlayerState() {
	return parseInt(runPlayerCmd("getPlayerState"));
};

function flashVideoState(){
	if (getPlayerState() == 0){
		getNextVideo();
	} else if (getPlayerState() == 1){
		window.setTimeout(function(){flashVideoState();}, 5000)
	} else {
		window.setTimeout(function(){flashVideoState();}, 5000);
	}
};

$(document).ready(function(){
	var buttonClass = ".addto-watch-later-button";
	$(buttonClass).each(function(index, element) {
		var tempVideoId = $(this).attr("data-video-ids");
		var watchNextButton = createWatchNextButton(tempVideoId);
		$(this).before(watchNextButton);
	});
	$(".addto-watch-next-button").click(function() {
		var videoId = $(this).attr("data-video-ids");
		addVideoToPlaylist(videoId);
		//return false;
	});

	if (!html5VideoPlayer){
		m_ytplayer = getPlayerObject();
		console.log("no html5")
		window.setTimeout(function(){flashVideoState();}, 5000);
	};
});