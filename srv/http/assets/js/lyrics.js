var currentlyrics = '';
var lyrics = '';
var lyricsArtist = '';
var lyricsSong = '';
var lyricshtml = '';

$( function() { //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

if ( !$( '#swipebar' ).length ) $( '#lyricsedit' ).removeClass().addClass( 'fa fa-edit');
$( '#song, #currentsong' ).click( function() {
	var playlistlength = G.status.playlistlength;
	if ( playlistlength == 0 ) return;
	
	var artist = G.status.Artist;
	var title = G.status.Title;
	var file = G.status.file;
	if ( artist === lyricsArtist && title === lyricsSong && lyrics ) {
		lyricsshow();
		return
	}
	if ( G.status.mpd && file.slice( 0, 4 ) === 'http' ) {
		var title = title.split( / - (.*)/ );
		info( {
			  icon       : 'info-circle'
			, title      : 'Lyrics'
			, width      : 500
			, message    : 'Query with Webradio data as:'
			, textlabel  : [ 'Artist', 'Title' ]
			, textvalue  : [ title[ 0 ], title[ 1 ] ]
			, textalign  : 'center'
			, boxwidth   : 'max'
			, ok         : function() {
				lyricsArtist = $( '#infoTextBox' ).val();
				lyricsSong = $( '#infoTextBox1' ).val();
				getlyrics();
			}
		} );
	} else {
		lyricsArtist = artist;
		lyricsSong = title;
		getlyrics();
	}
} );
// fix cursor placement issue caused by Pnotify
$( '#lyricstextarea' ).on( 'touchstart', function( e ) {
	e.stopPropagation();
} ).on( 'click', function() {
	$( '#lyricsback, #lyricsundo, #lyricssave' ).toggle();
} );
$( '#lyricsedit' ).click( function() {
	var lyricstop = $( '#lyricstext' ).scrollTop();
	if ( !currentlyrics ) currentlyrics = lyrics;
	$( '#lyricseditbtngroup' ).show();
	$( '#lyricstextareaoverlay' ).removeClass( 'hide' );
	$( '#lyricsedit, #lyricstextoverlay' ).hide();
	if ( lyrics !== '(Lyrics not available.)' ) {
		$( '#lyricstextarea' ).val( currentlyrics ).scrollTop( lyricstop );
	} else {
		$( '#lyricstextarea' ).val( '' );
	}
} );
$( '#lyricsclose' ).click( function() {
	if ( $( '#lyricstextareaoverlay' ).hasClass( 'hide' )
		|| $( '#lyricstextarea' ).val() === currentlyrics
		|| $( '#lyricstextarea' ).val() === ''
	) {
		lyricshide();
	} else {
		info( {
			  title    : 'Lyrics'
			, message  : 'Discard changes made to this lyrics?'
			, ok       : lyricshide
		} );
	}
} );
$( '#lyricsback' ).click( function() {
	$( '#lyricseditbtngroup' ).hide();
	$( '#lyricstextareaoverlay' ).addClass( 'hide' );
	$( '#lyricsedit, #lyricstextoverlay' ).show();
} );
$( '#lyricsundo' ).click( function() {
	$( '#lyricsback, #lyricsundo, #lyricssave' ).toggle();
	lyricstop = $( '#lyricstextarea' ).scrollTop();
	if ( $( '#lyricstextarea' ).val() === currentlyrics
		|| $( '#lyricstextarea' ).val() === ''
	) {
		lyricsrestore( lyricstop );
		return
	}
	info( {
		  title    : 'Lyrics'
		, message  : 'Discard changes made to this lyrics?'
		, ok       : lyricsrestore( lyricstop )
	} );
} );
$( '#lyricssave' ).click( function() {
	if ( $( '#lyricstextarea' ).val() === currentlyrics ) return;
	
	info( {
		  title    : 'Lyrics'
		, message  : 'Save this lyrics?'
		, ok       : function() {
			var newlyrics = $( '#lyricstextarea' ).val();
			$.post( 'lyricssave.php',
				{ artist: $( '#lyricsartist' ).text(), song: $( '#lyricssong' ).text(), lyrics: newlyrics },
				function( data ) {
					if ( data ) {
						lyricstop = $( '#lyricstextarea' ).scrollTop();
						currentlyrics = newlyrics;
						lyrics2html( newlyrics );
						if ( $( '#lyricssong' ).text() === G.status.Title ) {
							lyrics = newlyrics;
						}
						$( '#lyricstext, #lyric-text-overlay' ).html( lyricshtml );
						lyricsrestore( lyricstop );
					} else {
						info( {
							  icon    : 'info-circle'
							, title   : 'Lyrics'
							, message : 'Lyrics save failed.'
						} );
					}
				}
			);
		}
	} );
} );	
$( '#lyricsdelete' ).click( function() {
	info( {
		  title    : 'Lyrics'
		, message  : 'Delete this lyrics?'
		, ok       : function() {
			$.post( 'lyricssave.php',
				{ artist: $( '#lyricsartist' ).text(), song: $( '#lyricssong' ).text(), delete: 1 },
				function( data ) {
					if ( data ) {
						lyrics = '';
						currentlyrics = '(Lyrics not available.)';
						lyrics2html( currentlyrics )
						lyricshide();
						$( '#lyric-text-overlay' ).html( lyrics2html );
					}
					info( {
						  icon    : 'info-circle'
						, title   : 'Lyrics'
						, message : data ? 'Lyrics deleted successfully.' : 'Lyrics delete failed.'
					} );
				}
			);
		}
	} );
} );
$( '#menu-bottom' ).click( function() {
	if ( !$( '#lyricscontainer' ).hasClass( 'hide' ) ) lyricshide();
} );

} ); //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

htmlEscape = function( str ) {
	return str
		.trim()
		.replace( /'|"/g, '' );
}
getlyrics = function() {
	var artist = htmlEscape( lyricsArtist );
	var song = htmlEscape( lyricsSong );
	$.post( 'lyrics.php', { artist: artist, song: song }, function( data ) {
			lyrics = data ? data : '(Lyrics not available.)';
			lyrics2html( lyrics );
			lyricsshow();
		}
	);
	notify( 'Lyrics', 'Fetching ...', 'search blink', 20000 );
}
lyrics2html = function( data ) {
	lyricshtml = data.replace( /\n/g, '<br>' ) +'<br><br><br>·&emsp;·&emsp;·';
}
lyricsshow = function() {
	$( '#lyricssong' ).text( lyricsSong );
	$( '#lyricsartist' ).text( lyricsArtist );
	$( '#lyricstext, #lyric-text-overlay' ).html( lyricshtml );
	var bars = G.status ? G.bars : !$( '#menu-top' ).hasClass( 'hide' );
	$( '#lyricscontainer' )
		.css( {
			  top    : ( bars ? '' : 0 )
			, height : ( bars ? '' : '100vh' )
		} )
		.removeClass( 'hide' );
	$( '#lyricstext' ).scrollTop( 0 );
	if ( bars ) $( '#menu-bottom' ).addClass( 'lyrics-menu-bottom' );
	bannerHide();
}
lyricshide = function() {
	currentlyrics = '';
	lyrics2html( lyrics );
	$( '#lyricstextarea' ).val( '' );
	$( '#lyricsedit, #lyricstextoverlay' ).show();
	$( '#lyricseditbtngroup' ).hide();
	$( '#lyricscontainer, #lyricstextareaoverlay' ).addClass( 'hide' );
	if ( G.bars || !$( '#menu-top' ).hasClass( 'hide' ) ) $( '#menu-bottom' ).removeClass( 'lyrics-menu-bottom' );
}
lyricsrestore = function( lyricstop ) {
	$( '#lyricseditbtngroup' ).hide();
	$( '#lyricstextareaoverlay' ).addClass( 'hide' );
	$( '#lyricsedit, #lyricstextoverlay' ).show();
	$( '#lyricstext' ).scrollTop( lyricstop );
}
