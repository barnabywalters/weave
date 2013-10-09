// ==UserScript==
// @include https://twitter.com
// @include http://twitter.com
// @require cassis.js
// ==/UserScript==

(function (document) {
	'use strict';
	var tweets = document.querySelectorAll('.stream-items .tweet'),
		i = 0;
	
	console.log("Weaving…");
	
	if (!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, '');
		};
	}
	
	function escapeRegex(string){
		return string.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, "\\$1");
	}
	
	String.prototype.trimChars = function (chars) {
		var match = '(' + chars.split('').map(escapeRegex).join('|') + ')';
		chars = this.replace(new RegExp('^' + match + '+', 'g'), '');
		return chars.replace(new RegExp(match + '+$', 'g'), '');
	};
	
	function stripHashtags(str) {
		return str.replace(/#[a-zA-Z0-9]+/i, '');
	}
	
	function urlOrigin(str) {
		var parser = document.createElement('a');
		parser.href = str;
		return parser.origin;
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
		}
		return true;
	}
	
	function getTrailingUrl(str) {
		var parts,
				lastSegment,
				url;
		
		parts = str.split(/\s/);
		parts = parts.filter(function (i) { return i !== ')' && i !== ''; });
		parts = parts.map(function (i) { return i.trimChars('()'); });
		
		lastSegment = parts.pop();
		
		if (isUrl(lastSegment)) {
			url = lastSegment;
		}
		
		if (url !== null && url !== '' && url !== undefined) {
			url = web_address_to_uri(url, true);
			return url.trim();
		}

		return null;
	}
	
	for (i=0; i<tweets.length; i=i+1) {
		(function (tweetEl) {
			var tweetText = tweetEl.querySelector('.tweet-text'),
					tweetUrl = tweetEl.querySelector('.tweet-timestamp').href,
					tweetAuthorEl = tweetEl.querySelector('.account-group'),
					tweetPermalinkEl = tweetEl.querySelector('.tweet-timestamp'),
					potentialPosseUrl = getTrailingUrl(stripHashtags(tweetText.textContent));
			if (potentialPosseUrl === null) {
				return;
			}
			// TODO: check if domain is in blacklist, ignore if so
			
			kango.xhr.send({
				method: 'GET',
				url: potentialPosseUrl
			}, function (result) {
				// TODO: make this more robust — cast to string and check first char
				if ([404, 410, 500].indexOf(result.status) !== -1 || result.response === null) {
					console.log('HTTP Request failed', potentialPosseUrl, result);
					return;
				}
				var respDoc = document.implementation.createHTMLDocument('response');
				respDoc.documentElement.innerHTML = result.response;

				var syndicationLinks = respDoc.querySelectorAll('.u-syndication, [rel~=syndication]');
				if (syndicationLinks.length === 0) {
					return;
				}
				
				// Check all syndication links to match tweetUrl
				// TODO: redirects and stuff
				for (var i=0; i<syndicationLinks.length;i++) {
					var link = syndicationLinks[i];
					if (link.href !== tweetUrl)
						continue;

					// They match! awesome. Grab the e-content of the original content
					// TODO: refine this, maybe use an actual mf parser
					var originalContent = respDoc.querySelector('.h-entry .e-content');
					var author = respDoc.querySelector('.h-entry .p-author'), authorUrl = null;
					if (author !== null) {
						authorUrl = author.href || author.querySelector('.u-url').href;
					}
					
					var hrefToExpand = originalContent.querySelectorAll('[href]');
					for (var i=0; i<hrefToExpand.length;i++) {
						if (hrefToExpand[i].hostname === '') {
							hrefToExpand[i].setAttribute('href', urlOrigin(potentialPosseUrl) + hrefToExpand[i].href);
						}
					}
					var srcToExpand = originalContent.querySelectorAll('[src]');
					for (var i=0; i<srcToExpand.length;i++) {
						if (srcToExpand[i].hostname === '') {
							hrefToExpand[i].setAttribute('src', urlOrigin(potentialPosseUrl) + srcToExpand[i].src);
						}
					}
					
					var elToConstrain = originalContent.querySelectorAll('*');
					for (var i=0; i<elToConstrain.length;i++) {
						elToConstrain[i].style.maxWidth = '100%';
					}
					
					tweetText.innerHTML = originalContent.innerHTML.trim();
					if (author !== null) {
						tweetAuthorEl.href = authorUrl;
						tweetAuthorEl.querySelector('.username').textContent = authorUrl;
					}
					tweetPermalinkEl.href = potentialPosseUrl;
					return;
				}
			});
		}(tweets[i]));
	}
}(document));
