const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const self = {
	id: 'Bootstrap-Watch-Host-Event-Listener-Inject-Files',
	suffix: '@jetpack',
	path: 'chrome://bootstrap-watch-host-event-listener-inject-files/content/',
	aData: 0,
};
const ignoreFrames = true;
const hostPattern = '.'; //if a page load matches this host it will inject into it

Cu.import('resource://gre/modules/Services.jsm');

function addInjections(theDoc) {
	Cu.reportError('addInjections host = ' + theDoc.location.host);
	if (!theDoc) { Cu.reportError('no doc!'); return; } //document not provided, it is undefined likely
	//////if(!(theDoc.location && theDoc.location.host.indexOf(hostPattern) > -1)) { Cu.reportError('location not match host:' + theDoc.location.host); return; }
	if (!theDoc instanceof Ci.nsIDOMHTMLDocument) { Cu.reportError('not html doc'); return; } //not html document, so its likely an xul document //you probably dont need this check, checking host is enought
	Cu.reportError('host pass');

	removeInjections(theDoc, true); //remove my div if it was already there, this is just a precaution
	
	//add your stuff here

	var jQuery = theDoc.defaultView.wrappedJSObject.jQuery;
	//theDoc.defaultView.alert('jQuery? = ' + jQuery);
	jQuery = null;
	if (!jQuery) {
		var myScript = theDoc.createElementNS('http://www.w3.org/1999/xhtml', 'script');
		myScript.setAttribute('src', self.path + '_inject-script.js'); //'https://ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min.js');
		/* myScript.onload = function() {
			theDoc.defaultView.alert('loaded');
		}
		myScript.onreadystatechange = function(){
			theDoc.defaultView.alert('rs change = ' + this.readState);
		} */
		myScript.setAttribute('id','injected-script');
	
		var myImage = theDoc.createElement('img');
		myImage.setAttribute('src', self.path + '_inject-image.png');
		myImage.setAttribute('id','injected-image');
		myImage.setAttribute('style','position:fixed;top:0;left:0;');
		
		theDoc.documentElement.appendChild(myScript);
		theDoc.documentElement.appendChild(myImage);
	}
}

function removeInjections(theDoc, skipChecks) {
	//Cu.reportError('removeInjections');
	if (!skipChecks) {
		if (!theDoc) { Cu.reportError('no doc!'); return; } //document not provided, it is undefined likely
		//////if(!(theDoc.location && theDoc.location.host.indexOf(hostPattern) > -1)) { Cu.reportError('location not match host:' + theDoc.location.host); return; }
		//if (!theDoc instanceof Ci.nsIDOMHTMLDocument) { Cu.reportError('not html doc'); return; } //not html document, so its likely an xul document //you probably dont need this check, checking host is enought
	}
	
	var myScript = theDoc.getElementById('injected-script'); //test if myDiv is in the page
	if (myScript) {
		var alreadyThere = true;
	}
	if (alreadyThere) {
		//my stuff was found in the document so remove it
		var myImage = theDoc.getElementById('injected-image');
		
		myScript.parentNode.removeChild(myScript);
		myImage.parentNode.removeChild(myImage);
	} else {
		//else its not there so no need to do anything
	}
}

function listenPageLoad(event) {
	var win = event.originalTarget.defaultView;
	var doc = win.document;
	Cu.reportError('page loaded loc = ' + doc.location);
	if (win.frameElement) {
		//its a frame
		Cu.reportError('its a frame');
		if (ignoreFrames) {
			return;//dont want to watch frames
		}
	}
	addInjections(doc);
}

/*start - windowlistener*/
var windowListener = {
	//DO NOT EDIT HERE
	onOpenWindow: function (aXULWindow) {
		// Wait for the window to finish loading
		let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		aDOMWindow.addEventListener("load", function () {
			aDOMWindow.removeEventListener("load", arguments.callee, false);
			windowListener.loadIntoWindow(aDOMWindow, aXULWindow);
		}, false);
	},
	onCloseWindow: function (aXULWindow) {},
	onWindowTitleChange: function (aXULWindow, aNewTitle) {},
	register: function () {
		// Load into any existing windows
		let XULWindows = Services.wm.getXULWindowEnumerator(null);
		while (XULWindows.hasMoreElements()) {
			let aXULWindow = XULWindows.getNext();
			let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			windowListener.loadIntoWindow(aDOMWindow, aXULWindow);
		}
		// Listen to new windows
		Services.wm.addListener(windowListener);
	},
	unregister: function () {
		// Unload from any existing windows
		let XULWindows = Services.wm.getXULWindowEnumerator(null);
		while (XULWindows.hasMoreElements()) {
			let aXULWindow = XULWindows.getNext();
			let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			windowListener.unloadFromWindow(aDOMWindow, aXULWindow);
		}
		//Stop listening so future added windows dont get this attached
		Services.wm.removeListener(windowListener);
	},
	//END - DO NOT EDIT HERE
	loadIntoWindow: function (aDOMWindow, aXULWindow) {
		if (!aDOMWindow) {
			return;
		}
		if (aDOMWindow.gBrowser) {
			aDOMWindow.gBrowser.addEventListener('DOMContentLoaded', listenPageLoad, false);
			if (aDOMWindow.gBrowser.tabContainer) {
				//has tabContainer
				//start - go through all tabs in this window we just added to
				var tabs = aDOMWindow.gBrowser.tabContainer.childNodes;
				for (var i = 0; i < tabs.length; i++) {
					Cu.reportError('DOING tab: ' + i);
					var tabBrowser = tabs[i].linkedBrowser;
					var win = tabBrowser.contentWindow;
					loadIntoContentWindowAndItsFrames(win);
				}
				//end - go through all tabs in this window we just added to
			} else {
				//does not have tabContainer
				var win = aDOMWindow.gBrowser.contentWindow;
				loadIntoContentWindowAndItsFrames(win);
			}
		} else {
			//window does not have gBrowser
		}
	},
	unloadFromWindow: function (aDOMWindow, aXULWindow) {
		if (!aDOMWindow) {
			return;
		}
		if (aDOMWindow.gBrowser) {
			aDOMWindow.gBrowser.removeEventListener('DOMContentLoaded', listenPageLoad, false);
			if (aDOMWindow.gBrowser.tabContainer) {
				//has tabContainer
				//start - go through all tabs in this window we just added to
				var tabs = aDOMWindow.gBrowser.tabContainer.childNodes;
				for (var i = 0; i < tabs.length; i++) {
					Cu.reportError('DOING tab: ' + i);
					var tabBrowser = tabs[i].linkedBrowser;
					var win = tabBrowser.contentWindow;
					unloadFromContentWindowAndItsFrames(win);
				}
				//end - go through all tabs in this window we just added to
			} else {
				//does not have tabContainer
				var win = aDOMWindow.gBrowser.contentWindow;
				unloadFromContentWindowAndItsFrames(win);
			}
		} else {
			//window does not have gBrowser
		}
	}
};
/*end - windowlistener*/

function loadIntoContentWindowAndItsFrames(theWin) {
	var frames = theWin.frames;
	var winArr = [theWin];
	for (var j = 0; j < frames.length; j++) {
		winArr.push(frames[j].window);
	}
	Cu.reportError('# of frames in tab: ' + frames.length);
	for (var j = 0; j < winArr.length; j++) {
		if (j == 0) {
			Cu.reportError('**checking win: ' + j + ' location = ' + winArr[j].document.location);
		} else {
			Cu.reportError('**checking frame win: ' + j + ' location = ' + winArr[j].document.location);
		}
		var doc = winArr[j].document;
		//START - edit below here
		addInjections(doc);
		if (ignoreFrames) {
			break;
		}
		//END - edit above here
	}
}

function unloadFromContentWindowAndItsFrames(theWin) {
	var frames = theWin.frames;
	var winArr = [theWin];
	for (var j = 0; j < frames.length; j++) {
		winArr.push(frames[j].window);
	}
	Cu.reportError('# of frames in tab: ' + frames.length);
	for (var j = 0; j < winArr.length; j++) {
		if (j == 0) {
			Cu.reportError('**checking win: ' + j + ' location = ' + winArr[j].document.location);
		} else {
			Cu.reportError('**checking frame win: ' + j + ' location = ' + winArr[j].document.location);
		}
		var doc = winArr[j].document;
		//START - edit below here
		removeInjections(doc);
		if (ignoreFrames) {
			break;
		}
		//END - edit above here
	}
}

var httpRequestObserver =
{
    observe: function(subject, topic, data)
    {
    	Cu.reportError('observing req')
        var httpChannel, requestURL;
        httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);
        requestURL = httpChannel.URI.spec;

	if (httpChannel.responseStatus !== 200) {
		return;
	}
	
    var cspRules;
    var mycsp;
    // thre is no clean way to check the presence of csp header. an exception
    // will be thrown if it is not there.
    // https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIHttpChannel
    console.info('reading response headers on requestURL = ', requestURL)
    try {    
    	console.warn('trying to set init')
        cspRules = httpChannel.getResponseHeader("Content-Security-Policy");
        mycsp = _getCspAppendingMyHostDirective(cspRules);
        httpChannel.setResponseHeader('Content-Security-Policy', mycsp, false);
        console.warn('set init done')
    } catch (e) {
        try {
        	console.warn('trying to set fallback')
            // Fallback mechanism support             
            cspRules = httpChannel.getResponseHeader("X-Content-Security-Policy");
            mycsp = _getCspAppendingMyHostDirective(cspRules);    
            httpChannel.setResponseHeader('X-Content-Security-Policy', mycsp, false);            
            console.warn('fallback set done')
        } catch (e) {
            // no csp headers defined
            console.warn('no csp headers defined so SHOULD be able to inject script here url = ' + requestURL);
            return;
        }
    }
    }
    
};

Cu.import('resource://gre/modules/devtools/Console.jsm');

/**
 * @var cspRules : content security policy 
 * For my requirement i have to append rule just to 'script-src' directive. But you can
 * modify this function to your need.
 *
 */
function _getCspAppendingMyHostDirective(cspRules) {
    var rules = cspRules.split(';');
    var scriptSrcFound = false;
    for (var ii = 0; ii < rules.length; ii++) {
        if ( rules[ii].toLowerCase().indexOf('script-src') != -1 ) {
            rules[ii] = 'script-src *'; // define your own rule here
            scriptSrcFound = true;
        }
    }
    
    return rules.join(';');
}

function startup(aData, aReason) {
	windowListener.register();
	Cu.reportError('startup start')
	Services.obs.addObserver(httpRequestObserver, 'http-on-examine-response', false);
	Cu.reportError('startup done')
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) return;
	windowListener.unregister();
	
	Services.obs.removeObserver(httpRequestObserver, 'http-on-examine-response', false);
}

function install() {}

function uninstall() {}
