'use strict';

(function(){

var m_ytplayer = null,
	
	//attempt to identify the html5 video player
	html5VideoPlayer = document.getElementsByTagName('video')[0],
	
	/*
	Don't use flash, it is a pain to write for it and it makes me sad. 
	YouTube player on official page have absolutely no apis :-(
	this is a workaround I found in one of the 'replay youtube videos'
	chrome extensions. I adjusted it for my use, but it's still enormous,
	and somewhat gibberish for me :-(
	If the player is not html5, here is how we handle it:
	*/
	flash ={
		getPlayerObject: function(){
			return document.getElementById('movie_player');
		},
		
		executePageScript: function(fn, params){
		   // returned value container
		   var val = document.createElement('div');
		   val.id = '' + Math.floor((Math.random() * 100) + 1) + ((new Date()).getTime());
		   val.innerHTML = ''; 
		   document.body.appendChild(val); 
		   
		   var script = document.createElement('script');
		   script.setAttribute('type', 'application/javascript');
		   script.textContent = ((params !== null) ? ('var params = ' + JSON.stringify(params) + ';') : '') + 
								'document.getElementById("' + val.id + '").innerHTML=(' + fn + ')();';
		   document.documentElement.appendChild(script); // run the script
		   var returnedVal = document.getElementById(val.id).innerHTML;
		   document.documentElement.removeChild(script); // clean up
		   document.body.removeChild(val); 
		   
		   return returnedVal;
		},

		runPlayerCmd: function(cmdName, params){
			params = params || {};
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
			return parseInt(flash.runPlayerCmd('getPlayerState'));
		},

		videoState: function(){
			if (flash.getPlayerState() === 0){
				controls.getNextVideo();
			} else {
				window.setTimeout(function(){flash.videoState();}, 5000);
			}
		},
	},
	controls = {
		//deletes the first item from playlist and loads it in the active youtube tab
		loadNext: function(id){
			chrome.runtime.sendMessage({whatToDo: 'videoWatched'}, function(){});
			document.location.href = 'https://www.youtube.com/watch?v='+id+'&feature=watchnext';
		},
		/*
		asks background.js for the id of next video, then proceeds to load it
		works only if there are videos in playlist and the extension is enabled
		otherwise the response is 'false'
		*/
		getNextVideo: function(){
			chrome.runtime.sendMessage({whatToDo: 'getNextVideoId'}, function(response) {
				if (response.videoId) {
					controls.loadNext(response.videoId);
				}
			});
		}
	};

/*
I wanted to put an event listener for DOMContentLoaded, but Chrome starts 
content scripts after that event.
*/
if (html5VideoPlayer) {
	//if there is HTML5 video, bind the watch next playlist to end of it
	html5VideoPlayer.onended = function() {
		controls.getNextVideo();
	};
} else {
	//if not, find the flash player
	m_ytplayer = flash.getPlayerObject();
	//and start observing for the video end
	flash.videoState();
}

}());