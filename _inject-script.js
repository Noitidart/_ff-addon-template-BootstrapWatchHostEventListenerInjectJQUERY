alert('STARTING TO RUN JS FILE NOW');
try {
	(function () {
		var glblSettimeout;
		var el = document.createElement('div'),
			b = document.getElementsByTagName('body')[0];
		otherlib = false,
		msg = '';
		el.style.position = 'fixed';
		el.style.height = '32px';
		el.style.width = '220px';
		el.style.marginLeft = '-110px';
		el.style.top = '0';
		el.style.left = '50%';
		el.style.padding = '5px 10px';
		el.style.zIndex = 1001;
		el.style.fontSize = '12px';
		el.style.color = '#222';
		el.style.backgroundColor = '#f99';
		if (typeof jQuery != 'undefined') {
			msg = 'This page already using jQuery v' + jQuery.fn.jquery;
			return showMsg();
		} else if (typeof $ == 'function') {
			otherlib = true;
		}
		// more or less stolen form jquery core and adapted by paul irish
		function getScript(url, success) {
			alert('in gs 0');
			var script = document.createElement('script');
			script.src = url;
			var head = document.getElementsByTagName('head')[0],
				done = false;
			// Attach handlers for all browsers
			alert('in gs 1');
			
			glblSettimeout = setTimeout(function() {
				alert('in gs 4.1');
				if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
					done = true;
					success();
					script.onload = script.onreadystatechange = null;
					head.removeChild(script);
				}
				alert('in gs 5.1');
			}, 5000);
			
			script.onload = script.onreadystatechange = function () {
				alert('in gs 4');
				clearTimeout(glblSettimeout);
				alert('in gs 4 POST');
				if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
					done = true;
					success();
					script.onload = script.onreadystatechange = null;
					head.removeChild(script);
				}
				alert('in gs 5');
			};
			

			alert('in gs 2');
			head.appendChild(script);
			alert('in gs 3');
		}
		alert('upto getscript');
		getScript('http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js', function () {
			if (typeof jQuery == 'undefined') {
				msg = 'Sorry, but jQuery wasn\'t able to load';
			} else {
				msg = 'This page is now jQuerified with v' + jQuery.fn.jquery;
				if (otherlib) {
					msg += ' and noConflict(). Use $jq(), not $().';
				}
			}
			return showMsg();
		});

		function showMsg() {
			alert('MESSAGE FROM JQUERIER :: ' + msg);
			el.innerHTML = msg;
			b.appendChild(el);
			window.setTimeout(function () {
				if (typeof jQuery == 'undefined') {
					b.removeChild(el);
				} else {
					jQuery(el).fadeOut('slow', function () {
						jQuery(this).remove();
					});
					if (otherlib) {
						$jq = jQuery.noConflict();
					}
				}
			}, 2500);
		}
	})();
} catch (ex) {
	alert('EXCEPTION :: ' + ex);
}
alert('RUNNING JS FILE DONE');