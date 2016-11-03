'use strict';
(function(){

var watchNext = {
	/*
	I am expanding the localStorage usage with archive, and possibly library,
	so this function will probably be obsolete soon...
	*/
	/*
	localStorageService: function (whatToDo, value) {
		//get the playlist from local storage, changing the string to array
		if (whatToDo === 'get') {
			return JSON.parse(localStorage.getItem('watchNextPlaylist'));
		//set the playlist to new value, changing array to string			
		} else if (whatToDo === 'set') {
			var setValue = JSON.stringify(value);
			localStorage.setItem('watchNextPlaylist', setValue);
		}
	},
	*/

	/*
	isolate the youtube video id from the address, regex from stackoverflow
	http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
	*/
	youtubeParser: function(url){
		var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/,
			match = url.match(regExp);
		if (match && match[1].length === 11){
			return match[1];
		} else {
			return false;
		}
	},

	addVideoToPlaylist: function(storeThat) {
		var tempPlaylist = JSON.parse(localStorage.getItem('watchNextPlaylist'));
		//checking if the localStorage is active
		conFig.startLS();
		//in case of double-, triple-click etc. the item will be added just once
		if (!(tempPlaylist[tempPlaylist.length-1]===storeThat)) {
			tempPlaylist.push(storeThat);
			localStorage.setItem('watchNextPlaylist', JSON.stringify(tempPlaylist));
			conFig.setIcon();
		} 	
	},

	startVideoAddingProcess: function(){
		//in this case "this" is reference to XMLHttpRequest
		var videoResponse = JSON.parse(this.responseText).items;
			if (videoResponse.length) {
				watchNext.addVideoToPlaylist(videoResponse[0].id);
			} else {
				//If the video does not exist
				alert('Video does not exist.');
			}
	},

	//saves the target video id in local storage
	checkLink: function(videoUrl){
		var toSend = this.youtubeParser(videoUrl);
		if (toSend) {
			var request = 'https://www.googleapis.com/youtube/v3/videos?id=' + toSend + '&key=' + conFig.youTubeApiKey + '&fields=items(id,snippet(title))&part=snippet',
				oReq = new XMLHttpRequest();
			oReq.open('get', request, true);
			oReq.send();
			oReq.onload = this.startVideoAddingProcess;
		}
	},
	//removes the video id from local storage
	deleteFromPlaylist: function(id, archive){
		var tempPlaylist = JSON.parse(localStorage.getItem('watchNextPlaylist')),
			tempArchive = JSON.parse(localStorage.getItem('watchNextArchive'));

		if (archive){
			tempArchive.unshift(tempPlaylist[id]);
			//removes the library entry about the movie we are about to delete from library
			if (tempArchive.length > 3) {
				chrome.storage.local.remove(tempArchive[3]);
				tempArchive.splice(3);				
			}
			localStorage.setItem('watchNextArchive', JSON.stringify(tempArchive));
		}
		chrome.storage.local.remove(tempPlaylist[id]);
		tempPlaylist.splice(id,1);
		localStorage.setItem('watchNextPlaylist', JSON.stringify(tempPlaylist));
		conFig.setIcon();
	},
	//on click of context menu item
	contextMenuClick: function(info){
		watchNext.checkLink(info.linkUrl);
	}
};

//message system
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		//determine the next video in playlist
		if (request.whatToDo === 'getNextVideoId') {
			var toSend = JSON.parse(localStorage.watchNextPlaylist),
				extensionDisabled = !JSON.parse(localStorage.watchNext);
			//send the next video id, or false if the playlist is empty or extension is turned off
			if (toSend.length === 0 || extensionDisabled) {
				sendResponse({videoId: false});
			} else {
				sendResponse({videoId: toSend[0]});
			}
		}
		//delete any video from list, if the delete button was used, do not archive it
		if (request.whatToDo === 'videoWatched' || request.whatToDo === 'deleteVideo'){
			var archive = true;
			if (request.whatToDo === 'deleteVideo') {
				archive = false;
			}
			watchNext.deleteFromPlaylist(request.videoId, archive);
			//a response needed for popup.js window reload
			sendResponse({videoId: false});
		}
		//with youtube-local links we are getting just ids, so we have to add a shortcut template to not confuse the youtubeParser method
		if (request.whatToDo === 'addVideoToPlaylist'){
			var video = 'http://youtu.be/' + request.videoId;
			watchNext.checkLink(video);
			sendResponse({added: true});
		}
		return true;
});

chrome.contextMenus.onClicked.addListener(watchNext.contextMenuClick);

chrome.runtime.onInstalled.addListener(function() {
	//context menu config
	chrome.contextMenus.create(conFig.contextMenu);
});

conFig.setIcon();

}());