﻿var kango={event:{MESSAGE:"message"},registerModule:function(b,d){},lang:{evalInSandbox:function(b,d,c){for(var a in d)d.hasOwnProperty(a)&&(arguments.callee[a]=d[a]);eval("(function(){"+c+"\n})();")},evalScriptsInSandbox:function(b,d,c){for(var a="",e=0;e<c.length;e++){for(var f=0;f<c[e].requires.length;f++)a+=c[e].requires[f].text+"\n\n";a+=c[e].text+"\n\n"}return this.evalInSandbox(b,d,a)}},browser:{getName:function(){return null}},console:{log:function(b){"undefined"!=typeof opera?opera.postError(b):
console.log(b)}},io:{},xhr:{send:function(b,d){var c=b.contentType;if("xml"==c||"json"==c)b.contentType="text";kango.invokeAsyncCallback("kango.xhr.send",b,function(a){if(""!=a.response&&null!=a.response)if("json"==c)try{a.response=JSON.parse(a.response)}catch(e){a.response=null}else if("xml"==c)try{var f=null,f="undefined"!=typeof DOMParser?DOMParser:window.DOMParser,g=new f;a.response=g.parseFromString(a.response,"text/xml")}catch(h){a.response=null}b.contentType=c;d(a)})}},_init:function(b){"undefined"==
typeof kango.dispatchMessage&&this._initMessaging();(new kango.UserscriptEngineClient).run(window,b,window==window.top)}};








kango.browser.getName=function(){return"chrome"};kango.io.getResourceUrl=function(a){return chrome.extension.getURL(a)};
kango._initMessaging=function(){var a=[],e=Math.random().toString(),f=chrome.extension.connect({name:window==window.top?"main_"+e:e});f.onMessage.addListener(function(c){c.source=c.target=kango;for(var b=0;b<a.length;b++)a[b](c)});kango.dispatchMessage=function(a,b){f.postMessage({name:a,data:b,origin:"tab",source:null,target:null});return!0};kango.addEventListener=function(c,b){if("message"==c){for(var d=0;d<a.length;d++)if(a[d]==b)return;a.push(b)}};new kango.InvokeAsyncModule(kango);new kango.MessageTargetModule(kango)};
kango.InvokeAsyncModule=function(e){this.init(e)};
kango.InvokeAsyncModule.prototype.init=function(e){var g={},k=0,f=function(a){return"undefined"!=typeof a.call&&"undefined"!=typeof a.apply},l=function(a,b){var c={id:a.id,result:null,error:null};try{c.result=e.func.invoke(e.getContext(),a.method,a.params)}catch(d){c.error=d.toString(),kango.console.log("Error during async call method "+a.method+". Details: "+c.error)}null!=a.id&&b.dispatchMessage("KangoInvokeAsyncModule_result",c)},m=function(a,b){var c={id:a.id,result:null,error:null};try{a.params.push(function(d){c.result=
d;null!=a.id&&b.dispatchMessage("KangoInvokeAsyncModule_result",c)}),e.func.invoke(e.getContext(),a.method,a.params)}catch(d){c.error=d.toString(),null!=a.id?b.dispatchMessage("KangoInvokeAsyncModule_result",c):kango.console.log("Error during async call method "+a.method+". Details: "+c.error)}},n=function(a,b){if("undefined"!=typeof a.id&&"undefined"!=typeof g[a.id]){var c=g[a.id];try{if(null==a.error&&f(c.onSuccess))c.onSuccess(a.result);else if(f(c.onError))c.onError(a.error)}finally{delete g[a.id]}}};
e.addEventListener("message",function(a){var b={};b.KangoInvokeAsyncModule_invoke=l;b.KangoInvokeAsyncModule_invokeCallback=m;b.KangoInvokeAsyncModule_result=n;var c=a.data,d;for(d in b)if(b.hasOwnProperty(d)&&d==a.name){b[d](c,a.source);break}});var h=function(a,b){b=Array.prototype.slice.call(b,0);var c=b[b.length-1],d={onSuccess:function(){},onError:function(a){kango.console.log("Error during async call method "+b[0]+". Details: "+a)},isCallbackInvoke:a,isNotifyInvoke:!1};null!=c&&f(c)?(d.onSuccess=
function(a){c(a)},b[b.length-1]=d):(d.isNotifyInvoke=!0,b.push(d));e.invokeAsyncEx.apply(e,b)};e.invokeAsyncEx=function(a){var b=arguments[arguments.length-1],c=b.isCallbackInvoke?"KangoInvokeAsyncModule_invokeCallback":"KangoInvokeAsyncModule_invoke",d=Array.prototype.slice.call(arguments,1,arguments.length-1),f=null;b.isNotifyInvoke||(f=(Math.random()+k++).toString(),g[f]=b);e.dispatchMessage(c,{id:f,method:a,params:d})};e.invokeAsync=function(a){h(!1,arguments)};e.invokeAsyncCallback=function(a){h(!0,
arguments)}};kango.registerModule(kango.InvokeAsyncModule);
kango.MessageTargetModule=function(e){this.init(e)};
kango.MessageTargetModule.prototype.init=function(e){var a={};e.addMessageListener=function(b,d){if("undefined"!=typeof d.call&&"undefined"!=typeof d.apply){a[b]=a[b]||[];for(var c=0;c<a[b].length;c++)if(a[b][c]==d)return!1;a[b].push(d);return!0}return!1};e.removeMessageListener=function(b,d){if("undefined"!=typeof a[b])for(var c=0;c<a[b].length;c++)if(a[b][c]==d)return a[b].splice(c,1),!0;return!1};e.removeAllMessageListeners=function(){a={}};e.addEventListener("message",function(b){var d=b.name;
if("undefined"!=typeof a[d])for(var c=0;c<a[d].length;c++)a[d][c](b)})};kango.registerModule(kango.MessageTargetModule);
kango.UserscriptEngineClient=function(){};kango.UserscriptEngineClient.prototype={run:function(d,a,e){kango.invokeAsync("kango.userscript.getScripts",d.document.URL,a,e,function(b){var a={kango:kango},c;for(c in b)b.hasOwnProperty(c)&&kango.lang.evalScriptsInSandbox(d,a,b[c])})}};
window.addEventListener("DOMContentLoaded",function(){kango._init("document-end")},!1);kango._init("document-start");