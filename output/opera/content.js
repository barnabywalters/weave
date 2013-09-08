// ==UserScript==
// @include https://twitter.com
// @include http://twitter.com
// ==/UserScript==

console.log('content script running');

(function (document) {
	var tweets = document.querySelectorAll('.stream-items .tweet'),
			tweetEl,
			tweetText;
	
	function stripHashtags(str) {
		return str.replace(/#[a-zA-Z0-9]+/i, '');
	}
	
	for (var i=0;i<tweets.length;i++) {
		tweetEl = tweets[i];
		tweetText = tweetEl.querySelector('.tweet-text');
		console.log(tweetText);
		console.log(stripHashtags(tweetText.innerText));
	}
}(document));
