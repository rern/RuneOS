var G = {
	  apikeyfanart : '06f56465de874e4c75a2e9f0cc284fa3'
	, apikeylastfm : 'ba8ad00468a50732a3860832eaed0882'
	, artistalbum  : ''
	, bookmarkedit : 0
	, browsemode   : ''
	, countsong    : $( '#home-blocks' ).data( 'count' )
	, cvscrolltop  : 0
	, currentpage  : 'playback'
	, currentpath  : ''
	, dbback       : 0
	, dbbackdata   : []
	, dbbrowsemode : ''
	, dblist       : 0
	, dbscrolltop  : {}
	, debounce     : ''
	, debouncevol  : ''
	, debouncems   : 300
	, display      : {}
	, imodedelay   : 0
	, list         : {}
	, library      : 0
	, local        : 0
	, localhost    : [ 'localhost', '127.0.0.1' ].indexOf( location.hostname ) !== -1
	, lsplaylists  : []
	, pladd        : {}
	, playback     : 1
	, playlist     : 0
	, pleditor     : 0
	, pllist       : {}
	, plscrolltop  : 0
	, scale        : 1
	, screenS      : window.innerHeight < 590 || window.innerWidth < 500
	, scrollspeed  : 80 // pixel/s
	, similarpl    : -1
	, status       : {}
}
var data = {}
var picaOption = { // pica.js
	  unsharpAmount    : 100  // 0...500 Default = 0 (try 50-100)
	, unsharpThreshold : 5    // 0...100 Default = 0 (try 10)
	, unsharpRadius    : 0.6
//	, quality          : 3    // 0...3 Default = 3 (Lanczos win=3)
//	, alpha            : true // Default = false (black crop background)
};
var A2Z = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split( '' );
var hash = Date.now();
var coverrune = '/assets/img/cover.'+ hash +'.svg';
var vustop = '/assets/img/vustop.'+ hash +'.gif';
if ( G.localhost ) {
	var vu = '/assets/img/vustop.'+ hash +'.gif';
	var blinkdot = '<a>·</a>&ensp;<a>·</a>&ensp;<a>·</a>';
} else {
	var vu = '/assets/img/vu.'+ hash +'.gif';
	var blinkdot = '<a class="dot">·</a>&ensp;<a class="dot dot2">·</a>&ensp;<a class="dot dot3">·</a>';
}

$.post( 'commands.php', { getdisplay: 1, data: 1 }, function( data ) {
	G.display = data;
	$.event.special.tap.emitTapOnTaphold = false; // suppress tap on taphold
	$.event.special.swipe.horizontalDistanceThreshold = 80; // pixel to swipe
	$.event.special.tap.tapholdThreshold = 1000;
	setSwipe();
}, 'json' );

// MutationObserver - watch for '#db-entries' content changed then scroll to previous position
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observerOption = { childList: true };
var observerLibrary = document.getElementById( 'db-entries' );

$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

$( '#cover-art' ).on( 'error', function() {
	var $this = $( this );
	$this.unbind( 'error' );
	if ( G.status.ext === 'radio' ) {
		$this
			.attr( 'src', status.state === 'play' ? vu : vustop )
			.css( 'border-radius', '18px' )
		$( '#coverartoverlay' ).removeClass( 'hide' );
	} else {
		$this
			.attr( 'src', coverrune )
			.css( 'border-radius', '' );
		$( '#coverartoverlay' ).addClass( 'hide' );
	}
} ).one( 'load', function() {
	$( '#splash' ).remove();
	$( '#cover-art' ).removeClass( 'hide' );
	$( '.rs-animation .rs-transition' ).css( 'transition-property', '' ); // restore animation after load
	$( 'html, body' ).scrollTop( 0 );
	if ( !$( '#divcoverarts' ).html() ) return
	
	var lazyL = $( '#divcoverarts .lazy' ).length;
	var lazyLoad = new LazyLoad( { elements_selector: '.lazy' } );
	// for load 1st page without lazy
	var perrow = $( 'body' )[ 0 ].clientWidth / 200;
	var percolumn = window.innerHeight / 200;
	var perpage = Math.ceil( perrow ) * Math.ceil( percolumn );
	if ( perpage > lazyL ) perpage = lazyL;
	var lazy = document.getElementsByClassName( 'lazy' );
	for( i = 0; i < perpage; i++ ) lazyLoad.load( lazy[ i ], 'force' );
} );
// COMMON /////////////////////////////////////////////////////////////////////////////////////
$( '#menu-settings, #badge' ).click( function() {
	$( '#settings' )
		.toggleClass( 'hide' )
		.css( 'top', ( G.bars ? '40px' : 0 ) );
	$( '.contextmenu' ).addClass( 'hide' );
} );
var chklibrary = {
	  coverart       : '_<i class="fa fa-coverart"></i>CoverArt'
	, sd             : '<i class="fa fa-microsd"></i>SD'
	, usb            : '_<i class="fa fa-usbdrive"></i>USB'
	, nas            : '<i class="fa fa-network"></i>Network'
	, webradio       : '_<i class="fa fa-webradio"></i>Webradio'
	, album          : '<i class="fa fa-album"></i>Album'
	, artist         : '_<i class="fa fa-artist"></i>Artist'
	, composer       : '<i class="fa fa-composer"></i>Composer'
	, albumartist    : '_<i class="fa fa-albumartist"></i>Album Artist'
	, genre          : '<i class="fa fa-genre"></i>Genre'
	, count          : '_<gr>text</gr> Count'
	, label          : '<gr>text</gr> Label'
	, hr             : '<hr>'
	, thumbbyartist  : '<i class="fa fa-coverart"></i>Sort CoverArts by artist'
	, backonleft     : '<i class="fa fa-arrow-left"></i>Back button on left side'
	, hr1            : '<hr>'
	, playbackswitch : 'Switch to Playback <gr>on</gr> <i class="fa fa-play-plus"></i>or <i class="fa fa-play-replace"></i>'
	, tapaddplay     : 'Tap song&ensp;<gr>=</gr>&ensp;<i class="fa fa-play-plus"></i>Add + Play'
	, tapreplaceplay : 'Tap song&ensp;<gr>=</gr>&ensp;<i class="fa fa-play-replace"></i>Replace + Play'
	, plclear        : 'Confirm <gr>on replace Playlist</gr>'
}
$( '#displaylibrary' ).click( function() {
	var thumbbyartist = 'thumbbyartist' in G.display;
	info( {
		  icon     : 'library'
		, title    : 'Library Tools'
		, message  : 'Show selected items:'
		, checkbox : '<form id="displaysavelibrary">'+ displayCheckbox( chklibrary ) +'</form>'
		, preshow  : function() {
			$( 'input[name="tapaddplay"], input[name="tapreplaceplay"]' ).click( function() {
				var toggle = $( this ).prop( 'name' ) === 'tapaddplay' ? 'tapreplaceplay' : 'tapaddplay';
				if ( $( this ).prop( 'checked' ) ) $( 'input[ name="'+ toggle +'" ]' ).prop( 'checked', 0 ) ;
			} );
		}
		, ok       : function () {
			var checked = [ 'library' ];
			$( '#displaysavelibrary input:checked' ).each( function() {
				checked.push( this.name );
			} );
			G.local = 1;
			setTimeout( function() { G.local = 0 }, 300 );
			$.post( 'commands.php', { setdisplay: checked, library: 1 }, function() {
				if ( 'thumbbyartist' in G.display !== thumbbyartist ) location.reload();
			} );
			displayItems( checked );
			renderLibrary();
			if ( G.playlist && G.pleditor ) renderPlaylist();
		}
	} );
} );
var chkplayback = {
	  bars         : 'Top-Bottom bars'
	, barsauto     : 'Bars on small screen'
	, time         : 'Time'
	, radioelapsed : 'Webradio elapsed'
	, cover        : 'Cover art'
	, coverlarge   : 'Large Cover art'
	, volume       : 'Volume'
	, buttons      : 'Buttons'
}
$( '#displayplayback' ).click( function() {
	if ( 'coverTL' in G ) {
		delete G.coverTL;
		$.post( 'commands.php', { getdisplay: 1, data: 1 }, function( data ) {
			G.display = data;
			displayPlayback();
			$( '#displayplayback' ).click();
		}, 'json' );
		return
	}
	
	info( {
		  icon     : 'play-circle'
		, title    : 'Playback Tools'
		, message  : 'Show selected items:'
		, checkbox : '<form id="displaysaveplayback">'+ displayCheckbox( chkplayback ) +'</form>'
		, ok       : function () {
			var checked = [ 'playback' ];
			$( '#displaysaveplayback input:checked' ).each( function() {
				checked.push( this.name );
			} );
			G.local = 1;
			setTimeout( function() { G.local = 0 }, 300 );
			$.post( 'commands.php', { setdisplay: checked } );
			displayItems( checked );
			displayPlayback();
			$( '#swipebar, .page' ).off( 'swipeleft swiperight' );
			setSwipe();
		}
	} );
	// disable by bars hide
	if ( !( 'bars' in G.display ) ) disableCheckbox( 'barsauto' );
	// disable by mpd volume
	if ( !( 'volumenone' in G.display ) ) disableCheckbox( 'volume' );
	// disable by autohide
	if ( !( 'time' in G.display ) && !( 'volume' in G.display ) ) {
		disableCheckbox( 'coverart' );
		disableCheckbox( 'buttons' );
	}
} );
$( '.settings' ).click( function( e ) {
	var id = e.target.id;
	if ( id !== 'update' ) {
		location.href = 'index-settings.php?p='+ id
	} else {
		info( {
			  icon    : 'folder-refresh'
			, title   : 'Update Library Database'
			, radio   : { 'Only changed files' : 'update', 'Rebuild entire database': 'rescan' }
			, ok      : function() {
				G.status.updating_db = 1;
				setButtonUpdate();
				$.post( 'commands.php', { bash: 'mpc '+ $( '#infoRadio input:checked' ).val() } );
			}
		} );
	}
} );
var cmdpower = $( '#gpio' ).length ? [ '/usr/local/bin/gpiooff.py' ] : [];
cmdpower.push(
	  '/usr/local/bin/ply-image /srv/http/assets/img/splash.png'
	, 'mount | grep -q /mnt/MPD/NAS && umount -l /mnt/MPD/NAS/* &> /dev/null && sleep 3' );
var jsonpower = {
	  buttonlabel : '<i class="fa fa-reboot"></i>Reboot'
	, buttoncolor : '#de810e'
	, button      : function() {
		$( '#stop' ).click();
		cmdpower.push( 'shutdown -r now' );
		$.post( 'commands.php', { bash: cmdpower } );
		notify( 'Rebooting ...', '', 'reboot', -1 );
	}
	, oklabel     : '<i class="fa fa-power"></i>Off'
	, okcolor     : '#bb2828'
	, ok          : function() {
		$( '#stop' ).click();
		cmdpower.push( 'shutdown -h now' );
		$.post( 'commands.php', { bash: cmdpower } );
		$( '#loader' )
			.css( 'background', '#000000' )
			.find( 'svg' ).css( 'animation', 'unset' );
		notify( 'Powering Off ...', '<li2>Please wait green LED blinking until off</li2>', 'power blink', -1 );
	}
	, buttonwidth : 1
}
$( '#power' ).click( function( e ) {
	if ( $( e.target ).hasClass( 'submenu' ) ) {
		$.post( 'commands.php', { screenoff: 1 } );
		return
	}
	
	var infopower = jsonpower;
	infopower.icon    = 'power';
	infopower.title   = 'Power';
	
	info( infopower ); // toggle splash screen by pushstream.onstatuschange
} );
$( '#logout' ).click( function( e ) {
	$.post( 'commands.php', { logout: 1 }, function() {
		location.reload();
	} );
} );
$( '#addons' ).click( function () {
	$.post( 'commands.php'
		, { bash: 'wget -q --no-check-certificate https://github.com/rern/RuneAudio_Addons/raw/master/addons-list.php -O /srv/http/addons-list.php' }
		, function( exit ) {
		if ( exit == -1 ) {
			info( {
				  icon    : 'info-circle'
				, message : 'Download from Addons server failed.'
						   +'<br>Please try again later.'
				, ok      : function() {
					$( '#loader' ).addClass( 'hide' );
				}
			} );
		} else {
			location.href = 'addons.php';
		}
	} );
	$( '#loader' ).removeClass( 'hide' );
} );
$( '.pkg' ).click( function( e ) {
	menuPackage( $( this ), $( e.target ) );
} );
$( '#displaycolor' ).click( function( e ) {
	if ( $( '#home-album grl' ).text() == 0 ) {
		info( {
			  icon    : 'brush'
			, title   : 'Color Editor'
			, message : 'Need at least 1 album in Library.'
		} );
		return
	}
	if ( $( e.target ).hasClass( 'submenu' ) ) {
		$.post( 'commands.php', { color : [ 200, 100, 40 ] } );
		return
	}
	
	$( '#tab-library' ).click();
	$( '#home-album' ).click();
	
	var mutationAlbum = new MutationObserver( function() {
		if ( !$( '.licover' ).length ) {
			$( '#db-entries li:eq( 0 )' ).tap();
		} else {
			var shortscreen = window.innerHeight < 590;
			$( '.licover' ).toggleClass( 'hide', shortscreen );
			$( '#db-entries .db-icon:eq(1)' ).tap();
			$( '#colorok' ).before( '<canvas id="colorpicker"></canvas>' );
			G.color = $( '#db-home' ).css( 'background-color' );
			colorpicker = new KellyColorPicker( {
				  place  : 'colorpicker'
				, size   : 230
				, color  : G.color
				, userEvents : {
					change : function( e ) {
						var hex = e.getCurColorHex();
						var h = Math.round( 360 * e.getCurColorHsv().h );
						var hsg = 'hsl('+ h +',3%,';
						$( '#menu-top, #playback-controls button, #tab-playlist a, .menu a, .submenu, #colorcancel' ).css( 'background', hsg +'30%)' );
						$( '.btnlist-top, #tab-playback a' ).css( 'background', hsg +'20%)' );
						$( '.licover i, .lidir, .db-icon, gr' ).css( 'cssText', 'color: '+ hsg +'60%) !important;' );
						$( '#tab-playback, #db-entries li.active i, #db-entries li.active .time, #db-entries li.active .li2' ).css( 'color', hsg +'30%)' );
						$( '.menu a' ).css( 'border-top', '1px solid '+ hsg +'20%)' );
						$( '#db-entries li' ).css( 'border-bottom', '1px solid '+ hsg +'20%)' );
						$( '#playback-controls .active, #tab-library a, #db-home, #db-entries li.active, #colorok' ).css( 'background-color', hex );
						$( '#rootpath, #db-back, .lialbum' ).css( 'color', hex );
						$( '.logo path.st0' ).css( 'fill', hex )
					}
				}
			} );
			$( '#divcolorpicker' ).css( 'padding-top', shortscreen ? 200 : $( '.licover' ).offset().top + 260 );
			$( '#divcolorpicker' ).removeClass( 'hide' );
			$( 'body' ).addClass( 'disablescroll' );
			mutationAlbum.disconnect();
		}
	} );
	mutationAlbum.observe( observerLibrary, observerOption );
} );
$( '#colorok' ).click( function() {
	var rgb = colorpicker.getCurColorRgb();
	if ( 'rgb('+ rgb.r +', '+ rgb.g +', '+ rgb.b +')' === G.color ) {
		$( '#colorcancel' ).click();
		return
	}
	
	var hsv = colorpicker.getCurColorHsv(); // hsv = { h: N, s: N, v: N } N = 0-1
	var s = hsv.s;
	var v = hsv.v;
	var L = ( 2 - s ) * v / 2;
	if ( L && L < 1 ) {
		S = L < 0.5 ? s * v / ( L * 2 ) : s * v / ( 2 - L * 2 );
		var hsl = [ Math.round( 360 * hsv.h ), Math.round( S * 100 ), Math.round( L * 100 ) ];
	} else {
		var hsl = [ 0, 0, L * 100 ];
	}
	$.post( 'commands.php', { color : hsl } );
} );
$( '#colorcancel' ).click( function() {
	colorpicker.destroy();
	$( '#divcolorpicker' ).addClass( 'hide' );
	$( '#playback-controls button, #tab-library a, #db-home, #db-entries li.active, #colorok, #colorcancel, \
		#menu-top, #tab-playlist a, .menu a, .submenu, .btnlist-top, #tab-playback a' ).css( 'background-color', '' );
	$( '#rootpath, #db-back, .lialbum, .licover i, .lidir, .db-icon, gr, grl, #tab-playback, \
		#db-entries li.active i, #db-entries li.active .time, #db-entries li.active .li2' ).css( 'color', '' );
	$( '.logo path.st0' ).css( 'fill', '' )
	$( '.menu a' ).css( 'border-top', '' );
	$( '#db-entries li' ).css( 'border-bottom', '' );
	$( 'body' ).removeClass( 'disablescroll' );
	if ( window.innerHeight < 590 ) {
		$( '.licover' ).removeClass( 'hide' );
		$( '.menu' ).addClass( 'hide' );
	}
} );
$( '#divcolorpicker' ).click( function( e ) {
	if ( e.target.id === 'divcolorpicker' ) $( '#colorcancel' ).click();
} );
$( '#tab-library' ).click( function() {
	if ( !G.status.mpd ) {
		stopAirplay();
		return
	}
	
	if ( !$( '#db-search-keyword' ).val() ) $( '#db-search-close' ).empty();
	if ( G.library ) {
		$( '#divcoverarts' ).addClass( 'hide' );
		$( '#home-blocks' ).removeClass( 'hide' );
		$( '.home-bookmark' ).children()
			.add( '.coverart img' ).css( 'opacity', '' );
		$( '.edit' ).remove();
	}
	if ( G.library && G.bookmarkedit ) {
		G.bookmarkedit = 0;
		renderLibrary();
	} else if ( G.library && G.dblist ) {
		G.dblist = G.dbback = 0;
		G.currentpath = G.browsemode = G.dbbrowsemode = ''
		G.dbbackdata = [];
		renderLibrary();
	} else {
		switchPage( 'library' );
	}
} );
$( '#tab-playback' ).click( function() {
	getPlaybackStatus();
	switchPage( 'playback' );
} )
$( '#tab-playlist' ).click( function() {
	if ( !G.status.mpd ) {
		stopAirplay();
		return
	}
	
	G.pladd = {};
	if ( G.playlist && G.pleditor ) G.pleditor = 0;
	switchPage( 'playlist' );
	if ( G.pleditor ) return
	
	$( '#pl-entries li' ).removeClass( 'active' );
	$.post( 'commands.php', { getplaylist: 'playlist' }, function( data ) {
		G.lsplaylists = data.lsplaylists || [];
		G.pllist = data.playlist;
		renderPlaylist();
	}, 'json' );
} );
$( '#swipebar' ).tap( function( e ) {
	if ( !G.swipe && e.target.id !== 'swipeL' && e.target.id !== 'swipeR' ) $( '#menu-settings' ).click();
} ).taphold( function() {
	if ( G.swipe ) return
	
	location.reload();
} );
$( '#swipeL' ).click( function() {
	var page = G.playback ? 'library' : ( G.library ? 'playlist' : 'playback' );
	$( '#tab-'+ page ).click();
} );
$( '#swipeR' ).click( function() {
	var page = G.playback ? 'playlist' : ( G.library ? 'playback' : 'library' );
	$( '#tab-'+ page ).click();
} );
$( '#page-playback' ).tap( function( e ) {
	if ( $( '.edit' ).length ) {
		if ( $( e.target ).hasClass( 'edit' ) ) return
		
		$( '.licover-remove, .licover-cover' ).remove();
		$( '#cover-art' ).css( 'opacity', '' );
		return
	}
	
	if ( $( e.target ).is( '.controls, .timemap, .covermap, .volmap' ) ) return
	
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
	$( '#swipebar' ).addClass( 'transparent' );
} );
$( '#page-library' ).tap( function( e ) {
	var $target = $( e.target );
	if ( G.bookmarkedit
		&& !$target.closest( '.home-bookmark' ).length
		&& !$target.closest( '.coverart' ).length
	) {
		G.bookmarkedit = 0;
		$( '.edit' ).remove();
		$( '.home-bookmark' ).find( '.fa-bookmark, .bklabel, img' ).css( 'opacity', '' );
		$( '.coverart img' ).css( 'opacity', '' );
	}
} );
$( '#page-library, #page-playback, #page-playlist' ).click( function( e ) {
	if ( [ 'coverTR', 'timeTR' ].indexOf( e.target.id ) === -1 ) $( '#settings' ).addClass( 'hide' );
} );
$( '#menu-top, #menu-bottom, #settings' ).click( function( e ) {
	if ( e.target.id !== 'menu-settings' && e.target.id !== 'badge' ) $( '#settings' ).addClass( 'hide' );
	$( '.controls' ).addClass( 'hide' );
	$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
	$( '#swipebar' ).addClass( 'transparent' );
} );
$( '#menu-bottom' ).taphold( function() {
	location.reload();
} );
$( '#db-entries, #pl-entries, #pl-editor' ).on( 'click', 'p', function() {
	$( '.menu' ).addClass( 'hide' );
	$( '#db-entries li, #pl-editor li' ).removeClass( 'active' );
	$( '#pl-entries li' ).removeClass( 'lifocus' );
	$( '.pl-remove' ).remove();
} );
$( '.home-block' ).click( function() {
	$( '#db-search-close' ).click();
} );
$( '#infoCheckBox' ).on( 'click', 'label', function() { // playback tools
	var $time = $( '#infoCheckBox input[name=time]' );
	var $volume = $( '#infoCheckBox input[name=volume]' );
	var $coverlarge = $( '#infoCheckBox input[name=coverlarge]' );
	var name = $( this ).find( 'input' ).prop( 'name' );
	if ( name === 'time' || name === 'volume' ) {
		if ( !$time.is( ':checked' ) && !$volume.is( ':checked' ) ) {
			$coverlarge.prop( 'checked', true );
			disableCheckbox( 'buttons', 0, 0 );
		} else if ( $time.is( ':checked' ) && $volume.is( ':checked' ) ) {
			$coverlarge.prop( 'checked', false );
		} else if ( $time.is( ':checked' ) || $volume.is( ':checked' ) ) {
			disableCheckbox( 'buttons', 1 );
		}
	} else if ( name === 'bars' ) {
		if ( $( '#infoCheckBox input[name=bars]' ).prop( 'checked' ) === true ) {
			disableCheckbox( 'barsauto', 1 );
		} else {
			disableCheckbox( 'barsauto', 0, 0 );
		}
	}
} );
// PLAYBACK /////////////////////////////////////////////////////////////////////////////////////
$( '.emptyadd' ).click( function( e ) {
	if ( $( e.target ).hasClass( 'fa' ) ) $( '#tab-library' ).click();
} );
$( '#artist, #bio-open' ).click( function() {
	if ( G.status.ext === 'radio' ) return
	
	if ( $( '#bio legend' ).text() != G.status.Artist ) {
		getBio( G.status.Artist );
	} else {
		$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
		$( '#bio' ).removeClass( 'hide' );
	}
} );
$( '#album' ).click( function() {
	if ( G.status.ext !== 'radio'&& !G.localhost ) window.open( 'https://www.last.fm/music/'+ G.status.Artist +'/'+ G.status.Album, '_blank' );
} );
$( '#time' ).roundSlider( {
	  sliderType  : 'min-range'
	, max         : 1000
	, radius      : 115
	, width       : 20
	, startAngle  : 90
	, endAngle    : 450
	, showTooltip : false
	, create      : function ( e ) {
		$timeRS = this;
	}
	, change      : function( e ) { // not fire on 'setValue'
		mpdSeek( e.value );
	}
	, start       : function () {
		clearIntervalAll();
	}
	, drag        : function ( e ) { // drag with no transition by default
		$( '#elapsed' ).text( second2HMS( Math.round( e.value / 1000 * G.status.Time ) ) );
	}
	, stop        : function( e ) { // on 'stop drag'
		mpdSeek( e.value );
	}
} );
$( '#volume' ).roundSlider( {
	  sliderType      : 'default'
	, radius          : 115
	, width           : 50
	, handleSize      : '-25'
	, startAngle      : -50
	, endAngle        : 230
	, editableTooltip : false
	, create          : function () { // maintain shadow angle of handle
		$volumeRS = this;
		$volumetransition = $( '#volume' ).find( '.rs-animation, .rs-transition' );
		$volumetooltip = $( '#volume' ).find( '.rs-tooltip' );
		$volumehandle = $( '#volume' ).find( '.rs-handle' );
		$volumehandle.addClass( 'rs-transition' ).eq( 0 )           // make it rotate with 'rs-transition'
			.rsRotate( - this._handle1.angle );                     // initial rotate
		$( '.rs-transition' ).css( 'transition-property', 'none' ); // disable animation on load
	}
	, change          : function( e ) { // (not fire on 'setValue' ) value after click or 'stop drag'
		$( e.handle.element ).rsRotate( - e.handle.angle );
		// value before 'change'
		if ( e.preValue === 0 ) unmuteColor();
		if ( G.local ) {
			G.local = 0;
		} else {
			$.post( 'commands.php', { volume: e.value } );
		}
	}
	, start           : function( e ) { // on 'start drag'
		// restore handle color immediately on start drag
		if ( e.value === 0 ) unmuteColor(); // value before 'start drag'
	}
	, drag            : function ( e ) { // drag with no transition by default
		G.local = 1; // cleared by 'change'
		$.post( 'commands.php', { volume: e.value } );
		$( e.handle.element ).rsRotate( - e.handle.angle );
	}
} );
$( '#volmute, #volM' ).click( function() {
	var vol = $volumeRS.getValue();
	if ( vol ) {
		$volumeRS.setValue( 0 );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		muteColor( vol );
		G.display.volumemute = vol;
	} else {
		$volumeRS.setValue( G.display.volumemute );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		unmuteColor();
		G.display.volumemute = 0;
	}
	$.post( 'commands.php', { volume: 'setmute' } );
} );
$( '#volup, #voldn' ).click( function() {
	var thisid = this.id;
	var vol = $volumeRS.getValue();
	if ( ( vol === 0 && ( thisid === 'voldn' ) ) || ( vol === 100 && ( thisid === 'volup' ) ) ) return

	vol = ( thisid === 'volup' ) ? vol + 1 : vol - 1;
	$volumeRS.setValue( vol );
	$.post( 'commands.php', { volume: vol } );
} );
$( '#coverTL' ).click( function() {
	if ( $( '#cover-art' ).hasClass( 'vu' ) ) return
	
	if ( 'coverTL' in G ) {
		if ( G.buttons ) G.display.buttons = 1;
		delete G.buttons;
		delete G.coverTL;
	} else {
		G.buttons = 'buttons' in G.display ? 1 : 0;
		G.coverTL = 1;
	}
	if ( !$( '#controls-cover' ).hasClass( 'hide' ) ) {
		$( '.controls' ).addClass( 'hide' );
		$( '.controls1, .rs-tooltip, #imode' ).removeClass( 'hide' );
		$( '#swipebar' ).toggleClass( 'transparent' );
	}
	$.post( 'commands.php', { getjson: '/srv/http/bash/status.sh statusonly' }, function( status ) {
		$.each( status, function( key, value ) {
			G.status[ key ] = value;
		} );
		if ( G.status.ext === 'radio' && G.status.state === 'stop' ) G.status.Title = '';
		if ( $( '#divcover' ).hasClass( 'coversmall' ) ) G.display.coverlarge = 1;
		var radio = $( '#album' ).text().slice( 0, 4 ) === 'http';
		if ( !( 'volumenone' in G.display ) ) {
			if ( !$( '#time-knob' ).hasClass( 'hide' ) && !$( '#volume-knob' ).hasClass( 'hide' ) ) {
				if ( !radio ) G.display.coverlarge = 1;
				if ( 'time' in G.display && 'volume' in G.display ) {
					delete G.display.time;
					delete G.display.volume;
					delete G.display.buttons;
				}
			} else if ( $( '#time-knob' ).hasClass( 'hide' ) && $( '#volume-knob' ).hasClass( 'hide' ) ) {
				if ( 'time' in G.display || 'volume' in G.display ) {
					if ( !radio ) G.display.coverlarge = 1;
				} else {
					delete G.display.coverlarge;
					G.display.time = 1;
					G.display.volume = 1;
				}
			} else {
				if ( 'time' in G.display && 'volume' in G.display ) {
					G.display.time = 1;
					G.display.volume = 1;
				} else {
					if ( !radio ) G.display.coverlarge = 1;
					delete G.display.time;
					delete G.display.volume;
				}
			}
		} else {
			if ( !radio ) G.display.coverlarge = 1;
			if ( !$( '#time-knob' ).hasClass( 'hide' ) ) {
				delete G.display.time;
				delete G.display.buttons;
			} else {
				G.display.time = 1;
			}
		}
		renderPlayback();
		displayPlayback();
		setButton();
		if ( window.innerWidth < 500 ) $( '#format-bitrate' ).css( 'display', 'time' in G.display ? 'inline' : 'block' );
	}, 'json' );
} );
$( '.covermap' ).taphold( function( e ) {
	if ( !G.status.playlistlength ) return
	
	if ( [ vu, vustop ].indexOf( $( '#cover-art' ).attr( 'src' ) ) !== -1 || G.coversave ) {
		var iconremove = '';
	} else {
		var iconremove = '<i class="edit licover-remove fa fa-minus-circle"></i>';
	}
	$( '#cover-art' )
		.css( 'opacity', 0.33 )
		.after(
			 iconremove
			+'<i class="edit licover-cover fa fa-coverart"></i>'
		);
} );
$( '#divcover' ).on( 'click', '.edit, .licover-save', function( e ) {
	var $this = $( e.target );
	if ( G.status.ext !== 'radio' ) {
		if ( $this.hasClass( 'licover-remove' ) ) {
			removeCoverart();
		} else if ( $this.hasClass( 'licover-cover' ) ) {
			replaceCoverart();
		} else {
			saveCoverart();
		}
	} else {
		G.list = {};
		G.list.path = G.status.file;
		$.each( G.pllist, function( i, val ) {
			if ( val.file === G.list.path ) {
				G.list.name = val.Title;
				return false
			}
		} );
		if ( $this.hasClass( 'licover-remove' ) ) {
			var name = G.list.name;
			var urlname = G.list.path.replace( /\//g, '|' );
			info( {
				  icon        : 'webradio'
				, title       : 'Remove Coverart'
				, message     : '<img src="'+ $( '#cover-art' ).prop( 'src' ) +'">'
							   +'<span class="bkname"><br><w>'+ name +'</w><span>'
				, ok          : function() {
					$.post( 'commands.php', { bash: 'echo "'+ name +'" > "/srv/http/data/webradios/'+ urlname +'"' } );
					$( '#cover-art' ).attr( 'src', G.status.state === 'play' ? vu : vustop );
				}
			} );
		} else {
			webRadioCoverart();
		}
	}
} );
var btnctrl = {
//	  timeTL  : ''
	  timeT   : 'guide'
	, timeTR  : 'menu'
	, timeL   : 'previous'
	, timeM   : 'play'
	, timeR   : 'next'
	, timeBL  : 'random'
	, timeB   : 'stop'
	, timeBR  : 'repeat'
//	, coverTL : ''
	, coverT  : 'guide'
	, coverTR : 'menu'
	, coverL  : 'previous'
	, coverM  : 'play'
	, coverR  : 'next'
	, coverBL : 'random'
	, coverB  : 'stop'
	, coverBR : 'repeat'
	, volT    : 'volup'
	, volL    : 'voldn'
	, volM    : 'volumemute'
	, volR    : 'volup'
	, volB    : 'voldn'
}
$( '.timemap, .covermap, .volmap' ).tap( function() {
	var cmd = btnctrl[ this.id ];
	if ( 'cover' in G.display
		&& $( this ).hasClass( 'timemap' )
		|| !cmd
		|| $( '.licover-cover' ).length
	) return
	
	if ( cmd === 'guide' ) {
		$( '#controls-cover, #controls-vol, .rs-tooltip, #imode' ).toggleClass( 'hide' );
		if ( !( 'cover' in G.display ) ) $( '#controls-time, .controls1' ).toggleClass( 'hide' );
		if ( !G.bars ) $( '#swipebar' ).toggleClass( 'transparent' );
		return
	} else if ( cmd === 'menu' ) {
		setTimeout( function() { // fix: settings fired on showed
			$( '#menu-settings' ).click();
		}, 100 );
	} else if ( cmd === 'random' ) {
		$( '#random' ).click();
	} else if ( cmd === 'repeat' ) {
		if ( G.status.repeat ) {
			if ( G.status.single ) {
				$.post( 'commands.php', { bash: [ 'mpc repeat 0', 'mpc single 0' ] } );
			} else {
				$( '#single' ).click();
			}
		} else {
			$( '#repeat' ).click();
		}
	} else {
		if ( cmd === 'play' && G.status.state === 'play' ) cmd = 'pause';
		if ( cmd === 'pause'
			&& ( G.status.ext === 'radio' || !G.status.mpd ) ) return
		$( '#'+ cmd ).click();
	}
} );
$( '.btn-cmd' ).click( function() {
	var $this = $( this );
	var cmd = this.id;
	if ( !G.status.mpd ) {
		if ( cmd === 'stop' ) $.post( 'commands.php', { bash: '/srv/http/bash/shairport-startstop.sh restart' } );
		return
	}
	
	if ( $this.hasClass( 'btn-toggle' ) ) {
		var onoff = G.status[ cmd ] ? 0 : 1;
		var command = 'mpc '+ cmd +' '+ onoff;
		G.status[ cmd ] = onoff;
	} else {
		if ( cmd !== 'play' ) clearIntervalAll();
		if ( cmd === 'play' ) {
			var command = 'mpc play';
		} else if ( cmd === 'stop' ) {
			if ( !G.status.playlistlength ) return
			var command = 'mpc stop';
			$( '#pl-entries .elapsed' ).empty();
			$( '#total' ).empty();
			if ( G.status.ext !== 'radio' ) {
				$( '#elapsed' )
					.text( second2HMS( G.status.Time ) )
					.addClass( 'gr');
				$( '#time' ).roundSlider( 'setValue', 0 );
			} else {
				$( '#song' ).html( '·&ensp;·&ensp;·' );
				$( '#elapsed' ).empty();
				$( '#cover-art' ).attr( 'src', vustop );
			}
		} else if ( cmd === 'pause' ) {
			if ( G.status.state === 'stop' ) return
			
			var command = 'mpc pause';
			$( '#elapsed' ).addClass( 'bl' );
			$( '#total' ).addClass( 'wh' );
		} else if ( cmd === 'previous' || cmd === 'next' ) {
			// enable previous / next while stop
			var current = G.status.song + 1;
			var last = G.status.playlistlength;
			if ( last === 1 ) return
			
			if ( G.status.random === 1 ) {
				// improve: repeat pattern of mpd random
				var pos = Math.floor( Math.random() * last ); // Math.floor( Math.random() * ( max - min + 1 ) ) + min;
				if ( pos === current ) pos = ( pos === last ) ? pos - 1 : pos + 1; // avoid same pos ( no pos-- or pos++ in ternary )
			} else {
				if ( cmd === 'previous' ) {
					var pos = current !== 1 ? current - 1 : last;
				} else {
					var pos = current !== last ? current + 1 : 1;
				}
			}
			pos = pos || 1;
			command = G.status.state === 'play' ? 'mpc play '+ pos : [ 'mpc play '+ pos, 'mpc stop' ];
		}
		G.status.state = cmd;
	}
	$( '#playback-controls .btn-cmd' ).removeClass( 'active' );
	$( '#'+ cmd ).addClass( 'active' );
	// for gpio
	if ( command === 'mpc play' && $( '#gpio' ).hasClass( 'on' ) ) {
		command = [
			  'mpc play'
			, 'killall -9 gpiotimer.py &> /dev/null'
			, '/usr/local/bin/gpiotimer.py &> /dev/null &'
			, 'curl -s -X POST "http://127.0.0.1/pub?id=gpio" -d \'{ "state": "RESET" }\''
		];
	}
	$.post( 'commands.php', { bash: command } );
	setButtonToggle();
} );
$( '#share' ).click( function() {
	info( {
		  icon        : 'share'
		, title       : 'Sharing'
		, message     : 'Share this track:'
		, buttonwidth : 1
		, buttonlabel : '<i class="fa fa-facebook"></i>Facebook'
		, buttoncolor : '#4267b2'
		, button      : function() {
			windowopen( 'https://www.facebook.com/sharer.php?u=http%3A%2F%2Fwww.runeaudio.com%2F&display=popup' );
		}
		, oklabel     : '<i class="fa fa-twitter"></i>Twitter'
		, ok          : function() {
			windowopen( 'https://twitter.com/home?status=Listening+to+' + G.status.Title.replace( /\s+/g, '+' ) +'+by+'+ G.status.Artist.replace( /\s+/g, '+' ) +'+on+%40RuneAudio+http%3A%2F%2Fwww.runeaudio.com%2F+%23nowplaying' );
		}
	} );
} );
$( '#biocontent' ).on( 'click', '.biosimilar', function() {
	getBio( $( this ).text() );
} );
$( '#closebio' ).click( function() {
	$( '#bio' ).addClass( 'hide' );
	displayTopBottom();
} );
// LIBRARY /////////////////////////////////////////////////////////////////////////////////////
$( '#db-home' ).click( function() {
	$( '#tab-library' ).click();
	$( '.menu' ).addClass( 'hide' );
} );
$( '#db-currentpath' ).on( 'click', 'a', function() {
	if ( [ 'coverart', 'album', 'artist', 'albumartist', 'composer', 'genre' ].indexOf( G.dbbrowsemode ) !== -1 ) {
		if ( G.dbbackdata.length > 1 ) $( '#db-back' ).click();
		return
	}
	
	G.dbbrowsemode = 'file';
	if ( $( '#db-currentpath span a' ).length === 1 ) return
	
	if ( this.id === 'rootpath' ) {
		G.dbbackdata = [];
		var path = $( this ).data( 'path' );
	} else {
		var path = $( this ).find( '.lipath' ).text();
	}
	// get scroll position for back navigation
	var currentpath =  $( '#db-currentpath' ).find( '.lipath' ).text();
	G.dbscrolltop[ currentpath ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	
	var path2mode = {
		  Album       : 'album'
		, Artist      : 'artist'
		, AlbumArtist : 'albumartist'
		, Composer    : 'composer'
		, Genre       : 'genre'
	}
	getData( {
		  browsemode: path2mode[ path ]
		, path: path
	} );
} );
$( '#db-webradio-new' ).click( function() {
	webRadioNew();
} );
$( '#db-searchbtn' ).click( function() { // icon
	if ( $( '#db-currentpath .lipath' ).text() === 'Webradio' ) return
	
	$( '#db-currentpath span, #db-back, #db-searchbtn' ).addClass( 'hide' );
	$( '#db-search, #dbsearchbtn' ).removeClass( 'hide' );
	$( '#db-search-close' ).empty();
	$( '#db-currentpath' ).css( 'max-width', '40px' );
	$( '#db-search-keyword' ).focus();
} );
$( '#dbsearchbtn' ).click( function() { // search
	var keyword = $( '#db-search-keyword' ).val();
	if ( !keyword ) {
		$( '#db-search-close' ).click();
	} else {
		G.dblist = 1;
		getData( {
			  cmd     : 'search'
			, keyword : keyword
		} );
	}
} );
$( '#db-search-close' ).click( function() {
	G.keyword = '';
	$( '#db-search, #dbsearchbtn' ).addClass( 'hide' );
	$( '#db-search-close' ).empty();
	$( '#db-currentpath span, #db-searchbtn' ).removeClass( 'hide' );
	$( '#db-currentpath' ).css( 'max-width', '' );
	$( '#db-search-close' ).empty();
	if ( $( '#db-currentpath .lipath').text() ) $( '#db-back' ).removeClass( 'hide' );
	if ( !$( '#db-search-keyword' ).val() ) return
	
	$( '#db-search-keyword' ).val( '' );
	var path = $( '#db-currentpath .lipath:last').text();
	if ( !path ) {
		$( '#db-entries' ).empty();
		$( '#home-blocks' ).removeClass( 'hide' );
		return
	}
	
	if ( G.dbbackdata.length ) {
		var data = G.dbbackdata.pop();
		G.dbbackdata.pop();
	} else {
		var data = { path: path };
	}
	getData( data );
	mutationLibrary.observe( observerLibrary, observerOption );
} );
$( '#db-search-keyword' ).keydown( function( e ) {
	if ( e.key === 'Enter' ) $( '#dbsearchbtn' ).click();
} );
var mutationLibrary = new MutationObserver( function() { // on observed target changed
	var lipath = $( '#db-currentpath' ).find( '.lipath' ).text();
	if ( !$( '#divcoverarts' ).hasClass( 'hide' ) ) {
		$( 'html, body' ).scrollTop( G.cvscrolltop );
	} else {
		var scrollpos = G.dbscrolltop[ lipath ];
		$( 'html, body' ).scrollTop( scrollpos ? scrollpos : 0 );
	}
	mutationLibrary.disconnect();
} );
$( '#db-back' ).click( function() {
	$( '.menu' ).addClass( 'hide' );
	mutationLibrary.observe( observerLibrary, observerOption ); // standard js - must be one on one element
	if ( G.dbbrowsemode === 'coverart' ) {
		if ( !$( '#db-entries li' ).length ) {
			$( '#db-home' ).click();
			return
		}
		
		$( '#db-currentpath span' ).html( '<i class="fa fa-coverart"></i> <a>COVERART</a>' );
		$( '#db-currentpath .lipath' ).text( 'coverart' );
		var currentpath =  $( '#db-currentpath' ).find( '.lipath' ).text();
		G.dbscrolltop[ currentpath ] = $( window ).scrollTop();
		G.dbbackdata = [];
		var index = $( '#indexcover' ).data().index;
		index.forEach( function( index ) {
			$( '#db-index .index-'+ index ).removeClass( 'gr' );
		} );
		displayIndexBar();
		$( '#divcoverarts' ).removeClass( 'hide' );
		$( '#db-entries' ).empty();
		return
	}
	// topmost of path
	if ( G.dbbrowsemode === 'file' || !G.dbbackdata.length ) {
		if ( $( '#db-currentpath span a' ).length === 1 ) {
			renderLibrary();
		} else {
			$( '#db-currentpath a:nth-last-child( 2 )' ).click();
		}
		return
	}
	G.artistalbum = '';
	G.dbbackdata.pop();
	if ( !G.dbbackdata.length ) {
		renderLibrary();
	} else {
		getData( G.dbbackdata.pop() );
	}
} );
$( '#home-blocks' ).contextmenu( function( e ) { // disable default image context menu
	e.preventDefault();
} );
$( '.home-block' ).click( function() {
	var id = this.id;
	if ( id === 'home-coverart' || $( this ).hasClass( 'home-bookmark' ) ) return
	
	if ( ( id === 'home-usb' && !$( '#home-usb grl' ).text() )
		|| ( id === 'home-nas' && !$( '#home-nas grl' ).text() )
	) {
		$( '#loader' ).removeClass( 'hide' );
		location.href = 'index-settings.php?p=sources';
		return
	} else if ( id === 'home-webradio' ) {
		$( '#db-searchbtn' ).addClass( 'hide' );
		if ( !G.display.backonleft )$( '#db-back' ).css( 'right', '10px' );
		if ( !$( '#home-webradio grl' ).text() ) {
			webRadioNew();
			return
		}
	}

	var $this = $( this );
	var path = $this.find( '.lipath' ).text();
	var name = $this.find( '.bklabel' ).text();
	G.dblist = 1;
	mutationLibrary.observe( observerLibrary, observerOption );
	var browsemode = $this.data( 'browsemode' );
	G.dbbrowsemode = browsemode || 'file';
	getData( {
		  browsemode : browsemode
		, path       : path
	} );
} );
$( '#infoContent' ).on( 'click', '.newimg', function() {
	var img = new Image();
	img.src = $( this ).attr( 'src' );
	var cW = picacanvas.width;
	var canvas = document.createElement( 'canvas' );           // create canvas object
	canvas.width = canvas.height = cW;                         // set width and height
	var ctx = canvas.getContext( '2d' );                       // get context
	ctx.transform( 0, 1, -1, 0, cW, 0 );                       // rotate with scale + skew
	ctx.drawImage( img, 0, 0, cW, cW );                        // put image to context
	$( this ).attr( 'src', canvas.toDataURL( 'image/jpeg' ) ); // convert context to base64
} );
$( '#infoFileBox' ).change( function() {
	var file = this.files[ 0 ];
	$( '#infoButton' ).hide();
	if ( !file ) return
	
	getOrientation( file, function( ori ) {
		resetOrientation( file, ori, function( canvas, imgW, imgH ) {
			setImage( canvas, imgW, imgH );
		} );
	});
} );
$( '#home-blocks' ).on( 'tap', '.home-bookmark', function( e ) { // delegate - id changed on renamed
	if ( $( '.edit' ).length && !$( e.target ).hasClass( 'edit' )  ) {
		$( '.edit' ).remove();
		$( '.home-bookmark' ).find( '.fa-bookmark, .bklabel, img' ).css( 'opacity', '' );
		return
	}
	
	var $target = $( e.target );
	var $this = $( this );
	var path = $this.find( '.lipath' ).text();
	var name = $this.find( '.bklabel' ).text() || '';
	if ( $target.is( '.home-block-edit' ) ) {
		bookmarkRename( name, path, $this );
	} else if ( $target.is( '.home-block-cover' ) ) {
		if ( $this.find( 'img' ).length ) {
			var icon = '<img src="'+ $this.find( 'img' ).prop( 'src' ) +'">'
					  +'<span class="bkname"><br>'+ name +'<span>';
		} else {
			var icon = '<div class="infobookmark"><i class="fa fa-bookmark"></i><br><span class="bklabel">'+ $this.find( '.bklabel' ).text() +'</span></div>';
		}
		info( {
			  icon        : 'bookmark'
			, title       : 'Change Bookmark Thumbnail'
			, message     : icon
			, fileoklabel : 'Replace'
			, ok          : function() {
				var bookmarkname = path.replace( /\//g, '|' );
				var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
				$.post( 'commands.php', { imagefile: bookmarkname, base64bookmark: newimg }, function() {
					var $img = $this.find( 'img' );
					if ( $img.length ) {
						$img.attr( 'src', newimg  );
					} else {
						$this.find( '.fa-bookmark' ).remove();
						$this.find( '.divbklabel' ).remove();
						$this.find( '.lipath' ).after( '<img class="bkcoverart" src="'+ newimg +'">' );
						$( '.home-bookmark img' ).css( 'opacity', 0.33 );
					}
				} );
			}
		} );
	} else if ( $target.is( '.home-block-remove' ) ) {
		bookmarkDelete( path, name, $this );
	} else {
		G.dblist = 1;
		G.dbbrowsemode = 'file';
		getData( {
			  browsemode : 'file'
			, path       : path
		} );
	}
} ).on( 'taphold', '.home-bookmark', function() {
	if ( G.drag ) return
	
	G.bookmarkedit = 1;
	G.bklabel = $( this ).find( '.bklabel' );
	$( '.home-bookmark' ).each( function() {
		$this = $( this );
		var buttonhtml = '<i class="edit home-block-remove fa fa-minus-circle"></i>'
						+'<i class="edit home-block-cover fa fa-coverart"></i>';
		if ( !$this.find( 'img' ).length ) buttonhtml += '<i class="edit home-block-edit fa fa-edit-circle"></i>'
		$this.append( buttonhtml )
	} );
	$( '.home-bookmark' ).find( '.fa-bookmark, .bklabel, img' ).css( 'opacity', 0.33 );
} );
var sortablelibrary = new Sortable( document.getElementById( 'divhomeblocks' ), {
	  ghostClass : 'db-sortable-ghost'
	, delay      : 400
	, onStart    : function( e ) {
		G.drag = 1;
		var pos = $( e.item ).offset();
		posX = pos.left;
		posY = pos.top;
	  }
	, onMove    : function( e, oe ) {
		if ( G.bookmarkedit ) {
			if ( Math.abs( oe.clientX - posX ) > 5 || Math.abs( oe.clientY - posY ) > 5 ) {
				G.bookmarkedit = 0;
				$( '.edit' ).remove();
				$( '.home-bookmark' ).find( '.fa-bookmark, .bklabel, img' ).css( 'opacity', '' );
			}
		}
	  }
	, onEnd      : function() {
		G.drag = 0;
	  }
	, onUpdate   : function () {
		var $blocks = $( '.home-block' );
		var order = '';
		$blocks.each( function() {
			order += $( this ).find( '.lipath' ).text() +'^^';
		} );
		order = order.slice( 0, -2 );
		G.display.order = order.split( '^^' );
		$.post( 'commands.php', { setorder: order } );
	}
} );
$( '#home-coverart' ).click( function() { // fix - 'tap' also fire .coverart click here
	if ( !$( '#divcoverarts' ).html() ) {
		$( this ).taphold();
		return
	}
	
	G.dbbackdata.push( 'coverart' );
	G.dbbrowsemode = 'coverart';
	$( '#db-currentpath span' ).html( '<i class="fa fa-coverart"></i> <a>COVERART</a>' );
	$( '#db-currentpath .lipath' ).text( 'coverart' );
	$( '#home-blocks' ).addClass( 'hide' );
	$( '#divcoverarts, #db-back' ).removeClass( 'hide' );
	$( '#db-index li' ).not( ':eq( 0 )' ).addClass( 'gr' );
	$( '#db-list' ).css( 'padding-top', G.bars ? '80px' : '' );
	var index = $( '#indexcover' ).data().index;
	index.forEach( function( index ) {
		$( '#db-index .index-'+ index ).removeClass( 'gr' );
	} );
	displayIndexBar();
	setTimeout( function() {
		var cH = window.innerHeight - $( '.coverart' ).height() - 94;
		$( '#divcoverarts p' ).css( 'height', cH +'px' );
	}, 50 );
} ).taphold( function() {
	if ( G.drag ) return
	
	if ( G.status.updating_db ) {
		info( {
			  icon    : 'coverart'
			, title   : 'Coverart Thumbnails Update'
			, message : 'Library update is in progress ...'
					   +'<br>Please wait until finished.'
		} );
		return
	}
	
	if ( !$( '#divcoverarts' ).html() ) {
		var albumcount = Number( $( '#home-album grl' ).text().replace( /,/g, '' ) );
		info( {
			  icon    : 'coverart'
			, title   : 'Create Coverart Thumbnails'
			, message : 'Find coverarts and create thumbnails.'
					   + ( albumcount > 150 ? '<br>( ±'+ Math.ceil( albumcount / 150 ) +' minutes for '+ albumcount +' albums)<br>&nbsp;' : '' )
			, ok      : function() {
				$( 'body' ).append(
					'<form id="formtemp" action="addons-terminal.php" method="post">'
						+'<input type="hidden" name="alias" value="cove">'
						+'<input type="hidden" name="type" value="scan">'
						+'<input type="hidden" name="opt" value="/mnt/MPD">'
					+'</form>' );
				$( '#formtemp' ).submit();
			}
		} );
	} else {
		info( {
			  icon     : 'coverart'
			, title    : 'Coverart Thumbnails Update'
			, message  : 'Find coverarts and update thumbnails.'
						+'<br>&nbsp;'
			, checkbox : {
				  'Replace existings'       : 1
				, 'Update Library database' : 1
			}
			, ok       : function() {
				$( 'body' ).append(
					'<form id="formtemp" action="addons-terminal.php" method="post">'
						+'<input type="hidden" name="alias" value="cove">'
						+'<input type="hidden" name="type" value="scan">'
					+'</form>' );
				var opt = '/mnt/MPD';
				$( '#infoCheckBox input' ).each( function() {
					opt += $( this ).prop( 'checked' ) ? ' 1' : ' 0';
				} );
				$( '#formtemp' )
					.append( '<input type="hidden" name="opt" value="'+ opt +'">' )
					.submit();
			}
		} );
	}
} );
$( '.coverart' ).tap( function( e ) {
	if ( $( e.target ).hasClass( 'edit' ) ) return
	
	if ( $( '.edit' ).length ) {
		$( '.coverart img' ).css( 'opacity', '' );
		$( '.edit' ).remove();
		return
	}
	
	mutationLibrary.observe( observerLibrary, observerOption ); // standard js - must be one on one element
	G.cvscrolltop = $( window ).scrollTop();
	$this = $( this );
	$lipath = $this.find( '.lipath' );
	if ( $lipath.length ) {
		G.dbbrowsemode = 'file';
		getData( {
			  browsemode : 'file'
			, path       : $lipath.text()
		} );
		G.dbbrowsemode = 'coverart';
	} else {
		if ( 'thumbbyartist' in G.display ) {
			var album = $this.find( '.coverart2' ).text()
			var artist = $this.find( '.coverart1' ).text()
		} else {
			var album = $this.find( '.coverart1' ).text()
			var artist = $this.find( '.coverart2' ).text()
		}
		getData( {
			  artist     : artist
			, browsemode : 'coverart'
			, path       : album
		} );
	}
} ).taphold( function() {
	G.bookmarkedit = 1;
	$( '.coverart img' ).css( 'opacity', '' );
	$( '.edit' ).remove();
	$( '.coverart div' ).append(
		 '<i class="edit coverart-remove fa fa-minus-circle"></i>'
		+'<i class="edit coverart-cover fa fa-coverart"></i>'
	);
	$( '.coverart img' ).css( 'opacity', 0.33 );
} );
$( '#divcoverarts' ).on( 'tap', '.coverart-remove', function() {
	var $thisparent = $( this ).parent();
	var imgsrc = $thisparent.find( 'img' ).prop( 'src' );
	var $album = $thisparent.next();
	var album = $album.text();
	var artist = $album.next().text();
	var thumbname = 'thumbbyartist' in G.display ? artist +'^^'+ album : album +'^^'+ artist;
	var $thisdiv = $thisparent.parent();
	var path = $thisdiv.find( '.lipath' ).text() || '';
	if ( path ) thumbname += '^^'+ path;
	thumbname = thumbname.replace( /\//g, '|' ).replace( /#/g, '{' ).replace( /\?/g, '}' );
	var thumbfile = '/srv/http/data/coverarts/'+ thumbname + imgsrc.slice( -4 );
	info( {
		  icon    : 'coverart'
		, title   : 'Remove Thumbnail'
		, message : '<img src="'+ imgsrc +'">'
				   +'<br><wh>'+ album +'</wh>'
				   +'<br>'+ artist
		, oklabel : 'Remove'
		, ok      : function() {
			$thisdiv.remove();
			$.post( 'commands.php', { imagefile: thumbfile }, function( std ) {
				if ( std == 13 ) {
					info( {
						  icon    : 'coverart'
						, message : '<i class="fa fa-warning fa-lg"></i>&ensp;Delete file denied.'
								   +'Set directory+file <w>permission</w> and try again.'
					} );
				}
			} );
		}
	} );
} );
$( '#divcoverarts' ).on( 'tap', '.coverart-cover', function() {
	var $img = $( this ).parent().find( 'img' );
	var imgsrc = $img.data( 'src' );
	var thumbfile = imgsrc.slice( 0, -14 ) + imgsrc.slice( -3 ); // remove cache busting timestamp
	info( {
		  icon        : 'coverart'
		, title       : 'Change Thumbnail'
		, message     : '<img src="'+ imgsrc +'">'
		, fileoklabel : 'Replace'
		, ok          : function() {
			var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
			$.post( 'commands.php', { imagefile: thumbfile, base64: newimg }, function( std ) {
				if ( std == 0 ) {
					$img
						.removeAttr( 'data-src' ) // lazyload 'data-src'
						.attr( 'src', newimg );
				} else if ( std == 13 ) {
					info( {
						  icon    : 'coverart'
						, message : '<i class="fa fa-warning fa-lg"></i>&ensp;Replace file denied.'
								   +'Set directory+file <w>permission</w> and try again.'
					} );
				}
			} );
		}
	} );
} );
$( '#db-entries' ).on( 'tap', '.edit',  function() {
	var $this = $( this );
	var $img = $this.siblings( 'img' );
	var $thisli = $this.parent().parent();
	var album = $thisli.find( '.lialbum' ).text();
	var artist = $thisli.find( '.liartist' ).text();
	var lipath = $thisli.next().find( '.lipath' ).text();
	var path = '/mnt/MPD/'+ lipath.substr( 0, lipath.lastIndexOf( '/' ) );
	var fn = $this.hasClass( 'licover-remove' ) ? removeCoverart : replaceCoverart;
	fn( $img, album, artist, path );
} );
$( '#db-entries' ).on( 'taphold', '.licoverimg',  function() {
	$( this ).parent().removeClass( 'active' );
	$( '#context-menu-album' ).addClass( 'hide' );
	$this = $( this );
	var btnhtml = '<i class="edit licover-cover fa fa-coverart"></i>';
	if ( !$this.hasClass( 'nocover' ) ) btnhtml += '<i class="edit licover-remove fa fa-minus-circle"></i>';
	$this.append( btnhtml );
	$this.find( 'img' ).css( 'opacity', '0.33' );
} ).on( 'tap', 'li', function( e ) {
	var $this = $( this );
	var $target = $( e.target );
	var menushow = $( '.contextmenu:not( .hide )' ).length;
	$( '.menu' ).addClass( 'hide' );
	if ( menushow ) return
	
	$( '#db-entries li' ).removeClass( 'active' );
	if ( $target.hasClass( 'edit' ) ) return
	
	if ( $( '.edit' ).length ) {
		$( '.edit' ).remove();
		$( '.licoverimg img' ).css( 'opacity', '' );
		if ( $( this ).is( '.licover' ) ) return
	}
	
	var islast = $this.find( '.fa-music' ).length + $this.find( '.fa-webradio' ).length + $this.find( '.radiothumb' ).length;
	if ( $this.index() === 0 && $target.is( '.liartist, .fa-artist, .fa-albumartist, .licomposer, .fa-composer' ) ) {
		var name = ( $target.is( '.licomposer, .fa-composer' ) ) ? $this.find( '.licomposer' ).text() : $this.find( '.liartist' ).text();
		getBio( name );
		return
	} else if ( $target.hasClass( 'lialbum' ) ) {
		window.open( 'https://www.last.fm/music/'+ $this.find( '.liartist' ).text() +'/'+ $this.find( '.lialbum' ).text(), '_blank' );
		return
	} else if ( islast || $target.data( 'target' ) ) {
		contextmenuLibrary( $this, $target );
		return
	}
	
	// get file list in 'artist', 'composer', 'genre' mode (non-album)
	if ( $this.hasClass( 'licover' ) && G.dbbackdata.length ) {
		if ( [ 'artist', 'composer', 'genre' ].indexOf( G.dbbackdata[ 0 ].browsemode ) !== -1 ) {
			G.filelist = '';
			$( '#db-entries li .lipath' ).slice( 1 ).each( function() {
				var path = $( this ).text();
				G.filelist += '"'+ path.replace( /"/g, '\"' ) +'" ';
			} );
		}
	}
	var path = $this.find( '.lipath' ).text();
	// get scroll position for back navigation
	var currentpath = $( '#db-currentpath' ).find( '.lipath' ).text();
	G.dbscrolltop[ currentpath ] = $( window ).scrollTop();
	mutationLibrary.observe( observerLibrary, observerOption );
	$this.addClass( 'active' );
	if ( ( G.browsemode === 'artist' && currentpath !== 'Artist' )
		|| ( G.browsemode === 'albumartist' && currentpath !== 'AlbumArtist' )
	) {
		var artist = currentpath;
	} else if ( G.browsemode === 'album' || G.browsemode === 'genre' ) {
		var artist = $this.find( '.liartist' ).text() || '';
	} else {
		var artist = '';
	}
	getData( {
		  artist     : artist
		, browsemode : $this.attr( 'mode' ) || 'file'
		, path       : path
	} );
} );
$( '#db-index li' ).click( function() {
	var $this = $( this );
	if ( $this.hasClass( 'gr' ) ) return
	
	var index = $this.text();
	if ( index === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	
	var $el = $( '#divcoverarts' ).hasClass( 'hide' ) ? $( '#db-entries li' ) : $( '.coverart' );
	$el.each( function() {
		if ( $( this ).data( 'index' ) === index ) {
			$( 'html, body' ).scrollTop( this.offsetTop - ( G.bars ? 80 : 40 ) );
			return false
		}
	} );
} );
// PLAYLIST /////////////////////////////////////////////////////////////////////////////////////
$( '#pl-home' ).click( function() {
	$( '#tab-playlist' ).click();
} );
$( '#pl-back' ).click( function() {
	$( '.menu' ).addClass( 'hide' );
	if ( $( '#pl-currentpath i:eq( 0 )' ).hasClass( 'fa-list-ul' ) ) {
		$( '#plopen' ).click();
	} else {
		$( '#tab-playlist' ).click();
	}
} );
$( '#plopen' ).click( function() {
	if ( $( this ).hasClass( 'disabled' ) ) return
	
	$.post( 'commands.php', { getplaylist: 'lsplaylists' }, function( data ) {
		G.lsplaylists = data;
		$( '.playlist, #pl-searchbtn, #context-menu-plaction' ).addClass( 'hide' );
		$( '#context-menu-plaction' ).addClass( 'hide' );
		$( '#loader' ).removeClass( 'hide' );
		
		var plL = G.lsplaylists.length - 1; // less index
		var plcounthtml = '<wh><i class="fa fa-microsd"></i></wh><bl>PLAYLIST</bl>';
		plcounthtml += plL ? '<gr>&ensp;·&emsp;</gr> <whl id="pls-count">'+ numFormat( plL ) +'</whl>&ensp;<i class="fa fa-list-ul"></i>' : '';
		$( '#pl-currentpath' ).html( plcounthtml );
		$( '#pl-currentpath, #pl-back, #pl-editor, #pl-index' ).removeClass( 'hide' );
		renderLsPlaylists( G.lsplaylists );
	}, 'json' );
} );
$( '#plsave' ).click( function() {
	if ( !G.status.playlistlength ) return
	
	playlistNew();
} );
$( '#plconsume' ).click( function() {
	if ( G.status.consume ) {
		$( this ).removeClass( 'bl' );
		notify( 'Consume Mode', 'Off', 'list-ul' );
		$.post( 'commands.php', { bash: 'mpc consume 0' } );
	} else {
		$( this ).addClass( 'bl' );
		notify( 'Consume Mode', 'On - Remove each song after played.', 'list-ul' );
		$.post( 'commands.php', { bash: 'mpc consume 1' } );
	}
} );
$( '#pllibrandom' ).click( function() {
	if ( G.status.librandom ) {
		G.status.librandom = 0;
		$( this ).removeClass( 'bl' );
		notify( 'Roll The Dice', 'Off', 'dice' );
		$.post( 'commands.php', { bash: [
			  'systemctl stop libraryrandom'
			, 'curl -s -X POST "http://127.0.0.1/pub?id=idle" -d \'{ "changed": "options" }\''
		] } );
	} else {
		G.status.librandom = 1;
		$( this ).addClass( 'bl' );
		notify( 'Roll The Dice', 'On - Add+play random songs perpetually.', 'dice' );
		$.post( 'commands.php', { bash: [
			  'mpc random 0'
			, "mpc add \"$( mpc listall | sed '"+ Math.floor( Math.random() * G.countsong ) +"q;d' )\""
			, 'mpc play $( mpc playlist | wc -l )'
			, "mpc add \"$( mpc listall | sed '"+ Math.floor( Math.random() * G.countsong ) +"q;d' )\""
			, "mpc add \"$( mpc listall | sed '"+ Math.floor( Math.random() * G.countsong ) +"q;d' )\""
			, 'systemctl start libraryrandom'
			, 'curl -s -X POST "http://127.0.0.1/pub?id=idle" -d \'{ "changed": "options" }\''
		] } );
	}
} );
$( '#plcrop' ).click( function() {
	if ( !G.status.playlistlength ) return
	
	info( {
		  title   : 'Crop Playlist'
		, message : 'Clear this playlist except current song?'
		, ok       : function() {
			$( '#pl-entries li:not( .active )' ).remove();
			var cmd = [ G.status.state === 'stop' ? 'mpc play; mpc crop; mpc stop' : 'mpc crop' ];
			if ( G.status.librandom ) cmd.push(
				  "mpc add \"$( mpc listall | sed '"+ Math.floor( Math.random() * G.countsong ) +"q;d' )\""
				, "mpc add \"$( mpc listall | sed '"+ Math.floor( Math.random() * G.countsong ) +"q;d' )\""
			);
			$.post( 'commands.php', { bash: cmd } );
		}
	} );
} );
$( '#plclear' ).click( function() {
	if ( !G.status.playlistlength ) return
	
	if ( $( '#pl-entries .pl-remove' ).length ) {
		$( '#pl-entries .pl-remove' ).remove();
		return
	}
	
	info( {
		  title       : 'Remove From Playlist'
		, message     : 'Selective remove / Clear all :'
		, buttonlabel : '<i class="fa fa-list-ul"></i>Select'
		, buttoncolor : '#de810e'
		, button      : function() {
			$( '#pl-entries .li1' ).before( '<i class="fa fa-minus-circle pl-remove"></i>' );
		}
		, oklabel    : '<i class="fa fa-minus-circle"></i>All'
		, okcolor    : '#bb2828'
		, ok         : function() {
			G.status.playlistlength = 0;
			G.pllist = {};
			renderPlaybackBlank();
			renderPlaylist();
			$( '.licover-save' ).remove();
			$.post( 'commands.php', { bash: 'mpc clear' } );
		}
		, buttonwidth : 1
	} );
} );
$( '#pl-filter' ).keyup( playlistFilter );
$( '#pl-search-close, #plsearchbtn' ).click( function() {
	$( '#pl-search-close' ).empty();
	$( '#pl-search-close, #pl-search, #plsearchbtn' ).addClass( 'hide' );
	$( '#pl-count, #pl-manage, #pl-searchbtn, #pl-entries li' ).removeClass( 'hide' );
	$( '#pl-filter' ).val( '' );
	$( '#pl-entries' ).html( function() {
		return $( this ).html().replace( /<bl>|<\/bl>/g, '' );
	} )
} );
$( '#pl-searchbtn' ).click( function() {
	if ( !G.status.playlistlength ) return
	
	$( '#pl-search-close, #pl-search, #plsearchbtn' ).removeClass( 'hide' );
	$( '#pl-count, #pl-manage, #pl-searchbtn' ).addClass( 'hide' );
	$( '#pl-filter' ).focus();
} );
var sortableplaylist = new Sortable( document.getElementById( 'pl-entries' ), {
	  ghostClass : 'pl-sortable-ghost'
	, delay      : 400
	, onUpdate   : function ( e ) {
		if ( $( e.from ).hasClass( 'active' ) ) {
			$( e.to ).removeClass( 'active' );
			$( e.item ).addClass( 'active' )
			G.status.song = $( e.item ).index();
		}
		G.sortable = 1;
		setTimeout( function() { G.sortable = 0 }, 500 );
		$.post( 'commands.php', { bash: 'mpc move '+ ( e.oldIndex + 1 ) +' '+ ( e.newIndex + 1 ) } );
	}
} );
var sortablesavedplaylist = new Sortable( document.getElementById( 'pl-editor' ), {
	  ghostClass : 'pl-sortable-ghost'
	, delay      : 400
	, onUpdate   : function ( e ) {
		if ( !$( '#pl-currentpath .lipath' ).length ) return
		G.sortable = 1;
		setTimeout( function() { G.sortable = 0 }, 500 );
		
		var plname = $( '#pl-currentpath .lipath' ).text();
		$.post( 'commands.php', { savedplaylistedit: plname, old: e.oldIndex, new: e.newIndex } );
	}
} );
$( '#pl-entries, #pl-editor' ).on( 'swipeleft', 'li', function() {
	G.swipe = 1;
	G.swipepl = 1; // suppress .page swipe
	setTimeout( function() {
		G.swipe = 0;
		G.swipepl = 0;
	}, 500 );
	$( '#tab-library' ).click();
} ).on( 'swiperight', 'li', function() {
	G.swipe = 1;
	G.swipepl = 1;
	setTimeout( function() {
		G.swipe = 0;
		G.swipepl = 0;
	}, 500 );
	$( '#tab-playback' ).click();
} );
$( '#pl-entries' ).on( 'click', 'li', function( e ) {
	$target = $( e.target );
	$plremove = $target.hasClass( 'pl-remove' );
	if ( !$plremove && $( '.pl-remove' ).length ) {
		$( '.pl-remove' ).remove();
		return
	}
	
	if ( G.swipe || $target.hasClass( 'pl-icon' ) || $plremove ) return
	
	var $this = $( this );
	var songpos = $this.index() + 1;
	$( '#context-menu-plaction' ).addClass( 'hide' );
	var state = G.status.state;
	if ( state == 'stop' ) {
		$.post( 'commands.php', { bash: 'mpc play '+ songpos } );
	} else {
		if ( $this.hasClass( 'active' ) ) {
			if ( state == 'play' ) {
				$this.find( '.fa-webradio' ).length ? $( '#stop' ).click() : $( '#play' ).click();
			} else {
				$( '#play' ).click();
			}
		} else {
			$.post( 'commands.php', { bash: 'mpc play '+ songpos } );
		}
	}
} );
$( '#pl-entries' ).on( 'click', '.pl-icon', function( e ) {
	var $this = $( this );
	var $thisli = $this.parent();
	G.list = {};
	G.list.li = $thisli;
	G.list.path = $thisli.find( '.lipath' ).text().trim();
	G.list.name = $thisli.find( '.name' ).html().trim();
	G.list.index = $thisli.index();
	var menutop = ( $thisli.position().top + 48 ) +'px';
	var $menu = $( '#context-menu-plaction' );
	var $contextlist = $( '#context-menu-plaction a' );
	$( '#pl-entries li' ).removeClass( 'lifocus' );
	if ( !$menu.hasClass( 'hide' ) 
		&& $menu.css( 'top' ) === menutop
	) {
		$menu.addClass( 'hide' );
		return
	}
	
	var state = G.status.state;
	$thisli.addClass( 'lifocus' );
	$contextlist.removeClass( 'hide' );
	if ( $thisli.hasClass( 'active' ) ) {
		$contextlist.eq( 0 ).toggleClass( 'hide', state === 'play' );
		$contextlist.eq( 1 ).toggleClass( 'hide', state !== 'play' || $( e.target ).hasClass( 'fa-webradio' ) );
		$contextlist.eq( 2 ).toggleClass( 'hide', state === 'stop' );
	} else {
		$contextlist.eq( 1 ).add( $contextlist.eq( 2 ) ).addClass( 'hide' );
	}
	var contextnum = $menu.find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 42 - 1 );
	$menu
		.removeClass( 'hide' )
		.css( 'top', menutop );
	var targetB = $menu.offset().top + $menu.height();
	var wH = window.innerHeight;
	if ( targetB > wH - ( G.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
} );
$( '#pl-entries' ).on( 'click', '.pl-remove', function() { // remove from playlist
	removeFromPlaylist( $( this ).parent() );
} );
$( '#pl-editor' ).on( 'click', 'li', function( e ) {
	if ( G.swipe ) return
	
	$this = $( this );
	var $target = $( e.target );
	if ( $this.hasClass( 'active' )
//			&& ( $target.hasClass( 'pl-icon' ) || $target.hasClass( 'db-icon' ) )
			&& $( '.contextmenu:not( .hide )' ).length ) {
		$( '.menu' ).addClass( 'hide' );
		return
	}
	
	var pladd = Object.keys( G.pladd ).length;
	$( '.menu' ).addClass( 'hide' );
	if ( $target.hasClass( 'pl-icon' ) || $target.hasClass( 'db-icon' ) || !$this.find( '.fa-list-ul' ).length ) {
		if ( $target.data( 'target' ) === '#context-menu-file' ) {
			contextmenuLibrary( $this, $target );
		} else {
			if ( !pladd ) {
				contextmenuPlaylist( $this, $target );
			} else {
				playlistInsertSelect( $this );
			}
		}
	} else {
		renderSavedPlaylist( $this.find( '.plname' ).text() );
		if ( pladd ) playlistInsertTarget();
	}
} );
$( '#pl-index li' ).click( function() {
	var $this = $( this );
	if ( $this.hasClass( 'gr' ) ) return
	
	var index = $this.text();
	if ( index === '#' ) {
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	
	$( '#pl-editor li' ).each( function() {
		if ( $( this ).data( 'index' ) === index ) {
			$( 'html, body' ).scrollTop( this.offsetTop - ( G.bars ? 80 : 40 ) );
			return false
		}
	} );
} );

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

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
};
onVisibilityChange( function( visible ) {
	if ( visible ) {
		var color = 'color' in G.display ? G.display.color : '';
		displayTopBottom();
		if ( G.playback ) {
			getPlaybackStatus();
		} else if ( G.library ) {
			if ( !$( '#db-search-close' ).text() && !$( '#home-blocks' ).hasClass( 'hide' ) ) renderLibrary();
		} else {
			if ( $( '#pl-search-close' ).text() ) return
			
			if ( G.pleditor ) {
				$( '#pl-currentpath .lipath' ).text() ? renderSavedPlaylist( $( '#pl-currentpath .lipath' ).text() ) : $( '#plopen' ).click();
			} else {
				$.post( 'commands.php', { getplaylist: 'playlist' }, function( data ) {
					G.pllist = data.playlist;
					if ( G.playlist && !G.pleditor ) renderPlaylist();
				}, 'json' );
			}
		}
		$.post( 'commands.php', { getdisplay: 1, data: 1 }, function( data ) {
			if ( 'color' in data && data.color !== color ) {
				location.href = '/';
			} else {
				G.display = data;
				setButtonUpdate();
			}
		}, 'json' );
	} else {
		clearIntervalAll();
	}
} );
window.addEventListener( 'orientationchange', function() {
	if ( G.playback ) {
		$( '#playback-row' ).addClass( 'hide' );
		setTimeout( function() {
			if ( $( '.playback-block.hide' ).length && window.innerHeight > 420 ) $( '#page-playback, #playback-row' ).removeAttr( 'style' );
			displayPlayback();
			scrollLongText();
			$( '#playback-row' ).removeClass( 'hide' );
		}, 300 );
	} else if ( G.library ) {
		if ( G.dblist || G.pleditor  || !$( '#divcoverarts' ).hasClass( 'hide' ) ) {
			displayIndexBar();
			setTimeout( function() {
				if ( G.dblist ) {
					if ( $( '.licover' ).length ) {
						$( '#db-entries p' ).css( 'min-height', ( G.bars ? 40 : 0 ) +'px' );
					} else {
						$( '#db-entries p' ).css( 'min-height', window.innerHeight - ( G.bars ? 130 : 90 ) +'px' );
					}
				}
			}, 300 );
		}
	} else {
		if ( G.playlist && !G.pleditor ) {
			setTimeout( function() {
				setNameWidth();
				getTitleWidth();
				setTitleWidth();
				$( '#pl-entries p' ).css( 'min-height', window.innerHeight - ( G.bars ? 277 : 237 ) +'px' );
				var scrollpos = $( '#pl-entries li.active' ).offset().top - $( '#pl-entries' ).offset().top - ( 49 * 3 );
				$( 'html, body' ).scrollTop( scrollpos );
			}, 600 );
		}
	}
} );

var pushstreams = {};
var streams = [ 'airplay', 'bookmark', 'display', 'idle', 'notify', 'playlist', 'volume', 'webradio' ];
streams.forEach( function( stream ) {
	pushstreams[ stream ] = new PushStream( {
		  modes                                 : 'websocket'
		, timeout                               : 5000
		, reconnectOnChannelUnavailableInterval : 5000
	} );
	pushstreams[ stream ].addChannel( stream );
	pushstreams[ stream ].connect();
} );
pushstreams.idle.onstatuschange = function( status ) {
	if ( status === 2 ) {
		G.playlist ? updatePlaylist() : getPlaybackStatus();
	} else {
		$( '#loader' ).removeClass( 'hide' );
		bannerHide();
	}
}
pushstreams.airplay.onmessage = function( data ) {
	var status = data[ 0 ];
	if ( 'stop' in status ) {
		G.status = {}
		if ( status.stop !== 'switchoutput' ) bannerHide();
		getPlaybackStatus();
	} else if ( 'start' in status ) {
		if ( !G.playback ) switchPage( 'playback' );
		getPlaybackStatus();
	} else {
		$.each( status, function( key, value ) {
			G.status[ key ] = value;
		} );
		renderAirPlay()
	}
}
pushstreams.bookmark.onmessage = function( data ) {
	var bookmarks = JSON.parse( data[ 0 ] );
	if ( G.bookmarkedit || !bookmarks.length ) return
		
	clearTimeout( G.debounce );
	G.debounce = setTimeout( function() {
		var nameimg = bookmarks[ 1 ];
		if ( nameimg.slice( 0, 11 ) === 'data:image/' ) {
			var htmlicon = '<img class="bkcoverart" src="'+ nameimg +'">';
		} else {
			var htmlicon = '<i class="fa fa-bookmark"></i><div class="divbklabel"><span class="bklabel label" style="">'+ nameimg +'</span></div>';
		}
		var html =   '<div class="divblock bookmark">'
					+'<div class="home-block home-bookmark">'
						+'<a class="lipath">'+ bookmarks[ 0 ] +'</a>'
						+ htmlicon
					+'</div>'
				+'</div>';
		$( '#divhomeblocks' ).append( html );
	}, G.debouncems );
}
pushstreams.display.onmessage = function( data ) {
	if ( G.local ) return
	
	var data = data[ 0 ];
	if ( typeof data !== 'object' ) return
	
	if ( 'order' in data ) {
		data = typeof data.order === 'object' ? data.order : JSON.parse( data.order );
		G.display.order = data;
		orderLibrary();
		return
	}
	
	displayItems( data );
	clearTimeout( G.debounce );
	G.debounce = setTimeout( function() {
		if ( G.playback ) {
			getPlaybackStatus();
		} else if ( G.library ) {
			if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) renderLibrary();
		} else {
			displayTopBottom();
		}
	}, G.debouncems );
}
pushstreams.idle.onmessage = function( data ) {
	var changed = data[ 0 ].changed;
	clearTimeout( G.debounce );
	G.debounce = setTimeout( function() {
		if ( changed === 'player' ) { // on track changed or fast forward / rewind
			if ( G.local ) return
			
			getPlaybackStatus();
		} else if ( changed === 'playlist' ) { // on playlist changed
			updatePlaylist();
		} else if ( changed === 'playlistplayer' ) { // on consume track
			if ( G.playback ) {
				getPlaybackStatus();
			} else if ( G.playlist ) {
				updatePlaylist();
			}
		} else if ( changed === 'options' || changed === 'mixer' ) { // on mode toggled || volume changed
			if ( G.local ) return
			
			$.post( 'commands.php', { getjson: '/srv/http/bash/status.sh statusonly' }, function( status ) {
				$.each( status, function( key, value ) {
					G.status[ key ] = value;
				} );
				if ( G.playback ) setButtonToggle();
				$( '#plconsume' ).toggleClass( 'bl', G.status.consume === 1 );
				$( '#pllibrandom' ).toggleClass( 'bl', G.status.librandom === 1 );
				$volumeRS.setValue( G.status.volume );
			}, 'json' );
		} else if ( changed === 'update' ) {
			if ( !G.local && !$( '#autoupdate' ).val() ) {
				clearTimeout( G.debounce );
				G.debounce = setTimeout( function() {
					$.post( 'commands.php', { getcount: 1 }, function( data ) {
						if ( 'updating_db' in data ) {
							G.status.updating_db = 1;
							setButtonUpdate();
						} else {
							G.status.updating_db = 0;
							setButtonUpdate();
							notify( 'Library Update', 'Done', 'library' );
							if ( data[ 2 ] ) $( '#li-count wh' ).text( numFormat( data[ 2 ] ) );
							$( '.home-block grl' ).remove();
							$.each( data, function( id, val ) {
								if ( val ) $( '#home-'+ id ).find( 'i' ).after( '<grl>'+ numFormat( val ) +'</grl>' );
							} );
						}
					}, 'json' );
				}, 2000 );
			}
		} else if ( changed === 'database' ) { // on files changed (for webradio rename)
			if ( $( '#db-currentpath .lipath' ).text() === 'Webradio' ) $( '#home-webradio' ).tap();
		}
	}, G.debouncems );
}
pushstreams.notify.onmessage = function( data ) {
	var data = data[ 0 ];
	if ( 'title' in data ) {
		notify( data.title, data.text, data.icon, data.delay );
		if ( data.title === 'AirPlay' && data.text === 'Stop ...' ) $( '#loader' ).removeClass( 'hide' );
	} else if ( 'volumenone' in data ) { // from mpd settings
		if ( data.volumenone ) {
			var existing = G.display.volumenone;
			G.display.volumenone = data.volumenone;
			if ( data.volumenone !== existing && G.playback ) displayPlayback();
		} else {
			delete G.display.volumenone;
			$.post( 'commands.php', { bash: "grep volume /var/lib/mpd/mpdstate | cut -d' ' -f2" }, function( data ) {
				G.status.volume = data[ 0 ];
				if ( G.playback ) {
					$volumeRS.setValue( G.status.volume );
					displayPlayback();
				}
			}, 'json' );
		}
	} else if ( 'reload' in data ) { // from refresh button in localbrowser settings
		if ( data.reload === 'all' ) {
			location.href = '/';
		} else if ( G.localhost ) {
			location.href = '/';
		}
	} else if ( 'package' in data ) { // from app menu (menuPackage)
		$( '#'+ data.package[ 0 ] )
			.data( { active: data.package[ 1 ], enabled: data.package[ 2 ] } )
			.find( 'img' ).toggleClass( 'on', data[ 1 ] === 1 );
	}
}
pushstreams.playlist.onmessage = function( data ) {
	var data = data[ 0 ];
	G.lsplaylists = data || [];
	if ( !G.playlist ) return
		
	if ( 'savedplaylist' in data ) {
		if ( !G.sortable ) renderSavedPlaylist( data.savedplaylist );
	} else if ( !$( '#pl-entries' ).hasClass( 'hide' ) || !G.lsplaylists.length ) {
		renderPlaylist();
	} else {
		$( '#plopen' ).click();
	}
}
pushstreams.volume.onmessage = function( data ) {
	var data = data[ 0 ];
	clearTimeout( G.debouncevol );
	G.debouncevol = setTimeout( function() {
		var vol = data[ 0 ];
		var volumemute = data[ 1 ];
		$volumeRS.setValue( vol );
		$volumehandle.rsRotate( - $volumeRS._handle1.angle );
		volumemute ? muteColor( volumemute ) : unmuteColor();
	}, G.debouncems );
}
pushstreams.webradio.onmessage = function( data ) {
	var data = data[ 0 ];
	var count = Number( $( '#home-webradio grl' ).text() );
	count = count + data;
	$( '#home-webradio grl' ).text( count ? numFormat( count ) : '' );
	if ( $( '#db-currentpath .lipath' ).text() === 'Webradio' ) $( '#home-webradio' ).click();
	if ( G.playlist && !G.pleditor ) $( '#tab-playlist' ).click();
}
