'use strict';

// Initialize Firebase
firebase.initializeApp(WatchNextCredentials.firebaseConfig);


(function(){

var watchNext = {
	
	addVideoToPlaylist: function(storeThat) {
		//checking if the localStorage is active, just in case
		conFig.startLS();
		chrome.storage.sync.get(function(data){
			var tempPlaylist = conFig.convertSyncGet(data);
			//in case of double-, triple-click etc. the item will be added just once
			// ***NEW*** I am deleting this check, 
			//because now I will be dealing with multiclicking otherwise
			//if (!(tempPlaylist[tempPlaylist.length-1]===storeThat)) {
			tempPlaylist.push(storeThat);
			conFig.syncSet(tempPlaylist);
			//}	
		});
	},

	startVideoAddingProcess: function(){
		//in this case 'this' is reference to XMLHttpRequest
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
		var toSend = conFig.youtubeParser(videoUrl);
		if (toSend) {
			var request = 'https://www.googleapis.com/youtube/v3/videos?id=' + toSend + '&key=' + WatchNextCredentials.youTubeApiKey + '&fields=items(id,snippet(title))&part=snippet',
				oReq = new XMLHttpRequest();
			oReq.open('get', request, true);
			oReq.send();
			oReq.onload = this.startVideoAddingProcess;
		}
	},
	//removes the video id from local storage
	deleteFromPlaylist: function(id, archive){
		chrome.storage.sync.get(function(data){
			var tempPlaylist = conFig.convertSyncGet(data),
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
			conFig.syncSet(tempPlaylist);
		});
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
			chrome.storage.sync.get(function(data){
				var toSend = conFig.convertSyncGet(data),
					autoplayDisabled = !JSON.parse(localStorage.getItem('watchNext'));
				//if the message was sent from the button under the video player, don't mind the state of the autoplay function
				if (request.button){
					autoplayDisabled = false;
				}
				//send the next video id, or false if the playlist is empty or autoplay is turned off
				if (toSend.length === 0 || autoplayDisabled) {
					sendResponse({videoId: false});
				} else {
					sendResponse({videoId: toSend[0]});
				}
			});
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
		// if the user changed his/her mind while adding videos on youtube thumbnails,
		//here is the function to delete last added item from playlist
		if (request.whatToDo === 'deleteRecentlyAddedVideo') {
			chrome.storage.sync.get(function(data){
				var tempPlaylist = conFig.convertSyncGet(data);
				tempPlaylist.splice(tempPlaylist.length-1, 1);
				conFig.syncSet(tempPlaylist);
				sendResponse({videoId: false});
			});
		}

		if (request.whatToDo === "clearPlaylist") {
			conFig.syncClear();
			sendResponse({ playlist: [] });
		}

		if (request.whatToDo === "savePLaylist") {
			conFig.syncSet(request.playlist);
			sendResponse({
				saving_started: true
			});
		}

		if (request.whatToDo === "loadVideosFromFirebaseToLocalStorage") {
			var db = firebase.firestore();
			var uid = window.watchNextUser.uid;
			db.collection("playlists").doc(uid).get().then( (response) => {
				if (
					response.data() && 
					response.data().playlistItems &&
					response.data().playlistItems.length > 0
				) {
					conFig.syncSet(response.data().playlistItems);
					sendResponse(response.data().playlistItems)
				} else {
					sendResponse([])
				}
			})
		}
		return true;
});

chrome.contextMenus.onClicked.addListener(watchNext.contextMenuClick);

chrome.runtime.onInstalled.addListener(function() {
	//context menu config
	chrome.contextMenus.create(conFig.contextMenu);
});

chrome.storage.onChanged.addListener(conFig.setIcon);

conFig.startLS();

conFig.setIcon();

}());