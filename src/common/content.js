// ==UserScript==
// @include https://twitter.com
// @include http://twitter.com
// @require cassis.js
// ==/UserScript==

console.log('content script running');

(function (document) {
	var tweets = document.querySelectorAll('.stream-items .tweet'),
			tweetEl,
			tweetText;
	
	if (!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, '');
		};
	}
	
	String.prototype.trimChars = function (chars) {
		var match = '(' + chars.split('').join('|') + ')';
		return this.replace(match);
	}
	
	function stripHashtags(str) {
		return str.replace(/#[a-zA-Z0-9]+/i, '');
	}
	
	function urlParser(str) {
		var parser = document.createElement('a');
		parser.href = str;
		return parser;
	}
	
	function urlHost(str) {
		parser = urlParser(str);
		return parser.hostname;
	}
	
	function getTrailingUrl(str) {
		var parts = str.split(' ');
		var lastSegment = parts.pop();
		var url;

		if (urlHost(lastSegment)) {
			url = lastSegment;
		} else if (lastSegment === '(' && urlHost(lastSegment.trimChars('()'))) {
			url = lastSegment.trimChars('()');
		}
		
		if (url !== null || url !== '') {
			url = web_address_to_uri(url, true);
			return url.trim();
		}

		return null;
	}
	
	for (var i=0;i<tweets.length;i++) {
		tweetEl = tweets[i];
		tweetText = tweetEl.querySelector('.tweet-text');
		console.log(getTrailingUrl(stripHashtags(tweetText.innerText)));
	}
}(document));
