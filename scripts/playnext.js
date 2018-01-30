'use strict';

(function(){

var m_ytplayer = document.getElementById('movie_player'),
	
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
		/*
		determines if the youtube player is in video end mode
		I am pretty sure that youtube sometimes plays ads after the movie - in this case
		this script will wait for the end of an ad. Needs testing with ad after movie to find
		correct class names
		*/
		adOrMovie: function(){
			var movieEnded = 0;
			console.log(html5VideoPlayer.parentNode.parentNode.classList);
			if (html5VideoPlayer.parentNode.parentNode.classList.contains('ended-mode')) {
				movieEnded = 1;
			}

			if (movieEnded) {
				controls.getNextVideo();
			}
		},

		//deletes the first item from playlist and loads it in the active youtube tab
		loadNext: function(id){
			chrome.runtime.sendMessage({whatToDo: 'videoWatched', videoId: 0}, function(){});
			document.location.href = 'https://www.youtube.com/watch?v='+id+'&feature=watchnext';
		},
		/*
		asks background.js for the id of next video, then proceeds to load it
		works only if there are videos in playlist and the extension is enabled
		otherwise the response is 'false'
		*/
		getNextVideo: function(){
			var currentUrl = location.href;
			if (!currentUrl.includes('&list=')){
				chrome.runtime.sendMessage({whatToDo: 'getNextVideoId'}, function(response) {
					if (response.videoId) {
						controls.loadNext(response.videoId);
					}
				});
			}
		},

	 	lookingForVideo: function(){
			if (html5VideoPlayer) {
				//if there is HTML5 video, start our script when it ends
				html5VideoPlayer.onended = function() {
					/*
					When the full ad play with the video (when user is not allowed to click "skip ad",
					or he/she choses to watch the whole film), the onended function will be called twice
					first when the ad ends, and second time when the movie end. That's why the script
					wait 200 ms and then tries to determine if user just finished watching ad or movie.	
					Needs testing on slower broadbands to see if 200 ms is enough.	
					*/
					window.setTimeout(function(){controls.adOrMovie();}, 1000);
				};
			} else if (m_ytplayer) {
				//if there is no HTML5 video, but flash video, start observing it
				flash.videoState();
			} else {
				//if there is no video at all, try to look again every second
				m_ytplayer = document.getElementById('movie_player');
				html5VideoPlayer = document.getElementsByTagName('video')[0];
				window.setTimeout(function(){controls.lookingForVideo();},1000);
			}
		}
	};

/*
I wanted to put an event listener for DOMContentLoaded, but Chrome starts 
content scripts after that event.
*/

controls.lookingForVideo();

}());