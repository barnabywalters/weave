// ==UserScript==
// @include https://twitter.com
// @include http://twitter.com
// ==/UserScript==

console.log('content script running');

(function (document) {
	var tweets = document.querySelectorAll('.stream-items .tweet'),
			tweetEl,
			tweetText;
	
	for (var i=0;i<tweets.length;i++) {
		tweetEl = tweets[i];
		tweetText = tweetEl.querySelector('.tweet-text');
		console.log(tweetText);
	}
}(document));
