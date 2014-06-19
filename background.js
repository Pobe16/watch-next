"use strict";
var watchNext = {
	//isolate the youtube video id from the address, code from stackoverflow: http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
	youtubeParser: function(url){
		var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
		var match = url.match(regExp);
		if (match&&match[1].length==11){
			return match[1];
		}else{
			//console.log("Url incorrect");
		}
	},
	//checks if the localStorage is initialised, do so if not
	startLS: function() {
		if (!localStorage.hasOwnProperty("watchNextPlaylist")){
			localStorage.watchNextPlaylist = "[]";
		}
		if (!localStorage.hasOwnProperty("watchNext")){
			localStorage.watchNext = "true";
		}
	},
	//saves the target video id in local storage
	addVideo: function(videoUrl){
		var toStore = this.youtubeParser(videoUrl);
		var tempPlaylist =[];
		if (!localStorage.hasOwnProperty("watchNextPlaylist")){
			this.startLS();
		} else {
			tempPlaylist = JSON.parse(localStorage.watchNextPlaylist);
		}
		//avoid double clicking
		if (!(tempPlaylist[tempPlaylist.length-1]===toStore)) {
			tempPlaylist.push(toStore);
		} 
		localStorage.watchNextPlaylist = JSON.stringify(tempPlaylist);
	},
	//removes the video id from local storage
	deleteFromPlaylist: function(id){
		var playlist = JSON.parse(localStorage.watchNextPlaylist);
		playlist.splice(id,1);
		localStorage.watchNextPlaylist = JSON.stringify(playlist);
	}
};

//message system
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//determine the next video in playlist
		if (request.whatToDo == "getNextVideoId") {
			//initialisation - just in case
			if (!localStorage.hasOwnProperty("watchNextPlaylist")){
				watchNext.startLS();
			}
			var toSend = JSON.parse(localStorage.watchNextPlaylist);
			//send the next video id, or false if the playlist is empty or extension is turned off
			if (toSend.length === 0 || !JSON.parse(localStorage.watchNext)) {
				sendResponse({videoId: false});
			} else {
				sendResponse({videoId: toSend[0]});
			}
		}
		//message received on start of the new video to delete the first entry from playlist
		if (request.whatToDo == "videoWatched"){
			watchNext.deleteFromPlaylist(0);
		}
		//with youtube-local links we are getting just ids, so we have to add a shortcut template to not confuse the youtubeParser method
		if (request.whatToDo == "addVideoToPlaylist"){
			var video = "http://youtu.be/" + request.videoId;
			watchNext.addVideo(video);
		}
		//delete any video from list
		if (request.whatToDo == "deleteVideo"){
			watchNext.deleteFromPlaylist(request.videoId);
			//a response needed for popup.js window reload
			sendResponse({videoId: false});
		}
		return true;
});
//context menu onclick function
function onClickHandler(info) {
	watchNext.addVideo(info.linkUrl);
}

chrome.contextMenus.onClicked.addListener(onClickHandler);

chrome.runtime.onInstalled.addListener(function() {
	//context menu config
	chrome.contextMenus.create({
		"title": "Watch Next",
		"contexts": ["link"],
		"targetUrlPatterns": ["*://*.youtube.com/watch*", "*://*.youtu.be/*"],
		"id": "watchNext",
	});
});