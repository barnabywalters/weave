kango.ChromeWindows=function(){kango.oop.mixin(this,kango.EventTarget.prototype);kango.oop.mixin(this,new kango.EventTarget);this._unloadListeners=[];this.init()};
kango.ChromeWindows.prototype={_watcher:null,_unloadListeners:null,event:{WINDOW_LOAD:"WindowLoad",WINDOW_UNLOAD:"WindowUnload"},init:function(){this._watchWindows();this._watchNotCompletelyLoadedWindows()},dispose:function(){this.removeAllEventListeners();Services.ww.unregisterNotification(this._windowWatcher);this._runUnloaders();this._unloadListeners=[]},_runUnloaders:function(){kango.array.forEach(this._unloadListeners,function(a){try{a()}catch(b){kango.console.reportError(b,"unloader")}})},_removeUnloadListener:function(a){for(var b=
this._unloadListeners,c=0;c<b.length;c++)if(b[c]==a){b.splice(c,1);break}},_listenLoadEvent:function(a,b,c){var d=function(){a.removeEventListener("load",d,!0);b.call(c||null,a)};a.addEventListener("load",d,!0)},_watchWindows:function(){this._windowWatcher=kango.func.bind(function(a,b){"domwindowopened"==b?this._listenLoadEvent(a,function(a){"navigator:browser"==a.document.documentElement.getAttribute("windowtype")&&this.fireEvent(this.event.WINDOW_LOAD,{window:a})},this):"domwindowclosed"==b&&"navigator:browser"==
a.document.documentElement.getAttribute("windowtype")&&this.fireEvent(this.event.WINDOW_UNLOAD,{window:a})},this);Services.ww.registerNotification(this._windowWatcher)},_watchNotCompletelyLoadedWindows:function(){for(var a=Services.wm.getEnumerator("navigator:browser");a.hasMoreElements();){var b=a.getNext();"complete"!=b.document.readyState&&this._listenLoadEvent(b,function(a){this.fireEvent(this.event.WINDOW_LOAD,{window:a})},this)}},getHiddenWindow:function(){return Cc["@mozilla.org/appshell/appShellService;1"].getService(Ci.nsIAppShellService).hiddenDOMWindow},
getLoadedChromeWindows:function(){for(var a=[],b=Services.wm.getEnumerator("navigator:browser");b.hasMoreElements();){var c=b.getNext();"complete"==c.document.readyState&&a.push(c)}return a},getChromeWindows:function(){for(var a=[],b=Services.wm.getEnumerator("navigator:browser");b.hasMoreElements();){var c=b.getNext();a.push(c)}return a},getMostRecentChromeWindow:function(){return Services.wm.getMostRecentWindow("navigator:browser")},registerContainerUnloader:function(a,b){var c=kango.func.bind(function(d){d&&
this._removeUnloadListener(c);b.removeEventListener("unload",c,!1);a()},this);this._unloadListeners.push(c);b.addEventListener("unload",c,!1)}};kango.registerModule(kango.getDefaultModuleRegistrar("chromeWindows",kango.ChromeWindows));