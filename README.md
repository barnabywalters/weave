# Weave

A browser add-on which expands truncated <a href="http://indiewebcamp.com/POSSE">POSSE</a> tweet copies of indieweb content on twitter.com

## Get Weave

Weave is available for Firefox, Opera, Safari and Chrome. [Install or Download the version which is right for you here](http://waterpigs.co.uk/extensions/weave/).

## What Weave Does

Before:

<img src="http://waterpigs.co.uk/extensions/weave/before.png" alt="POSSE tweet copies of notes on a personal site are truncated on twitter.com" />

After:

<img src="http://waterpigs.co.uk/extensions/weave/after.png" alt="the truncated tweets have been replaced with the full content of the note, without having to click or leave twitter" />

## Original Post Discovery

Weave uses a partial implementation of the <a href="http://indiewebcamp.com/original-post-discovery">Original Post Discovery</a> algorithm created by the <a href="http://indiewebcamp.com">IndieWebCamp</a> community as a standard way of finding the canonical copy of a piece of content from POSSEd copies of it.

## Background

<a class="h-card" href="http://aralbalkan.com">Aral Balkan</a> came up with the idea and name for Weave at IndieWebCamp UK 2013. It addressed real-world complaints that POSSE tweet copies of indieweb content looked ugly or confusing, so I made a cross-browser extension to make it a reality.

Weave is built using the <a href="http://kangoextensions.com/kango.html">Kango</a> cross-browser extension framework, which allows extension code to be written once and then automatically turned into extensions for Firefox, Opera, Safari and Chrome.

## Version History

### v0.9.1
* rel=syndication on the original copy page is now supported in addition to class=u-syndication
* missing author information on the original copy is handled more gracefully

### v0.9.0
* Initial version with basic support for tweet expansion