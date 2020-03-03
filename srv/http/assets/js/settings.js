var G = {};
var local = 0;
var intervalcputime;
var intervalscan;
var page = location.href.split( '=' ).pop();
if ( page === 'credits' ) { // no script file to get reboot data for credits page
	$.post( 'commands.php', { bash: 'cat /srv/http/data/tmp/reboot' }, function( reboot ) {
		G.reboot = reboot !== -1 ? reboot[ 0 ].split( '\n' ) : [];
	}, 'json' );
}
$( '#close' ).click( function() {
	
	if ( G.reboot.length ) {
		var cmdpower = [ 'rm -f /srv/http/data/tmp/reboot' ];
		if ( $( '#gpio' ).length ) cmdpower.push( '/usr/local/bin/gpiooff.py' );
		cmdpower.push(
			  '/usr/local/bin/ply-image /srv/http/assets/img/splash.png'
			, 'mount | grep -q /mnt/MPD/NAS && umount -l /mnt/MPD/NAS/* &> /dev/null && sleep 3'
			, 'rm -f /srv/http/data/tmp/*'
			, 'shutdown -r now'
		);
		info( {
			  icon    : 'sliders'
			, title   : 'System Setting'
			, message : 'Reboot required for:'
					   +'<br><br><w>'+ G.reboot.join( '<br>' ) +'</w>'
			, cancel  : function() {
				G.reboot = [];
				$.post( 'commands.php', { bash: 'rm -f /srv/http/data/tmp/{reboot,backup.xz}' } );
			}
			, ok      : function() {
				$.post( 'commands.php', { bash: cmdpower } );
				notify( 'Rebooting ...', '', 'reboot', -1 );
			}
		} );
	} else {
		location.href = '/';
	}
} );
$( '.page-icon' ).click( function() {
	location.reload();
} );
$( '#help' ).click( function() {
	$( this ).toggleClass( 'blue' );
	$( '.help-block' ).toggleClass( 'hide' );
} );

onVisibilityChange( function( visible ) {
	if ( page === 'credits' ) return
	
	if ( visible ) {
		refreshData();
	} else {
		if ( page === 'network' ) {
			clearInterval( intervalscan );
		} else if ( page === 'system' ) {
			clearInterval( intervalcputime );
			$( '#refresh i' ).removeClass( 'blink' );
		}
	}
} );
pushstream = new PushStream( { modes: 'websocket' } );
pushstream.addChannel( 'notify' );
pushstream.connect();
pushstream.onmessage = function( msg ) {
	if ( local ) return
	
	var msg = msg[ 0 ];
	if ( msg.page === page ) refreshData();
	if ( 'reload' in msg && [ 'localhost', '127.0.0.1' ].indexOf( location.hostname ) !== -1 ) location.reload();
}
pushstream.onstatuschange = function( status ) {
	if ( status === 2 ) {
		if ( !$.isEmptyObject( G ) ) {
			$( '#loader' ).addClass( 'hide' );
			refreshData();
		}
	} else {
		$( '#loader' ).removeClass( 'hide' );
		bannerHide();
	}
}

function banner( title, message, icon ) {
	if ( typeof message === 'boolean' || typeof message === 'number' ) var message = message ? 'Enable ...' : 'Disable ...';
	notify( title, message, icon +' blink', -1 );
}
function curlPage( val, key ) {
	return 'curl -s -X POST "http://127.0.0.1/pub?id=notify" -d \'{ "'+ ( key || 'page' ) +'": "'+ val +'" }\''
}
function onVisibilityChange( callback ) {
    var visible = 1;
    function focused() {
        if ( !visible ) callback( visible = 1 );
    }
    function unfocused() {
        if ( visible ) callback( visible = 0 );
    }
    document.addEventListener( 'visibilitychange', function() {
		document.hidden ? unfocused() : focused();
	} );
    window.onpageshow = window.onfocus = focused;
    window.onpagehide = window.onblur = unfocused;
}
function resetlocal( ms ) {
	local = 0;
	setTimeout( function() {
		$( '#bannerTitle i' ).removeClass( 'blink' );
		$( '#bannerMessage' ).text( 'Done' );
	}, ms ? ms -2000 : 0 );
	setTimeout( bannerHide, ms || 2000 );
}
function showContent() {
	setTimeout( function() {
		$( '#loader' ).addClass( 'hide' );
		$( '.head, .container' ).removeClass( 'hide' );
	}, 300 );
}
if ( page === 'credits' ) showContent();
