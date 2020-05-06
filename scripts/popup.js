'use strict';

(function(){

var playlist={
	tempPlaylistArray: [],
	tempArchiveArray: [],
	videosArray: [],
	videosArrayButtons: [],
	checkbox: {},
	parentDiv: {},
	tempPlaylistInfo: [],
	library: {},
	//duration in seconds
	playlistDuration: 0,
	deadVideos: [],

	//store the playlist info in local variables, then start processing them
	getVideos: function(){
		var i;
		this.tempArchiveArray = JSON.parse(localStorage.getItem("watchNextArchive"));
		this.videosArray = this.tempPlaylistArray.concat(this.tempArchiveArray);
		this.videosArrayButtons = this.tempPlaylistArray;
		i = this.videosArray.length;
		if (i){
			for (i; i>-1; i--) {
				if (this.library.hasOwnProperty(this.videosArray[i])){
					this.videosArray.splice(i,1);
				}
			}
			this.getDataFromYoutube();
		}

	},

	//enable or disable extension
	enableDisable: function(){
		if (this.checkbox.checked){
			localStorage.setItem('watchNext', 'true');
		}else{
			localStorage.setItem('watchNext', 'false');
		}
		conFig.setIcon();
	},

	/*
	proceed to determine the extension status
	and check/uncheck the checkbox
	*/
	isCheckboxEnabled: function(){
		if (JSON.parse(localStorage.getItem("watchNext"))){
			this.checkbox.checked = true;
		} else {
			this.checkbox.checked = false;
		}
	},

	/*
	creates a string of video ids to send to YouTube API for details
	needed to create visual playlist
	*/
	videoIds: function(){
		var idsToSend = this.videosArray.slice(0,50);
		this.videosArray = this.videosArray.slice(50);
		return idsToSend.join();
	},

	//communicate with YouTube API to download report on video id
	getDataFromYoutube: function(){
		var request = 'https://www.googleapis.com/youtube/v3/videos?id=' + this.videoIds() + '&key='+WatchNextCredentials.youTubeApiKey+
		'&fields=items(id,snippet(title,channelTitle),contentDetails(duration),statistics(viewCount))&part=snippet,contentDetails,statistics';
		var oReq = new XMLHttpRequest();
		oReq.open('get', request, true);
		oReq.send();
		oReq.onload = this.saveDataFromYoutube;
	},

	/*
	saves data in a global variable
	I can't use the 'this' keyword for playlist object, because in this case
	'this' is reffering to the XMLHttpRequest();
	*/
	saveDataFromYoutube: function(){
		var i,
			library;
		playlist.tempPlaylistInfo = playlist.tempPlaylistInfo.concat(JSON.parse(this.responseText).items);
		if (playlist.videosArray.length){
			playlist.getDataFromYoutube();
		} else {
			for (i in playlist.tempPlaylistInfo) {
				var id = playlist.tempPlaylistInfo[i].id;
				if (!playlist.library.hasOwnProperty(id)){
					playlist.library[id] = {};
					playlist.library[id].duration = playlist.tempPlaylistInfo[i].contentDetails.duration;
					playlist.library[id].author = playlist.tempPlaylistInfo[i].snippet.channelTitle;
					playlist.library[id].title = playlist.tempPlaylistInfo[i].snippet.title;
					if(playlist.tempPlaylistInfo[i].hasOwnProperty('statistics')){
						playlist.library[id].views = playlist.tempPlaylistInfo[i].statistics.viewCount;
					} else {
						playlist.library[id].views = 'Hidden';
					}
					
				}
			}
			library = playlist.library;
			chrome.storage.local.set(library, function(){
				playlist.generate();
			});
		}
	},


	//ISO8601 duration changed to (*HH:M)M:SS
	convertDuration: function(t){ 
		//dividing period from time
		var	x = t.split('T'),
			duration = '',
			time = {},
			period = {},
			//just shortcuts
			s = 'string',
			v = 'variables',
			l = 'letters',
			// store the information about ISO8601 duration format and the divided strings
			d = {
				period: {
					string: x[0].substring(1,x[0].length),
					len: 4,
					// years, months, weeks, days
					letters: ['Y', 'M', 'W', 'D'],
					variables: {},
				},
				time: {
					string: x[1],
					len: 3,
					// hours, minutes, seconds
					letters: ['H', 'M', 'S'],
					variables: {},
				},
			};
		//in case the duration is a multiple of one day
		if (!d.time.string) {
			d.time.string = '';
		}

		for (var i in d) {
			var len = d[i].len;
			for (var j = 0; j < len; j++) {
				d[i][s] = d[i][s].split(d[i][l][j]);
				if (d[i][s].length>1) {
					d[i][v][d[i][l][j]] = parseInt(d[i][s][0]);
					d[i][s] = d[i][s][1];
				} else {
					d[i][v][d[i][l][j]] = 0;
					d[i][s] = d[i][s][0];
				}
			}
		} 
		period = d.period.variables;
		time = d.time.variables;
		time.H += 	24 * period.D + 
					24 * 7 * period.W +
					24 * 7 * 4 * period.M + 
					24 * 7 * 4 * 12 * period.Y;
		
		this.playlistDuration+= parseInt(time.H) * 60 * 60 + 
								parseInt(time.M) * 60 +
								parseInt(time.S);
		if (time.H) {
			duration = time.H + ':';
			if (time.M < 10) {
				time.M = '0' + time.M;
			}
		}


		if (time.S < 10) {
			time.S = '0' + time.S;
		}

		duration += time.M + ':' + time.S;

		return duration;
	},


	/*
	added commas to views by reiterating them backwards
	and inserting comma every third digit
	*/
	convertViews: function(views){
		var output = '',
			l = views.length-1;
		if (views ==='Hidden') {
			output = views;
		} else {
			for (var i in views){
				output = views[l-i] + output;
				//second argument is there to not insert commas
				//in front of the number
				if((i+1)%3===0&&i<l){
					output = ',' + output;
				}
			}
		}
		return output;
	},

	//collecting every information about the playlist item and starting generator
	generate: function(){
			var i,
				wnplaylist = playlist.tempPlaylistArray,
				videoDetails = {
					id: '',
					duration: '',
					author: '',
					title: '',
					views: '',
					thumbnail: ''
				};
		for (i in wnplaylist) {
			videoDetails.id = wnplaylist[i];
			//checking if the id is in the library. If it isn't, it means the video got deleted / blocked.
			if (this.library[videoDetails.id]) {
				videoDetails.duration = this.convertDuration(this.library[videoDetails.id].duration);
				videoDetails.author = this.library[videoDetails.id].author;
				videoDetails.title = this.library[videoDetails.id].title;
				videoDetails.views = this.convertViews(this.library[videoDetails.id].views);
				videoDetails.thumbnail = 'https://i.ytimg.com/vi/'+videoDetails.id+'/mqdefault.jpg';
				this.newNode(i, videoDetails);
			} else {
				//if the id is not in the library (doesn't exist / is deleted from youtube) proceed to create a list of dead videos
				this.deadVideos = this.deadVideos.concat(videoDetails.id);
			}
		}
		/*
		we call this function here instead of DOMContentLoaded listener
		because of asynchronic nature of XMLHttpRequest
		*/
		this.generateHistory();
		
		this.buttonsShouldDoSomething();

		this.setDuration();

		if (this.deadVideos.length) {
			this.clearDeadVideos();
		}

		this.setViewport();

		this.generateClearAllButton();

		this.startDragAndDrop();
	},

	//creating a div template and appending to the popup page
	newNode:function(i, details){
		
		var toConstruct = {
				playlistItem: 'div',
				dragdrophandle: 'div',
				thumbnailContainer: 'img',
				duration: 'span',
				infoContainer: 'div',
				title: 'span',
				author: 'span',
				views: 'span',
				controls: 'div',
				delet: 'img'
			},
			//c will be a DOM playground
			c = {},
			newDiv = document.createDocumentFragment();
			
		//creating DOM elements
		for (var a in toConstruct){
			c[a] = conFig.insert(toConstruct[a], a);
		}
		
		//setting attributes
		c.dragdrophandle.innerHTML = "<span>⋮</span>"
		c.delet.id = 'delet' + i;
		c.delet.src = chrome.extension.getURL('icons/icon_delete_32.png');
		c.delet.title = 'Delete';
		c.delet.alt = 'Delete';
		c.duration.innerHTML = details.duration;
		c.title.innerHTML = details.title;
		c.author.innerHTML = 'by <b>' + details.author + '</b>';
		c.views.innerHTML = details.views + ' views';
		c.thumbnailContainer.src = details.thumbnail;
		c.thumbnailContainer.id = 'watch' + i;
		c.thumbnailContainer.title = 'Watch Now';
		c.thumbnailContainer.classList.add("watchNow");
		c.playlistItem.setAttribute('data-queuePosition',i);
		c.playlistItem.setAttribute('draggable', 'true');
		c.playlistItem.id = details.id;

		// glueing it all together
		c.controls.appendChild(c.duration);
		c.controls.appendChild(c.delet);
		c.infoContainer.appendChild(c.title);
		c.infoContainer.appendChild(c.author);
		c.infoContainer.appendChild(c.views);
		c.infoContainer.appendChild(c.controls);
		c.playlistItem.appendChild(c.dragdrophandle);
		c.playlistItem.appendChild(c.thumbnailContainer);
		c.playlistItem.appendChild(c.infoContainer);
		newDiv.appendChild(c.playlistItem);

		this.parentDiv.appendChild(newDiv);
	},

	generateHistory: function(){
		var i,
			history = JSON.parse(localStorage.getItem("watchNextArchive"));
		for (i in history) {
			//checking if the archive video is live
			if(this.library[history[i]]){
				this.newHistoryNode(i);
			} else {
				//if not - add it to dead pile
				this.deadVideos = this.deadVideos.concat(history[i]);
			}
		}		
	},

	newHistoryNode: function(i) {
		var toConstruct = {
				historyItem: 'div',
				historyThumbnail: 'img',
				historyControls: 'div',
				readd: 'img',
				info: 'img'
			},
			c = {},
			historyId = JSON.parse(localStorage.getItem("watchNextArchive"))[i],
			newDiv = document.createDocumentFragment();

		for (var a in toConstruct){
			c[a] = conFig.insert(toConstruct[a], a);
		}

		c.readd.id = 'readd' + i;
		c.readd.src = chrome.extension.getURL('icons/icon_add_32.png');
		c.readd.title = 'Add to queue again';
		c.readd.alt = 'Watch Again';
		c.info.src = chrome.extension.getURL('icons/icon_info.png');
		c.info.title = this.library[historyId].title;
		c.info.alt = 'History Info';
		c.historyThumbnail.src = "https://i.ytimg.com/vi/"+historyId+"/mqdefault.jpg";
		c.historyItem.id = historyId;

		c.historyControls.appendChild(c.info);
		c.historyControls.appendChild(c.readd);
		c.historyItem.appendChild(c.historyThumbnail);
		c.historyItem.appendChild(c.historyControls);
		newDiv.appendChild(c.historyItem);

		this.historyDiv.appendChild(newDiv);
		
	},

	// function to add event listeners for buttons
	buttonsShouldDoSomething: function(){
		var watchButtons = document.getElementsByClassName('watchNow'),
			deleteButtons = document.getElementsByClassName('delet'),
			readdButtons = document.getElementsByClassName('readd');
		watchButtons = conFig.DOMtoArray(watchButtons);
		deleteButtons = conFig.DOMtoArray(deleteButtons);
		readdButtons = conFig.DOMtoArray(readdButtons);
		watchButtons.forEach(this.playButtonClick);
		deleteButtons.forEach(this.deleteButtonClick);
		readdButtons.forEach(this.readdButtonClick);
	},

	//action for clicking on delete icon, needs reloading of popup page
	deleteButtonClick: function(element, index){
		element.addEventListener('click', function(){
			chrome.runtime.sendMessage({whatToDo: 'deleteVideo', videoId: index}, function() {
				window.location.reload(true);
			});
		});
	},

	//action for clicking on watch now button
	playButtonClick: function(element, index){
		var id = playlist.videosArrayButtons[index],
			link = 'https://www.youtube.com/watch?v='+ id +'&feature=watchnext';
		element.addEventListener('click', function(){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				var tab = tabs[0];
				//opens link in the most recent active tab
				chrome.tabs.update(tab.id, {url: link});
				//deletes the video from playlist and closes the popup window
				chrome.runtime.sendMessage({whatToDo: 'videoWatched', videoId: index}, function() {
					window.close();
				});
			});
		});
	},

	clearButtonClick: function(){
		var element = document.getElementById('clear');
		element.addEventListener('click', function(){
			var el = document.getElementById('clear'),
				what = el.value;

			if (el.classList.contains('unlocked')) {
				if (what == "Archive") {
					localStorage.setItem("watchNextArchive", '[]');
				} else if (what == "Playlist"){
					chrome.runtime.sendMessage({whatToDo: 'clearPlaylist'},(response) => {
						console.log(response)
					});
				}
				chrome.storage.local.clear();
				conFig.setIcon();
				window.close();
			} else {
				el.innerHTML = 'Do you really want to clear ' + what + '?';
				el.classList.add('unlocked');
			}
		});
	},

	readdButtonClick: function(element, index){
		var tempArchive =  JSON.parse(localStorage.getItem("watchNextArchive")),
			ind = tempArchive[index];
		element.addEventListener('click', function(){
			chrome.runtime.sendMessage({whatToDo: 'addVideoToPlaylist', videoId: ind}, function() {
				tempArchive.splice(index,1);
				chrome.storage.onChanged.addListener(playlist.refreshBecauseLocalStorageChange);
				localStorage.setItem("watchNextArchive", JSON.stringify(tempArchive));
			});
		});
	},

	refreshBecauseLocalStorageChange: function(){
		chrome.storage.onChanged.removeListener(playlist.refreshBecauseLocalStorageChange);
		window.location.reload(true);
	},

	setDuration: function() {
		if (this.playlistDuration) {
			var node = document.getElementById('duration'),
				seconds = this.playlistDuration % 60,
				minutes = ((this.playlistDuration - seconds) % 3600) / 60,
				hours = (this.playlistDuration - seconds - 60 * minutes) / 3600,
				durationText = '';
			if (hours) {
				durationText = hours + ':';
				if (minutes < 10) {
					minutes = '0' + minutes;
				}
			}

			if (seconds < 10) {
				seconds = '0' + seconds;
			}

			durationText += minutes + ':' + seconds;

			node.innerHTML = 'Playlist time: ' + durationText;	
		}

	},

	clearDeadVideos: function() {
		var i,
			deletedVideosCounter = 0;
		//check the dead videos in the playlist
		for(i in this.deadVideos){
			var index = this.tempPlaylistArray.indexOf(this.deadVideos[i]);
			while (index>-1) {
				this.tempPlaylistArray.splice(index, 1);
				deletedVideosCounter++;
				index = this.tempPlaylistArray.indexOf(this.deadVideos[i]);
			}
			//and archive
			index = this.tempArchiveArray.indexOf(this.deadVideos[i]);
			while (index>-1) {
				this.tempArchiveArray.splice(index, 1);
				deletedVideosCounter++;
				index = this.tempArchiveArray.indexOf(this.deadVideos[i]);
			}
		}
		if (deletedVideosCounter) {
			var node = document.getElementById('duration'),
				content = node.innerHTML;
			chrome.runtime.sendMessage({whatToDo: 'savePLaylist', playlist: this.tempPlaylistArray}, (response) => {
				console.log(response)
			});
			localStorage.setItem("watchNextArchive", JSON.stringify(this.tempArchiveArray));
			if (deletedVideosCounter == 1) {
				node.innerHTML = content + '<br /><br />' + deletedVideosCounter + ' video was deleted from your playlist, because it was deleted from YouTube. Sorry about that.';		
			} else {
				node.innerHTML = content + '<br /><br />' + deletedVideosCounter + ' videos were deleted from your playlist, because they were deleted from YouTube. Sorry about that.';		
			}
		}
	},

	setViewport: function() {
		if (JSON.parse(localStorage.getItem("watchNextArchive")).length){
			document.documentElement.scrollTop = 130
		}
	},

	generateClearAllButton: function(){
		var type;
		if (playlist.tempPlaylistArray.length) {
			type = 'Playlist';
		} else if (JSON.parse(localStorage.getItem("watchNextArchive")).length){
			type = 'Archive';
		} else {
			type = false;
		}
		if (type) {
			var node = document.getElementById('deleteall'),
				newDiv = document.createDocumentFragment(),
				clearButton = conFig.insert('button');
			
			clearButton.id = 'clear';
			clearButton.innerHTML = 'Clear ' + type;
			clearButton.value = type;

			newDiv.appendChild(clearButton);
			node.appendChild(newDiv);

			this.clearButtonClick();
		}

	},

	startDragAndDrop: function(){
		var items = conFig.DOMtoArray(document.getElementsByClassName('playlistItem'));
		[].forEach.call(items, function(item) {
			item.addEventListener('dragstart', playlist.dnd.handleDragStart, false);
			item.addEventListener('dragend', playlist.dnd.handleDragEnd, false);
			item.addEventListener('dragover', playlist.dnd.handleDragOver, false);
			item.addEventListener('drop', playlist.dnd.handleDrop, false);
			item.addEventListener('dragenter', playlist.dnd.handleDragEnter, false);
			item.addEventListener('dragleave', playlist.dnd.handleDragLeave, false);
		});
	},

	dnd: {
		oldPosition: false,
		newPosition: false,
		handleDragEnter: function(){
			if (playlist.dnd.oldPosition !== parseInt(this.getAttribute('data-queuePosition'))){
				if (playlist.dnd.oldPosition+1 !== parseInt(this.getAttribute('data-queuePosition'))){
					this.classList.add('dragover');
				}
			}
		},
		handleDragLeave: function(){
			this.classList.remove('dragover');
		},
		handleDragStart: function(){
			this.classList.add('dragged');
			this.parentNode.classList.add('dragdrop');
			playlist.dnd.createPhantom();
			playlist.dnd.oldPosition = parseInt(this.getAttribute('data-queuePosition'));

		},
		handleDragEnd: function(){
			this.classList.remove('dragged');
			this.parentNode.classList.remove('dragdrop');

			[].forEach.call(conFig.DOMtoArray(document.getElementsByClassName('playlistItem')), function (item) {
				item.classList.remove('dragover');
			});

			if (playlist.dnd.newPosition !== false) {
				if (playlist.dnd.oldPosition !== playlist.dnd.newPosition) {
					if (playlist.dnd.oldPosition+1 !== playlist.dnd.newPosition){
						playlist.changeOrder(playlist.dnd.oldPosition, playlist.dnd.newPosition);
					}
				}
			}

			playlist.dnd.destroyPhantom();
		},
		handleDragOver: function(e){
			if (e.preventDefault) {
				e.preventDefault(); // Necessary. Allows us to drop.
			}
			if (!this.classList.contains('dragover')){
				if(playlist.dnd.oldPosition !== parseInt(this.getAttribute('data-queuePosition'))){
					if (playlist.dnd.oldPosition+1 !== parseInt(this.getAttribute('data-queuePosition'))){
						this.classList.add('dragover');
					}
				}
			}
			//e.dataTransfer.dropEffect = 'move';
		},
		handleDrop: function(e){
			if(e.stopPropagation) {
				e.stopPropagation();
			}
			playlist.dnd.newPosition = parseInt(this.getAttribute('data-queuePosition'));
			return false;
		},
		createPhantom: function(){
			var mainNode = document.getElementById('watchNext'),
				phantom = document.createDocumentFragment(),
				element = conFig.insert('div', 'playlistPhantom');
			element.setAttribute('data-queuePosition', playlist.tempPlaylistArray.length);
			element.setAttribute('draggable', 'true');
			element.id = 'playlistPhantom';
			element.textContent = '>>>';
			phantom.appendChild(element);
			mainNode.appendChild(phantom);
			element.addEventListener('dragstart', playlist.dnd.handleDragStart, false);
			element.addEventListener('dragend', playlist.dnd.handleDragEnd, false);
			element.addEventListener('dragover', playlist.dnd.handleDragOver, false);
			element.addEventListener('drop', playlist.dnd.handleDrop, false);
			element.addEventListener('dragenter', playlist.dnd.handleDragEnter, false);
			element.addEventListener('dragleave', playlist.dnd.handleDragLeave, false);
		},
		destroyPhantom: function(){
			var phantom = document.getElementById('playlistPhantom');
			phantom.parentNode.removeChild(phantom);
			return false;
		}
	},

	changeOrder: function(oldPosition, newPosition) {
		var list = playlist.tempPlaylistArray,
			toMove = list[oldPosition],
			front = [],
			back = [],
			newList = [];

		list.splice(oldPosition,1);


		if (newPosition === 0){
			list.unshift(toMove);
			newList = list;
		} else if (newPosition === list.length+1){
			list.push(toMove);
			newList = list;
		} else if (newPosition > oldPosition){
			front = list.slice(0,newPosition-1);
			back = list.slice(newPosition-1);
			newList = front.concat(toMove,back);
		} else if (newPosition < oldPosition){
			front = list.slice(0,newPosition);
			back = list.slice(newPosition);
			newList = front.concat(toMove,back);
		}
		chrome.storage.onChanged.addListener(playlist.refreshBecauseLocalStorageChange);
		chrome.runtime.sendMessage({whatToDo: 'savePLaylist', playlist: newList}, (response) => {
			console.log(response)
		});
	},

};

var openOptions = function() {
	var optionsUrl = chrome.extension.getURL('background.html');

	chrome.tabs.query({url: optionsUrl}, function(tabs) {
		if (tabs.length) {
			chrome.tabs.update(tabs[0].id, {active: true});
		} else {
			chrome.tabs.create({url: optionsUrl});
		}
	});
}

document.addEventListener('DOMContentLoaded', function(){
	//check local storage status, start if needed.
	conFig.startLS();

	// filling the variables
	playlist.checkbox = document.getElementById('watchNextEnabled');
	playlist.parentDiv = document.getElementById('watchNext');
	playlist.historyDiv = document.getElementById('history');

	//tick the checkbox if the extension is enabled
	playlist.isCheckboxEnabled();

	//changing extension icon according to the checkbox
	playlist.checkbox.addEventListener('change', function(){
		playlist.enableDisable();
	});

	var optionsButton = document.getElementById("optionsButton");
	optionsButton.addEventListener("click", openOptions)

	//starting the generate process
	chrome.storage.local.get(function(mydata){
		playlist.library = mydata;
		chrome.storage.sync.get(function(data){
			playlist.tempPlaylistArray = conFig.convertSyncGet(data);
			if (playlist.tempPlaylistArray.length > 0) {
				playlist.getVideos();
			} else {
				chrome.runtime.sendMessage({whatToDo: 'loadVideosFromFirebaseToLocalStorage'}, (response) => {
					playlist.tempPlaylistArray = response;
					playlist.getVideos();
				});
			}
		});
		
	});
});

}());