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
	
	function isUrl(str) {
		var parser = urlParser(str);
		console.log(parser);
		return parser.scheme && parser.host;
	}
	
	function getTrailingUrl(str) {
		var parts,
				lastSegment,
				url;
		// TODO: fix this, not working
		parts = str.split(/\s/);
		parts = parts.filter(function (i) { return i !== ''; });
		lastSegment = parts.pop();
		
		if (isUrl(lastSegment)) {
			url = lastSegment;
		} else if (lastSegment.charAt(0) === '(' && isUrl(lastSegment.trimChars('()'))) {
			url = lastSegment.trimChars('()');
		}
		
		if (url !== null && url !== '' && url !== undefined) {
			url = web_address_to_uri(url, true);
			return url.trim();
		}

		return null;
	}
	
	for (var i=0;i<tweets.length;i++) {
		tweetEl = tweets[i];
		tweetText = tweetEl.querySelector('.tweet-text');
		console.log('TEXT IS: ' + stripHashtags(tweetText.innerText));
		console.log(getTrailingUrl(stripHashtags(tweetText.innerText)));
		console.log(' ');
	}
}(document));
