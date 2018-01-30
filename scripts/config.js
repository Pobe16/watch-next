'use strict';
var conFig = {
	youTubeApiKey : 'private',
	
	contextMenu : {
		'title': 'Watch Next',
		'contexts': ['link'],
		'targetUrlPatterns': [
			'https://*.youtube.com/watch*',
			'http://*.youtube.com/watch*',
			'https://*.youtu.be/*',
			'http://*.youtu.be/*'
		],
		'id': 'watchNext',
	},

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

	setIcon : function () {
		chrome.storage.sync.get(function(data){
			var count = conFig.convertSyncGet(data).length + '',
				col, 
				icon;
			if (count === '0') {
				count = '';
			}
			if (JSON.parse(localStorage.getItem('watchNext'))){
				//green badge
				col = '#9c6';
				//green play icon
				icon = 'icons/icon32.png';
			} else {
				//grey badge
				col = '#999';
				//red X icon
				icon = 'icons/icon_disabled_32.png';
			}
			chrome.browserAction.setBadgeBackgroundColor({color: col});
			chrome.browserAction.setBadgeText({text: count});
			chrome.browserAction.setIcon({path: icon});
		});

	},

	//checks if the localStorage is initialised, do so if not
	//also converts old localStorage playlists to new, synced ones
	startLS: function() {
		if (!localStorage.hasOwnProperty('watchNextPlaylist')){
			//after moving to synced storage this is not needed anymore
			//localStorage.watchNextPlaylist = '[]';
		} else {
			//here we check if there is a playlist stored online, and
			//add the offline playlist after it, so no video get deleted
			chrome.storage.sync.get(function(data){
				var convertedData = conFig.convertSyncGet(data);;
					convertedData = convertedData.concat(JSON.parse(localStorage.getItem('watchNextPlaylist')))
				conFig.syncSet(convertedData);
				localStorage.removeItem('watchNextPlaylist');
			});
		}
		if (!localStorage.hasOwnProperty('watchNext')){
			localStorage.setItem('watchNext', 'true');
		}
		if (!localStorage.hasOwnProperty('watchNextArchive')){
			localStorage.setItem('watchNextArchive', '[]');
		}
		
	},
	//this function prepares (slice by hundreds) and saves the data to chrome sync
	syncSet: function(data) {
		var splicedData = {},
			howManyHundreds = parseInt(data.length/100);
		if (data.length%100 === 0){
			chrome.storage.sync.remove('watchNextPlaylist'+howManyHundreds);
		}

		while (data.length>100){
			splicedData['watchNextPlaylist'+howManyHundreds] = data.splice(100*howManyHundreds, 100);
		}

		splicedData.watchNextPlaylist0 = data;
		chrome.storage.sync.set(splicedData, function(){
			conFig.setIcon();
			}
		);
	},

	syncClear: function(){
		chrome.storage.sync.clear(function(){
			conFig.setIcon();
		});
	},

	convertSyncGet: function (data) {
		var toConcat = [];
			for (var i in data){
				toConcat = toConcat.concat(data[i]);
			}
		return toConcat;
	},

	//shortcut for the normalization of array-like elements
	DOMtoArray: function(DOM){
		return Array.prototype.slice.call(DOM);
	},

	//shortcut for creating DOM elements with class
	insert: function(tag, clas){
		var html = document.createElement(tag);
		if (clas){
			html.className = clas;	
		}
		return html;
	}
};