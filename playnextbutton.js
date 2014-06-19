"use strict";
var button = {
	//mass production of templates
	createButtonTemplate: function(id){
		var styleButton = "right:26px;width:22px;height:22px;padding:0;border-radius:2px;";
		var tempButton = 
		'<button class="addto-button video-actions spf-nolink hide-until-delayloaded addto-watch-next-button yt-uix-button yt-uix-button-default yt-uix-button-size-small yt-uix-tooltip" '+
		'title="Watch Next" '+
		'type="button" '+
		'onclick=";return false;" '+
		'style="'+styleButton+'" '+
		'data-video-ids="'+id+'" '+
		'role="button">'+
			'<span class="yt-uix-button-content">'+
				'<img src="'+chrome.extension.getURL('icon16.png')+'" alt="Watch Next">'+
	 		'</span>'+
	 	'</button>';
	 	return tempButton;
 	},
 	//sends message to background.js
 	addVideoToPlaylist: function(id){
 		chrome.runtime.sendMessage({whatToDo: "addVideoToPlaylist", videoId: id}, function() {});
 	}
};


$(document).ready(function(){
	//we are using existing youtube features to use their css tricks
	var buttonClass = ".addto-watch-later-button";
	//where there is a watch later button, we can add our own
	$(buttonClass).each(function() {
		var tempVideoId = $(this).attr("data-video-ids");
		var watchNextButton = button.createButtonTemplate(tempVideoId);
		$(this).before(watchNextButton);
	});
	//on-click action for our little button
	$(".addto-watch-next-button").click(function() {
		var videoId = $(this).attr("data-video-ids");
		button.addVideoToPlaylist(videoId);
		//return false;
	});
});