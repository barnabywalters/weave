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
	
	function isUrl(str) {
		var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
		'(\\#[-a-z\\d_]*)?$','i'); // fragment locator
		if(!pattern.test(str)) {
			return false;
		} else {
			return true;
		}
	}
	
	function getTrailingUrl(str) {
		var parts,
				lastSegment,
				url;
		
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
		var tweetUrl = tweetEl; // get URL here
		var potentialPosseUrl = getTrailingUrl(stripHashtags(tweetText.innerText));
		
		if (potentialPosseUrl === null)
			continue;
		
		kango.xhr.send({
			method: 'GET',
			url: potentialPosseUrl
		}, function (result) {
			// TODO: make this more robust — cast to string and check first char
			if ([404, 410, 500].indexOf(result.status) && result.response !== null) {
				console.log('HTTP Request failed', potentialPosseUrl, request);
				return;
			}
			
			var syndicationLinks = result.response.querySelectorAll('.u-syndication')
			if (syndicationLinks.length == 0)
				return;
			
			// Check all syndication links to match tweetUrl
			// TODO: redirects and stuff
			for (var i=0; i<syndicationLinks.length;i++) {
				var link = syndicationLinks[i];
				if (link.href !== tweetUrl)
					continue;
				
				// They match! awesome. Grab the e-content of the original content
				var originalContent = result.response.querySelector('.h-entry .e-content');
				tweetText.innerHTML = originalContent.innerHTML;
				return;
			}
		});
	}
}(document));
