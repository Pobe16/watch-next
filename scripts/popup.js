'use strict';

(function(){

var playlist={
	videosArray: [],
	videosLength: 0,
	checkbox: {},
	parentDiv: {},
	playlistInfo: [],
	//duration in seconds
	playlistDuration: 0,

	//store the playlist info in local variables, then start processing them
	getVideos: function(){
		this.videosArray = JSON.parse(localStorage.watchNextPlaylist);
		this.videosLength = this.videosArray.length;
		if (this.videosLength){
			playlist.getDataFromYoutube();
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
		if (JSON.parse(localStorage.watchNext)){
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
		var idsToSend=this.videosArray;
		return idsToSend.join();
	},

	//communicate with YouTube API to download report on video id
	getDataFromYoutube: function(){
		var request = 'https://www.googleapis.com/youtube/v3/videos?id=' + this.videosArray.join() + '&key='+conFig.youTubeApiKey+
		'&fields=items(id,snippet(title,channelTitle,thumbnails(default)),contentDetails(duration),statistics(viewCount))&part=snippet,contentDetails,statistics';
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
		playlist.playlistInfo = JSON.parse(this.responseText).items;
		playlist.generate();
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
		for (var i in views){
			output = views[l-i] + output;
			//second argument is there to not insert commas
			//in front of the number
			if((i+1)%3===0&&i<l){
				output = ',' + output;
			}
		}
		return output;
	},

	//collecting every information about the playlist item and starting generator
	generate: function(){
			var i,
				videoDetails = {
					id: '',
					duration: '',
					author: '',
					title: '',
					views: '',
					thumbnail: ''
				};
		for (i in this.playlistInfo) {
			videoDetails.id = this.playlistInfo[i].id;
			videoDetails.duration = this.convertDuration(this.playlistInfo[i].contentDetails.duration);
			videoDetails.author = this.playlistInfo[i].snippet.channelTitle;
			videoDetails.title = this.playlistInfo[i].snippet.title;
			videoDetails.views = this.convertViews(this.playlistInfo[i].statistics.viewCount);
			videoDetails.thumbnail = this.playlistInfo[i].snippet.thumbnails.default.url;
			this.newNode(i, videoDetails);
		}
		/*
		we call this function here instead of DOMContentLoaded listener
		because of asynchronic nature of XMLHttpRequest
		*/
		this.buttonsShouldDoSomething();
		this.setDuration();
	},

	//creating a div template and appending to the popup page
	newNode:function(i, details){
		
		var toConstruct = {
			playlistItem: 'div',
			thumbnailContainer: 'div',
			duration: 'span',
			infoContainer: 'div',
			title: 'span',
			author: 'span',
			views: 'span',
			controls: 'div',
			watchNow: 'img',
			delet: 'img',
			clearfix:'div'
			},
			//c will be a DOM playground
			c = {},
			newDiv = document.createDocumentFragment();
			
		//creating DOM elements
		for (var a in toConstruct){
			c[a] = conFig.insert(toConstruct[a], a);
		}
		
		//setting attributes
		c.watchNow.id = 'watch' + i;
		c.watchNow.src = chrome.extension.getURL('icons/icon32.png');
		c.watchNow.title = 'Watch Now';
		c.watchNow.alt = 'Watch Now';
		c.delet.id = 'delet' + i;
		c.delet.src = chrome.extension.getURL('icons/icon_delete_32.png');
		c.delet.title = 'Delete';
		c.delet.alt = 'Delete';
		c.duration.innerHTML = details.duration;
		c.title.innerHTML = details.title;
		c.author.innerHTML = 'by <b>' + details.author + '</b>';
		c.views.innerHTML = details.views + 'views';
		c.thumbnailContainer.setAttribute('style', 'background: url(' + details.thumbnail + ') 0px -11px;');
		c.playlistItem.id = details.id;

		// glueing it all together
		c.controls.appendChild(c.watchNow);
		c.controls.appendChild(c.delet);
		c.thumbnailContainer.appendChild(c.duration);
		c.infoContainer.appendChild(c.title);
		c.infoContainer.appendChild(c.author);
		c.infoContainer.appendChild(c.views);
		c.infoContainer.appendChild(c.controls);
		c.playlistItem.appendChild(c.thumbnailContainer);
		c.playlistItem.appendChild(c.infoContainer);
		c.playlistItem.appendChild(c.clearfix);
		newDiv.appendChild(c.playlistItem);

		this.parentDiv.appendChild(newDiv);
	},

	// function to add event listeners for buttons
	buttonsShouldDoSomething: function(){
		var watchButtons = document.getElementsByClassName('watchNow'),
			deleteButtons = document.getElementsByClassName('delet');
		watchButtons = conFig.DOMtoArray(watchButtons);
		deleteButtons = conFig.DOMtoArray(deleteButtons);
		watchButtons.forEach(this.playButtonClick);
		deleteButtons.forEach(this.deleteButtonClick);
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
		var id = playlist.videosArray[index],
			link = 'https://www.youtube.com/watch?v='+ id +'&feature=watchnext';
		element.addEventListener('click', function(){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				var tab = tabs[0];
				//opens link in the most recent active tab
				chrome.tabs.update(tab.id, {url: link});
				//deletes the video from playlist and closes the popup window
				chrome.runtime.sendMessage({whatToDo: 'deleteVideo', videoId: index}, function() {
					window.close();
				});
			});
		});
	},
	setDuration: function(){
		if (this.playlistDuration) {
			var node = document.getElementById('duration'),
				seconds = this.playlistDuration % 60,
				minutes = ((this.playlistDuration - seconds) % 3600) / 60,
				hours = (this.playlistDuration - seconds - 60 * minutes) / 3600,
				durationText = '';
			console.log(this.playlistDuration);
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
};

document.addEventListener('DOMContentLoaded', function(){
	//check local storage status, start if needed.
	conFig.startLS();

	// filling the variables
	playlist.checkbox = document.getElementById('watchNextEnabled');
	playlist.parentDiv = document.getElementById('watchNext');

	//tick the checkbox if the extension is enabled
	playlist.isCheckboxEnabled();

	//changing extension icon according to the checkbox
	playlist.checkbox.addEventListener('click', function(){
		playlist.enableDisable();
	});

	//starting the generate process
	playlist.getVideos();
});

}());