"use strict";
//variable used later to store the information needed for visual playlist
var a={};
//initialize local storage, when there is no time to send message to background.js
if (!localStorage.hasOwnProperty("watchNextPlaylist")){
	localStorage.watchNextPlaylist = "[]";
}

var playlist={
	//change extension icon
	changeIcon: function(){
		if ($("#watchNextEnabled").prop('checked')){
			localStorage.watchNext="true";
			//green arrow
			chrome.browserAction.setIcon({path: "icon32.png"});
		}else{
			localStorage.watchNext="false";
			//red cross
			chrome.browserAction.setIcon({path: "icon32_disabled.png"});
		}
	},
	
	isCheckboxEnabled: function(){
		if(localStorage.hasOwnProperty("watchNext")){
			//proceed to determine the extension status
			//and check/uncheck the checkbox
			if (JSON.parse(localStorage.watchNext)){
				$("#watchNextEnabled").prop('checked', true);
			} else {
				$("#watchNextEnabled").prop('checked', false);
			}
		} else {
			//on first installation the extension will be enabled
			//and checkbox checked
			localStorage.watchNext = "true";
			$("#watchNextEnabled").prop('checked', true);
		}
	},
	//creates a string of video ids to send to YouTube API for details
	//needed to create visual playlist
	videoIds: function(){
		var localIds = JSON.parse(localStorage.watchNextPlaylist);
		var idsToSend="";
		for (var i in localIds){
			if (i===0){
				idsToSend += localIds[i];
			}else{
				idsToSend += ","+localIds[i];
			}
		}
		return idsToSend;
	},
	//communicate with YouTube API to download report on video id
	getDataFromYoutube: function(){
		var request = "https://www.googleapis.com/youtube/v3/videos?id="+this.videoIds()+"&key="+youTubeApiKey+
		"&fields=items(id,snippet(title,channelTitle,thumbnails(default)),contentDetails(duration),statistics(viewCount))&part=snippet,contentDetails,statistics";
		var oReq = new XMLHttpRequest();
		oReq.open("get", request, true);
		oReq.send();
		oReq.onload = this.saveDataFromYoutube;
	},

	//saves data in a global variable
	saveDataFromYoutube: function(){
		a = JSON.parse(this.responseText).items;
		playlist.generate();
	},
	//ISO8601 duration changed to (*HH:M)M:SS
	convertDuration: function(t){
		var duration = "";
		var period, time, years, months, weeks, days, hours, minutes, seconds;
		//dividing period from time
		var x = t.split("T");
		period = x[0].substring(1,x[0].length);
			//checking for years
			period = period.split("Y");
			if (period.length>1){
				years = parseInt(period[0]);
				period = period[1];
			} else {
				years = 0;
				period = period[0];
			}
			//checking for months
			period = period.split("M");
			if (period.length>1){
				months = parseInt(period[0]);
				period = period[1];
			} else {
				months = 0;
				period = period[0];
			}
			//checking for weeks
			period = period.split("W");
			if (period.length>1){
				weeks = parseInt(period[0]);
				period = period[1];
			} else {
				weeks = 0;
				period = period[0];
			}
			//checking for days
			period = period.split("D");
			if (period[0].length>0){
				days = parseInt(period[0]);
			} else {
				days = 0;
			}
		time = x[1];
	 		//checking for hours
			time = time.split("H");
			if (time.length>1){
				hours = parseInt(time[0]);
				time = time[1];
			} else {
				hours = 0;
				time = time[0];
			}
			//checking for minutes
			time = time.split("M");
			if (time.length>1){
				minutes = time[0];
				time = time[1];
			} else {
				minutes = "00";
				time = time[0];
			}
			//checking for seconds
			time = time.split("S");
			if (time[0].length>0){
				seconds = time[0];
				if (minutes>0&&seconds<10){
					seconds = "0" + seconds;
				}
			} else {
				seconds = "00";
				time = time[0];
			}
		//changing days, weeks, months and years to hours
		hours = hours + 24*days + 24*7*weeks + 24*7*4*months + 24*7*4*12*years;
		//add a 0 in front of minutes if the timestamp have hours in it
		if (hours>0&&minutes<10){
			minutes = "0" + minutes;
		}
		//if there are hours, the time will be longer
		if (hours>0){
			duration = "" + hours + ":";
		}
		//creating the final duration string
		duration = duration + minutes + ":" + seconds;
		return duration;
	},
	//added commas to views by reiterating them backwards
	// and inserting comma every third digit
	convertViews: function(views){
		var output="";
		for (var i in views){
			output = views[views.length-1-i] + output;
			//second argument is there to not insert commas
			//in front of the number
			if((i+1)%3===0&&i<views.length-1){
				output = "," + output;
			}
		}
		return output;
	},
	//collecting every information about the playlist item and starting generator
	generate: function(){
		for (var i in a) {
			var id = a[i].id;
			var duration = this.convertDuration(a[i].contentDetails.duration);
			var author = a[i].snippet.channelTitle;
			var title = a[i].snippet.title;
			var views = this.convertViews(a[i].statistics.viewCount);
			var thumbnail = a[i].snippet.thumbnails.default.url;
			this.newNode(id, thumbnail, duration, title, author, views, i);
		}
	},
	//creating a div template and appending to the popup page
	newNode:function(id, thumbnail, duration, title, author, views, i){
		var newDiv =
			'<div class="playlist-item" id="'+id+'">'+
				'<div class="thumbnail-container" style="background: url('+thumbnail+') 0px -11px;">'+
					'<span class="duration">'+duration+'</span>'+
				'</div>'+
				'<div class="info-container">'+
					'<span class="title">'+title+'</span>'+
					'<span class="author">by <b>'+author+'</b></span>'+
					'<span class="views">'+views+' views</span>'+
					'<div class="controls">'+
						'<img class="watch-now" id="watch'+i+'" src="icon32.png" title="Watch Now" alt="Watch Now" />'+
						'<img class="delete" id="delet'+i+'" src="icon32_disabled.png" title="Delete" alt="Delete" />'+
					'</div>'+
				'</div>'+
				'<div class="clearfix"></div>'+
			'</div>';
		$("#watchNext").append(newDiv);
	},

};

$(document).ready(function() {
	playlist.isCheckboxEnabled();
	$("#watchNextEnabled").change(function(){
		playlist.changeIcon();
	});
	//starting the generate process
	if (JSON.parse(localStorage.watchNextPlaylist).length>0){
		playlist.getDataFromYoutube();
	}
	//action for clicking on delete icon, needs reloading of popup page
	$("#watchNext").on("click", "img.delete", function() {
		chrome.runtime.sendMessage({whatToDo: "deleteVideo", videoId: $(this).attr("id").substring(5)}, function() {
			window.location.reload(true);
		});
	});
	//action for clicking on watch now button
	$("#watchNext").on("click", "img.watch-now", function() {
		//determines which item of playlist was clicked
		var linkId = $(this).attr("id").substring(5);
		//creates link
		var link = "https://www.youtube.com/watch?v="+ JSON.parse(localStorage.watchNextPlaylist)[linkId] +"&feature=watchnext";
		//opens link in the most recent active tab
		//and closes the popup page
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				var tab = tabs[0];
				chrome.tabs.update(tab.id, {url: link});
				chrome.runtime.sendMessage({whatToDo: "deleteVideo", videoId: linkId}, function() {
					window.close();
				});
		});
	});
});