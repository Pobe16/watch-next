"use strict";
//localstorage initialisation again
if (!localStorage.hasOwnProperty("watchNextPlaylist")){
  localStorage.watchNextPlaylist = "[]";
}

var controls = {
	//deletes the first item from playlist and loads it in the active youtube tab
	loadNext: function(id){
		chrome.runtime.sendMessage({whatToDo: "videoWatched"}, function(){});
		document.location.href = "https://www.youtube.com/watch?v="+id+"&feature=watchnext";
	},
	//asks background.js for the id of next video, then proceeds to load it
	getNextVideo: function(){
		chrome.runtime.sendMessage({whatToDo: "getNextVideoId"}, function(response) {
			if (response.videoId) {
				controls.loadNext(response.videoId);

			}
		});
	}
};

//Don't use flash, it is a pain to write for it and it makes me sad. 
//YouTube player on official page have absolutely no apis :-(
//this is a workaround I found in one of the "replay youtube videos"
//chrome extensions. I adjusted it for my use, but it's still enormous,
//and somewhat gibberish for me :-(
//If the player is not html5, here is how we handle it:
var m_ytplayer = null;
var flash ={
	getPlayerObject: function(){
		var ytplayer = document.getElementById("movie_player");
		return ytplayer;
	},
	
	executePageScript: function(fn, params){
	   // returned value container
	   var val = document.createElement("div");
	   val.id = "" + Math.floor((Math.random() * 100) + 1) + ((new Date()).getTime());
	   val.innerHTML = ""; 
	   document.body.appendChild(val); 
	   
	   var script = document.createElement('script');
	   script.setAttribute("type", "application/javascript");
	   script.textContent = ((params !== null) ? ('var params = ' + JSON.stringify(params) + ';') : "") + 
							'document.getElementById("' + val.id + '").innerHTML=(' + fn + ')();';
	   document.documentElement.appendChild(script); // run the script
	   var returnedVal = document.getElementById(val.id).innerHTML;
	   document.documentElement.removeChild(script); // clean up
	   document.body.removeChild(val); 
	   
	   return returnedVal;
	},

	runPlayerCmd: function(cmdName, params){
		if (!params) {
			params = {};
		}
		params.ytplayerName = m_ytplayer.id;
		params.cmdName = cmdName;
		var val = flash.executePageScript(function(){
			var ytPlayerObj = document.getElementById(params.ytplayerName);
			if ((ytPlayerObj !== null) && (ytPlayerObj[params.cmdName] !== null)) {
				return ytPlayerObj[params.cmdName]();
			}
			return null;
		}, params);
		return val;
	},

	getPlayerState: function(){
		return parseInt(flash.runPlayerCmd("getPlayerState"));
	},

	videoState: function(){
		if (flash.getPlayerState() === 0){
			controls.getNextVideo();
		} else {
			window.setTimeout(function(){flash.videoState();}, 5000);
		}
	},

};

$(document).ready(function(){
	//attempt to identify the html5 video player	
	var html5VideoPlayer = document.getElementsByTagName("video")[0];

	if (html5VideoPlayer) {
		//if succeeded, bind the watch next playlist to end of video
		html5VideoPlayer.onended = function() {
			controls.getNextVideo();
		};
	} else {
		//if not, find the flash player
		m_ytplayer = flash.getPlayerObject();
		//and start observing periodically (5s) for the video end
		window.setTimeout(function(){flash.videoState();}, 5000);
	}
});