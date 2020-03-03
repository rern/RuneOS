function addonsdl( exit ) {
	if ( exit == 1 ) {
		info( {
			  icon    : 'info-circle'
			, message : 'Download from Addons server failed.'
					   +'<br>Please try again later.'
			, ok      : function() {
				$( '#loader' ).addClass( 'hide' );
			}
		} );
	} else if ( exit == 2 ) {
		info( {
			  icon    : 'info-circle'
			, message : 'Addons Menu cannot be updated.'
					   +'<br>Root partition has <wh>less than 1 MB free space</wh>.'
			, ok      : function() {
				location.href = 'addons.php';
			}
		} );
	} else {
		location.href = 'addons.php';
	}
}
function clearIntervalAll() {
	clearInterval( G.intKnob );
	clearInterval( G.intElapsed );
	clearInterval( G.intElapsedPl );
}
function contextmenuLibrary( $li, $target ) {
	$( '.menu' ).addClass( 'hide' );
	var $menu = $( $li.find( '.db-icon' ).data( 'target' ) );
	G.list = {};
	G.list.li = $li; // for contextmenu
	if ( $li.hasClass( 'licover' ) && G.browsemode === 'coverart' ) {
		G.list.mode = 'album'
	} else {
		G.list.mode = $li.find( '.db-icon' ).prop( 'class' ).replace( /fa fa-| db-icon/g, '' );
	}
	var dbpl = G.library ? 'db' : 'pl';
	G.list.path = $li.find( '.lipath' ).text().trim() || '';
	G.list.name = $li.find( '.liname' ).text().trim() || '';
	G.list.artist = $li.find( '.liartist' ).text().trim() || '';
	G.list.liindex = $( '#'+ dbpl +'-entries li' ).index( $li ); // for webradio delete - in contextmenu
	G.list.isfile = $li.hasClass( 'file' );
	G.list.thumb = $li.find( '.lithumb' ).text() || '';
	G.list.img = $li.find( '.liimg' ).text() || '';
	var cuem3u = [ 'cue', 'm3u', 'm3u8', 'pls' ].indexOf( G.list.path.split( '.' ).pop() ) !== -1;
	G.list.track = $li.data( 'track' ) || '';  // cue - in contextmenu
	if ( ( 'tapaddplay' in G.display || 'tapreplaceplay' in G.display )
		&& !$target.hasClass( 'db-icon' )
		&& !$li.hasClass( 'licover' )
	) {
		var i = 'tapaddplay' in G.display ? 0 : 1;
		$menu.find( 'a:eq( '+ i +' ) .submenu' ).click();
		$li.addClass( 'active' );
		return
	}
	
	$( '.replace' ).toggleClass( 'hide', !G.status.playlistlength );
	$( '.folder-refresh' ).toggleClass( 'hide', G.status.updating_db !== 0 );
	$( '.tag' ).addClass( 'hide' );
	if ( !cuem3u || $li.hasClass( 'licover' ) ) {
		if ( G.list.isfile ) {
			$( '.tag' ).removeClass( 'hide' );
		} else if ( $( '.licover' ).length ) {
			if ( G.browsemode === 'file' || G.browsemode === 'coverart' ) $( '.tag' ).removeClass( 'hide' );
		}
	}
	var contextnum = $menu.find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 42 - 1 );
	$li.addClass( 'active' );
	if ( $li.hasClass( 'licover' ) ) {
		var menutop = G.bars ? '310px' : '270px';
	} else {
		var menutop = ( $li.position().top + 48 ) +'px';
	}
	$menu
		.css( 'top',  menutop )
		.removeClass( 'hide' );
	var targetB = $menu.offset().top + $menu.height();
	var wH = window.innerHeight;
	if ( targetB > wH - ( G.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
}
function contextmenuPlaylist( $li, $target ) { // saved playlists
	$( '.menu' ).addClass( 'hide' );
	var dbpl = $li.find( '.pl-icon' ).length ? '.pl' : '.db';
	var $menu = $( $li.find( dbpl +'-icon' ).data( 'target' ) );
	G.list = {};
	G.list.li = $li; // for contextmenu
	G.list.name = $li.find( '.liname' ).text().trim();
	G.list.path = $li.find( '.lipath' ).text().trim() || G.list.name;
	G.list.Track = $li.data( 'track' ) || '';
	G.list.isfile = $li.find( '.fa-music' ).length; // used in contextmenu
	$( '.plus-refresh, .play-plus-refresh' ).toggleClass( 'hide', !G.status.playlistlength );
	$( '.minus-circle' ).removeClass( 'hide' );
	$( '.tag' ).addClass( 'hide' );
	if ( 'tapaddplay' in G.display
		&& !$target.hasClass( 'pl-icon' )
	) {
		$menu.find( 'a:eq( 0 ) .submenu' ).click();
		return
	}
	
	$( '.replace' ).toggleClass( 'hide', !G.status.playlistlength );
	$( '.similar' ).toggleClass( 'hide', G.list.path.slice( 0, 4 ) === 'http' );
	var contextnum = $menu.find( 'a:not(.hide)' ).length;
	$( '.menushadow' ).css( 'height', contextnum * 42 - 1 );
	$( '#pl-editor li' ).removeClass( 'active' );
	$li.addClass( 'active' );
	$menu
		.removeClass( 'hide' )
		.css( 'top', ( $li.position().top + 48 ) +'px' );
	var targetB = $menu.offset().top + $menu.height();
	var wH = window.innerHeight;
	if ( targetB > wH - ( G.bars ? 80 : 40 ) + $( window ).scrollTop() ) $( 'html, body' ).animate( { scrollTop: targetB - wH + 42 } );
}
function cssKeyframes( name, trx0, trx100 ) {
	var moz = '-moz-'+ trx0;
	var moz100 = '-moz-'+ trx100;
	var webkit = '-webkit-'+ trx0;
	var webkit100 = '-webkit-'+ trx100;
	$( 'head' ).append(
		 '<style id="'+ name +'">'
			+'@-moz-keyframes '+    name +' { 0% { '+ moz +' }    100% { '+ moz100 +' } }'
			+'@-webkit-keyframes '+ name +' { 0% { '+ webkit +' } 100% { '+ webkit100 +' } }'
			+'@keyframes '+         name +' { 0% { '+ trx0 +'}    100% { '+ trx100 +'} }'
		+'</style>'
	);
}
function data2html( list, path ) { // set path, name, artist as text to avoid double quote escape
	var dataindex = 'index' in list ? 'data-index="'+ list.index +'"' : '';
	var content = '';
	if ( G.browsemode === 'file' || G.browsemode === 'coverart' ) {
		if ( path === '' && 'file' in list ) {
			var file = list.file
			path = file.split( '/' ).pop();
		}
		if ( 'file' in list || path === 'Webradio' ) {
			if ( path !== 'Webradio' ) {
				if ( 'Title' in list ) {
					var filename = list.file.split( '/' ).pop();
					var li2 = $( '#db-search-keyword' ).val() ? list.Artist +' - '+ list.Album : filename;
					if ( filename.slice( -3 ) === 'cue' ) {
						li2 = list.track +' - '+ filename +'-'+ list.ext;
						dataindex = 'data-track="'+ list.track +'"';
					}
					var liname = list.Title
					content = '<li class="file" '+ dataindex +'>'
							 +'<a class="lipath">'+ list.file +'</a>'
							 +'<a class="liartist">'+ list.Artist +'</a>'
							 +'<a class="liname">'+ liname +'</a>'
							 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
							 +'<span class="li1"><a class="name">'+ liname +'</a><span class="time">'+ list.Time +'</span></span>'
							 +'<span class="li2">'+ li2 +'</span>';
				} else {
					var liname = list.file.split( '/' ).pop(); // filename
					content = '<li class="file" '+ dataindex +'>'
							 +'<a class="lipath">'+ list.file +'</a><a class="liname">'+ liname +'</a>'
							 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
							 +'<span class="li1">'+ liname +'<span class="time">' + second2HMS( list.Time ) +'</span></span>'
							 +'<span class="li2">'+ path +'</span>';
				}
			} else { // Webradio
				var liname = list.webradio
				var thumb = list.thumb;
				if ( thumb ) {
					var iconhtml = '<img class="radiothumb db-icon" data-src="'+ thumb +'" onerror="imgError(this);" data-target="#context-menu-webradio">';
				} else {
					var iconhtml = '<i class="fa fa-webradio db-icon" data-target="#context-menu-webradio"></i>';
				}
				content = '<li class="db-webradio file" '+ dataindex +'>'
						 +'<a class="lipath">'+ list.url +'</a>'
						 +'<a class="liname">'+ liname +'</a>'
						 + iconhtml
						 +'<span class="li1">'+ liname +'</span>'
						 +'<span class="li2">'+ list.url +'</span>';
			}
		} else {
			var liname = list.directory.replace( path +'/', '' );
			content = '<li '+ dataindex +'>'
					 +'<a class="lipath">'+ list.directory +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<i class="fa fa-folder db-icon" data-target="#context-menu-folder"></i>'
					 +'<span class="single">'+ liname +'</span>';
		}
	} else if ( G.browsemode === 'album' ) {
		if ( 'file' in list ) {
			var liname = list.Title;
			content = '<li class="file" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.file +'</a>'
					 +'<a class="liartist">'+ list.Artist +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
					 +'<span class="li1"><a class="name">'+ liname +'</a><span class="time">'+ list.Time +'</span></span>'
					 +'<span class="li2">'+ list.file.split( '/' ).pop() +'</span>';
			var artist = list.Artist;
			if ( !G.albumartist ) G.albumartist = list.Album +'<gr> • </gr>'+ artist;
		} else {
			var liname = list.album;
			var artistalbum = list.artistalbum;
			if ( artistalbum ) {
				var lialbum = artistalbum;
				var dataartist = '<a class="liartist">'+ list.artist +'</a>';
			} else {
				var lialbum = liname;
				var dataartist = '';
			}
			content = '<li mode="album" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.album +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 + dataartist
					 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
					 +'<span class="single">'+ lialbum +'</span>';
		}
	} else if ( G.browsemode === 'artist' || G.browsemode === 'composeralbum' ) {
		if ( 'album' in list ) {
			var liname = list.album;
			content = '<li mode="album" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.album +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
					 +'<span class="single">'+ liname +'</span>';
		} else {
			var liname = list.artist;
			content = '<li mode="artist" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.artist +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<i class="fa fa-artist db-icon" data-target="#context-menu-artist"></i>'
					 +'<span class="single">'+ liname +'</span>';
		}
	} else if ( G.browsemode === 'albumartist' ) {
		if ( 'album' in list ) {
			var liname = list.album;
			content = '<li mode="album" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.album +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
					 +'<span class="single">'+ liname +'</span>';
		} else {
			var liname = list.albumartist;
			content = '<li mode="albumartist" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.albumartist +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<i class="fa fa-albumartist db-icon" data-target="#context-menu-artist"></i>'
					 +'<span class="single">'+ liname +'</span>';
		}
	} else if ( G.browsemode === 'composer' ) {
		var liname = list.composer;
		content = '<li mode="composer" '+ dataindex +'>'
				 +'<a class="lipath">'+ list.composer +'</a>'
				 +'<a class="liname">'+ liname +'</a>'
				 +'<i class="fa fa-composer db-icon" data-target="#context-menu-composer"></i>'
				 +'<span class="single">'+ list.composer +'</span>';
	} else if ( G.browsemode === 'genre' ) {
		if ( 'album' in list ) {
			var liname = list.artistalbum;
			content = '<li mode="album" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.album +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<a class="liartist">'+ list.artist +'</a>'
					 +'<i class="fa fa-album db-icon" data-target="#context-menu-album"></i>'
					 +'<span class="single">'+ liname +'</span>';
		} else if ( 'file' in list ) {
			var liname = list.Title;
			content = '<li class="file" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.file +'</a>'
					 +'<a class="liartist">'+ list.Artist +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<i class="fa fa-music db-icon" data-target="#context-menu-file"></i>'
					 +'<span class="li1"><a class="name">'+ liname +'</a><span class="time">'+ list.Time +'</span></span>'
					 +'<span class="li2">'+ list.Artist +' - '+ list.Album +'</span>';
		} else {
			var liname = list.genre ;
			content = '<li mode="genre" '+ dataindex +'>'
					 +'<a class="lipath">'+ list.genre +'</a>'
					 +'<a class="liname">'+ liname +'</a>'
					 +'<i class="fa fa-genre db-icon" data-target="#context-menu-genre"></i>'
					 +'<span class="single">'+ liname;+'</span>';
		}
	}
	return content +'</li>';
}
function dataParse( data, path ) {
	if ( !data.length ) return
	
	var content = '';
	var path = path || '';
	var currentpath = '';
	G.currentpath = path;
	G.albumartist = '';
	var coverart = 0;
	$( '#db-index li' ).not( ':eq( 0 )' ).addClass( 'gr' );
	if ( data[ 0 ].directory || data[ 0 ].file || data[ 0 ].playlist ) {
		var arraydir = [];
		var arrayfile = [];
		var arraypl = [];
		var litime = 0;
		var album, albumartist, artist, composer, genre;
		var type = {
			  Album        : 'album'
			, Artist       : 'artist'
			, AlbumArtist  : 'albumartist'
			, Composer     : 'composer'
			, Genre        : 'genre'
			, Webradio     : 'playlist'
		}
		var mode = {
			  file          : 'file'
			, album         : 'file'
			, artist        : 'album'
			, albumartist   : 'album'
			, genre         : 'album'
			, composer      : 'file'
			, composeralbum : 'album'
		}
		var prop = type[ path ] || 'directory'; // undefined type are directory names
		if ( data[ 0 ].artistalbum ) prop = 'artistalbum'; // for common albums like 'Greatest Hits'
		
		$.each( data, function( i, value ) {
			album = albumartist = artist = composer = genre = '';
			if ( 'directory' in value ) {
				arraydir.push( value );
			} else if ( 'file' in value ) {
				arrayfile.push( value );
				litime += HMS2Second( value.Time );
			} else if ( 'playlist' in value ) {
				arraypl.push( value );
			} else if ( 'coverart' in value && !arraydir.length ) {
				coverart = 1;
				var browsemode = G.dbbackdata.length ? G.dbbackdata[ 0 ].browsemode : '';
				var artistmode = [ 'artist', 'composer', 'genre' ].indexOf( browsemode ) !== -1 ? 1 : 0;
				var data0 = data[ 0 ];
				var file0 = data0.file || data0.filepl;
				var dir = file0.substring( 0, file0.lastIndexOf( '/' ) );
				var lipath = file0.slice( -3 ) === 'cue' ? file0 : dir;
				content += '<li class="licover">'
						  +'<a class="lipath">'+ lipath +'</a><a class="liname">'+ path +'</a>'
						  +'<div class="licoverimg"><img src="'+ ( value.coverart || coverrune ) +'" class="coversmall"></div>'
						  +'<span class="liinfo">'
							  +'<a class="lialbum">'+ data0.Album +'</a><br>'
							  +'<i class="fa fa-'+ ( artistmode ? 'artist' : 'albumartist' ) +'"></i><span class="liartist">'+ ( data0.AlbumArtist || data0.Artist ) +'</span><br>';
				if ( composer ) content += '<span class="licomposer"><i class="fa fa-composer"></i>'+ composer +'</span><br>';
				if ( genre ) content += '<span class="ligenre"><i class="fa fa-genre"></i>'+ genre +'</span><br>';
				if ( G.browsemode !== 'file' ) content += '<i class="fa fa-folder"></i><gr>'+ dir +'</gr><br>';
				content += '<i class="fa fa-music db-icon" data-target="#context-menu-folder"></i>'+ arrayfile.length +'<gr> • </gr>'+ second2HMS( litime );
				if ( [ 'cue', 'm3u', 'm3u8', 'pls' ].indexOf( data[ 0 ].file.split( '.' ).pop() ) !== -1 ) content += '&emsp;<i class="fa fa-list-ul"></i>';
				content += '</li>';
			} else if ( 'album' in value ) {
				album = value.album;
			} else if ( 'albumartist' in value ) {
				albumartist = value.albumartist;
			} else if ( 'artist' in value ) {
				artist = value.artist;
			} else if ( 'composer' in value ) {
				composer = value.composer;
			} else if ( 'genre' in value ) {
				genre = value.genre;
			} else if ( 'webradio' in value ) {
				content += data2html( value, path );
			} else if ( 'indexes' in value ) {
				value.indexes.forEach( function( char ) {
					$( '#db-index .index-'+ char ).removeClass( 'gr' );
				} );
			}
		} );
		var arraydirL = arraydir.length;
		if ( arraydirL ) {
			for ( i = 0; i < arraydirL; i++ ) content += data2html( arraydir[ i ], path );
		}
		var arrayplL = arraypl.length;
		if ( arrayplL ) {
			if ( arraypl[ 0 ].playlist.split( '.' ).pop() === 'pls' ) {
				for ( i = 0; i < arrayplL; i++ ) content += data2html( arraypl[ i ], path );
			}
		}
		var arrayfileL = arrayfile.length;
		if ( arrayfileL ) for ( i = 0; i < arrayfileL; i++ ) content += data2html( arrayfile[ i ], path );
	} else {
		if ( data[ 0 ][ prop ] === 'undefined' ) prop = mode[ G.browsemode ];
		$.each( data, function( i, value ) {
			if ( 'indexes' in value ) {
				value.indexes.forEach( function( char ) {
					$( '#db-index .index-'+ char ).removeClass( 'gr' );
				} );
			} else {
				content += data2html( data[ i ], path );
			}
		} );
	}
	$( '#db-webradio-new' ).toggleClass( 'hide', path !== 'Webradio' );
	$( '#db-back' ).removeClass( 'hide' );
	// breadcrumb directory path link
	var iconName = {
		  LocalStorage  : 'microsd'
		, USB           : 'usbdrive'
		, NAS           : 'network'
		, album         : [ 'album',       'ALBUM' ]
		, artist        : [ 'artist',      'ARTIST' ]
		, albumartist   : [ 'albumartist', 'ALBUM ARTIST' ]
		, coverart      : [ 'coverart',    'COVERART' ]
		, genre         : [ 'genre',       'GENRE' ]
		, composer      : [ 'composer',    'COMPOSER' ]
		, composeralbum : [ 'composer',    'COMPOSER' ]
	}
	var mode = {
		  album         : 'Album'
		, artist        : 'Artist'
		, albumartist   : 'AlbumArtist'
		, genre         : 'Genre'
		, composer      : 'Composer'
		, composeralbum : 'Composer'
		, coverart      : 'coverart'
	}
	if ( G.browsemode !== 'file' ) {
		if ( G.browsemode === 'album' || G.browsemode === 'composeralbum' ) {
			var albumpath = path === 'Album' ? '' : path;
			var albumtext = G.albumartist ? G.albumartist : albumpath;
		}
		$( '#db-currentpath .lipath' ).text( path ); // for back navigation
		$( '#db-currentpath' ).addClass( 'noellipse' );
		var pathhtml = '<i class="fa fa-'+ iconName[ G.dbbrowsemode ][ 0 ] +'"></i> <a id="rootpath" data-path="'+ mode[ G.browsemode ] +'">'+ iconName[ G.dbbrowsemode ][ 1 ];
		if ( [ 'Artist', 'Album', 'AlbumArtist', 'Composer', 'Genre' ].indexOf( G.currentpath ) === -1 ) {
			pathhtml += '<gr>&ensp;·&ensp;</gr><wh>'
						  + ( coverart ? G.dbbackdata[ G.dbbackdata.length - 2 ].path : G.currentpath )
						  +'</wh></a>';
		}
		$( '#db-currentpath span' ).html( pathhtml );
		$( '#artistalbum' ).toggleClass( 'hide', coverart );
	} else {
		var folder = path.split( '/' );
		var folderRoot = folder[ 0 ];
		if ( G.dbbrowsemode === 'coverart' ) {
			$( '#db-currentpath span' ).html( '<i class="fa fa-coverart"></i> <a id="rootpath" data-path="coverart">COVERART</a>' );
		} else if ( $( '#db-search-keyword' ).val() ) {
		// search results
			$( '#db-currentpath' ).css( 'max-width', '40px' );
			$( '#db-back, #db-index' ).addClass( 'hide' );
			$( '#db-entries' ).css( 'width', '100%' );
			$( '#db-search-close' ).html( '<i class="fa fa-times"></i> <span>' + arrayfileL + ' <grl>of</grl></span>&ensp;' );
		} else if ( folderRoot === 'Webradio' ) {
			$( '#db-currentpath .lipath' ).text( 'Webradio' );
			$( '#db-currentpath span' ).html( '<i class="fa fa-webradio"></i> <a>WEBRADIOS</a>' );
		} else {
			var folderCrumb = '<i class="fa fa-'+ iconName[ folderRoot ] +'"></i>';
			var folderPath = '';
			var ext = '';
			var ilength = folder.length;
			for ( i = 0; i < ilength; i++ ) {
				ext = folder[ i ].split( '.' ).pop();
				if ( [ 'cue', 'm3u', 'm3u8' ].indexOf( ext ) !== -1 ) continue
				
				folderPath += ( i > 0 ? '/' : '' ) + folder[ i ];
				folderCrumb += ' <a>'+ ( i > 0 ? '<w> / </w>' : '' ) + folder[ i ] +'<span class="lipath">'+ folderPath +'</span></a>';
			}
			$( '#db-currentpath .lipath' ).text( path );
			$( '#db-currentpath' ).find( 'span' ).html( folderCrumb );
		}
	}
	$( '#db-entries' ).html( content +'<p></p>' ).promise().done( function() {
		// fill bottom of list to mave last li movable to top
		$( '#home-blocks' ).addClass( 'hide' );
		$( '#db-list' ).css( 'padding-top', G.bars ? '80px' : '' );
		$( '#db-entries p' ).css( 'min-height', window.innerHeight - ( G.bars ? 130 : 90 ) +'px' );
		$( '#loader, .menu, #divcoverarts' ).addClass( 'hide' );
		$( 'html, body' ).scrollTop( 0 );
		if ( $( '.radiothumb' ).length && ( $( '#db-currentpath .lipath' ).text() === 'Webradio' ) ) new LazyLoad( { elements_selector: '.radiothumb' } );
		// hide index bar in directories with files only
		var lieq = $( '#db-entries .licover' ).length ? 1 : 0;
		if ( $( '#db-entries li:eq( '+ lieq +' ) i.db-icon' ).hasClass( 'fa-music' ) ) {
			$( '#db-index' ).addClass( 'hide' );
			$( '#db-entries' ).css( 'width', '100%' );
		} else {
			displayIndexBar();
			$( '#db-entries' ).css( 'width', '' );
		}
	} );
}
function disableCheckbox( name, enable, check ) {
	$( 'input[name="'+ name +'"]' )
		.prop( 'disabled', ( enable ? false : true ) )
		.prop( 'checked', ( check ? true : false ) )
		.parent().toggleClass( 'gr', enable === 1 );
}
function displayCheckbox( checkboxes ) {
	var html = '';
	var col,br;
	$.each( checkboxes, function( key, val ) {
		if ( val[ 0 ] === '_' ) {
			col = ' class="infocol"';
			br = '';
			val = val.slice( 1 );
		} else if ( val === '<hr>' ) {
			html += '<hr>';
			return
		} else {
			col = '';
			br = '<br>';
		}
		html += '<label'+ col +'><input name="'+ key +'" type="checkbox" '+ ( key in G.display ? 'checked' : '' ) +'>&ensp;'+ val +'</label>'+ br;
	} );
	return html;
}
function displayIndexBar() {
	setTimeout( function() {
		var wH = window.innerHeight;
		var indexoffset = G.bars ? 160 : 80;
		var indexline = wH < 500 ? 13 : 27;
		$( '.half' ).toggleClass( 'hide', wH < 500 );
		var $index = G.library ? $( '#db-index' ) : $( '#pl-index' );
		$index.css( 'line-height', ( ( wH - indexoffset ) / indexline ) +'px' );
		$( '#db-index' ).removeClass( 'hide' );
	}, 50 );
}
function displayItems( checked ) {
	var itemlibrary = [ 'album','albumartist','artist','backonleft', 'composer','count','coverart','genre','label','nas','playbackswitch','plclear','sd','tapaddplay','tapreplaceplay','thumbbyartist','usb','webradio' ];
	var itemplayback = [ 'bars','barsauto','buttons','cover','coverlarge','radioelapsed','time','volume' ]
	var page = checked.shift();
	var items = page === 'library' ? itemlibrary : itemplayback;
	items.forEach( function( el ) {
		if ( checked.indexOf( el ) !== -1 ) {
			G.display[ el ] = 1;
		} else {
			delete G.display[ el ];
		}
	} );
}
function displayPlayback() {
	displayTopBottom();
	$( '#time-knob, #play-group' ).toggleClass( 'hide', !( 'time' in G.display ) );
	$( '#coverart, #share-group' ).toggleClass( 'hide', !( 'cover' in G.display ) );
	var volume = ( !( 'volumenone' in G.display ) && 'volume' in G.display ) ? 1 : 0;
	$( '#volume-knob, #vol-group' ).toggleClass( 'hide', !volume );
	if ( volume ) $( '#volume' ).roundSlider( G.status.mpd ? 'enable' : 'disable' );

	var column = ( 'time' in G.display ? 1 : 0 ) + ( 'cover' in G.display ? 1 : 0 ) + volume;
	var $elements = $( '#time-knob, #coverart, #volume-knob, #play-group, #share-group, #vol-group' );
	if ( column === 2 && window.innerWidth > 499 ) {
		$( '#playback-row' ).css( 'max-width', '900px' );
		$elements.css( 'width', '45%' );
	} else if ( column === 1 ) {
		$( '#playback-row' ).css( 'max-width', '' );
		$elements.css( 'width', '90%' );
	} else {
		$elements.css( 'width', '' );
	}
	if ( !( 'buttons' in G.display ) ) {
		$( '#play-group, #share-group, #vol-group' ).addClass( 'hide' );
		if ( 'time' in G.display ) {
			if ( G.status.mpd ) {
				$( '#iplayer' )
					.removeAttr( 'class' )
					.addClass( 'hide' );
			}
		}
	} else {
		$( '#play-group, #vol-group' ).css( 'visibility', G.status.mpd ? 'visible' : 'hidden' );
	}
	// no scaling for webradio vu meter
	if ( !$( '#cover-art' ).hasClass( 'vu' )
		&& ( 'coverlarge' in G.display || ( !( 'time' in G.display ) && !( 'volume' in G.display ) ) )
	) {
		$( '#divcover, #cover-art, #coverartoverlay, #controls-cover' ).removeClass( 'coversmall' );
		var maxW = G.bars ? '45vh' : '55vh';
		$( '#divcover, #cover-art' ).css( {
			  width        : ''
			, height       : ''
			, 'max-width'  : maxW
			, 'max-height' : maxW
		} );
		if ( wW < 500 ) $( '#format-bitrate' ).css( 'display', 'time' in G.display ? 'inline' : 'block' );
		if ( !( 'time' in G.display ) && !( 'volume' in G.display ) ) $( '#share-group' ).addClass( 'hide' );
	} else {
		$( '#divcover, #cover-art, #coverartoverlay, #controls-cover' ).addClass( 'coversmall' );
		$( '#divcover, #cover-art' ).css( {
			  width        : '100%'
			, height       : '100%'
			, 'max-width'  : ''
			, 'max-height' : ''
		} );
	}
	if ( 'time' in G.display ) {
		$( '#divpos' ).css( 'font-size', '' );
		$( '#timepos' ).empty();
		$( '#time' ).roundSlider( G.status.ext === 'radio' || !G.status.mpd ? 'disable' : 'enable' );
	} else {
		$( '#divpos' ).css( 'font-size', '20px' );
		$( '#format-bitrate' ).css( 'display', 'block' );
	}
	var wW = window.innerWidth;
	var wH = window.innerHeight;
	if ( $( '.playback-block.hide' ).length && wH > 420 ) return
	
	if ( ( wW < 750 && wW  > wH ) || wH < 475 ) {
		G.scale = wH > 475 ? wW / 800 : wH / 450;
		var padding = G.bars ? '70px' : '40px';
		$( '#page-playback' ).css( {
			  transform          : 'scale( '+ G.scale +' )'
			, 'transform-origin' : 'top'
			, height             : 'calc( 100vh + '+ padding +' )'
			, 'padding-top'      : ''
		} );
		var width = Math.round( 100 / G.scale ) +'%';
		$( '#info, #playback-row' ).css( {
			  width         : width
			, 'margin-left' : ( 100 / G.scale - 100 ) / -2 +'%'
		} );
	} else {
		G.scale = 1;
		var compact = G.bars || !G.screenS;
		$( '#page-playback, #info, #playback-row' ).removeAttr( 'style' );
		$( '#page-playback' ).css( 'padding-top', compact ? '' : '40px' );
		$( '#playback-row' ).css( 'margin-top', compact ? '' : '20px' )
		$( '#csskeyframesS' ).remove();
	}
}
function displayTopBottom() {
	if ( !$( '#bio' ).hasClass( 'hide' ) ) return
	
	if ( !( 'bars' in G.display ) || ( G.screenS && !( 'barsauto' in G.display ) ) ) {
		G.bars = 0;
		$( '#menu-top, #menu-bottom' ).addClass( 'hide' );
		$( '#db-list, #pl-list' ).css( 'padding-top', '' );
		$( '.btnlist-top' ).css( 'top', 0 );
		$( '#home-blocks' ).css( 'padding-top', '50px' );
		$( '.emptyadd' ).css( 'top', '90px' );
	} else {
		G.bars = 1;
		$( '#menu-top, #menu-bottom' ).removeClass( 'hide' );
		$( '#db-list, #pl-list' ).css( 'padding-top', '80px' );
		$( '.btnlist-top' ).css( 'top', '40px' );
		$( '#home-blocks' ).css( 'padding-top', '' );
		$( '.emptyadd' ).css( 'top', '' );
		if ( G.status.mpd ) {
			$( '#menu-bottom a' ).css( 'width', '' );
			$( '#tab-playback a' ).html( '<i class="fa fa-play-circle"></i>' );
		} else {
			$( '#menu-bottom a' ).css( 'width', 0 );
			$( '#tab-playback a' )
				.css( 'width', '100%' )
				.html( '<i class="fa fa-airplay"></i>' );
		}
	}
	var menuH = ( $( '#settings a' ).length - $( '#settings a.hide' ).length ) * 42 - 2;
	$( '#settings .menushadow' ).css( 'height', menuH +'px' );
	$( '.menu' ).addClass( 'hide' );
	if ( G.library && !$( '#home-blocks' ).hasClass( 'hide' ) ) $( '#db-list' ).css( 'padding-top', G.bars ? '' : 0 );
}
function flag( iso ) { // from: https://stackoverflow.com/a/11119265
	var iso0 = ( iso.toLowerCase().charCodeAt( 0 ) - 97 ) * -15;
	var iso1 = ( iso.toLowerCase().charCodeAt( 1 ) - 97 ) * -20;
	return iso1 +'px '+ iso0 +'px';
}
function getBio( artist ) {
	$( '#loader' ).removeClass( 'hide' );
	$.post( 'http://ws.audioscrobbler.com/2.0/?autocorrect=1&format=json&method=artist.getinfo&api_key='+ G.apikeylastfm +'&artist='+ encodeURI( artist ), function( data ) {
		var data = data.artist;
		if ( !data.bio.content ) {
			info( {
				  icon    : 'bio'
				, title   : 'Bio'
				, message : 'No data available.'
			} );
			return
		}
		
		var content = data.bio.content.replace( /\n/g, '<br>' ).replace( /Read more on Last.fm.*/, '' );
		var genre = data.tags.tag[ 0 ].name;
		if ( genre ) genre = '<p class="genre"><i class="fa fa-genre fa-lg"></i>&ensp;'+ genre +'</p>';
		var similar =  data.similar.artist;
		if ( similar ) {
			similars = '<br><p><i class="fa fa-artist fa-lg"></i>&ensp;Similar Artists: <i class="fa fa-external-link gr"></i><p><span>';
			similar.forEach( function( artist ) {
				similars += '<a class="biosimilar">'+ artist.name +'</a>,&ensp;';
			} );
			similars = similars.slice( 0, -7 ) +'</span>';
		}
		var html = '<form class="form-horizontal">'
						+'<p class="artist">'+ artist +'</p>'
						+ genre
						+'<p>'+ content +'</p>'
						+'<div style="clear: both;"></div>'
						+ similars
						+'<br><br>'
						+'<p><span style="float: right;">Text: last.fm,&ensp;Image: fanart.tv</span></p>'
				  +'</form>';
		$( '#biocontent' ).html( html ).promise().done( function() {
			$( '#menu-top, #menu-bottom, #loader' ).addClass( 'hide' );
			$( '#bio' ).removeClass( 'hide' );
			$( '#bio' ).scrollTop( 0 );

			$.get( 'https://webservice.fanart.tv/v3/music/'+ data.mbid +'&?api_key='+ G.apikeyfanart, function( data ) {
				if ( 'artistthumb' in data ) $( '#biocontent form' ).prepend( '<img id="bioimg" src="'+ data.artistthumb[ 0 ].url +'">' );
			} );
		} );
	} );
}
function getData( options ) {
	$( '#loader' ).removeClass( 'hide' );
	var path = options.path ? options.path.toString().replace( /"/g, '\"' ) : '';
	var browsemode = options.browsemode || 'file';
	var keyword = 'keyword' in options ? options.keyword.toString().replace( /"/g, '\"' ) : '';
	var artist = options.artist ? options.artist.toString().replace( /"/g, '\"' ) : '';
	var currentpath = $( '#db-currentpath .lipath:last' ).text();
	var composer = $( '#rootpath' ).data( 'path' ) === 'Composer' ? $( '#artistalbum span' ).text() : '';
	currentpath = currentpath ? currentpath.toString().replace( /"/g, '\"' ) : '';
	if ( !G.dbback && G.dbbrowsemode !== 'file' ) {
		G.dbbackdata.push( {
			  path       : path
			, browsemode : browsemode
		} );
	} else if ( currentpath ) {
		if ( G.dbbackdata.length ) {
			G.dbbackdata.push( G.dbbackdata[ G.dbbackdata.length - 1 ] );
		} else {
			G.dbbackdata.push( {
				  path       : currentpath
				, browsemode : G.browsemode
			} );
		}
	} else {
		G.dbback = 0;
	}
	G.browsemode = browsemode;
	var format = '"%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%"';
	var command = {
		  file          : { mpc   : 'mpc ls -f '+ format +' "'+ path +'" 2> /dev/null', list: 'file' }
		, artistalbum   : { mpc   : 'mpc find -f '+ format + ( artist ? ' artist "'+ artist +'"' : '' ) +' album "'+ path +'"', list: 'file', name: path }
		, composeralbum : { mpc   : 'mpc find -f '+ format +' composer "'+ composer +'" album "'+ path +'"', list: 'file' }
		, album         : { mpcalbum : 'mpc find -f "%album%^^[%albumartist%|%artist%]" album "'+ path +'" | awk \'!a[$0]++\'', list: 'album', path: path }
		, genre         : { mpcalbum : 'mpc find -f "%album%^^%artist%" genre "'+ path +'" | awk \'!a[$0]++\'', list: 'genre', path: path }
		, artist        : { mpc   : 'mpc list album artist "'+ path +'" | awk NF', list: 'album' }
		, albumartist   : { mpc   : 'mpc list album albumartist "'+ path +'" | awk NF', list: 'album' }
		, composer      : { mpc   : 'mpc list album composer "'+ path +'" | awk NF', list: 'album' }
		, type          : { mpc   : 'mpc list '+ browsemode +' | awk NF', list: browsemode }
		, search        : { mpc   : 'mpc search -f '+ format +' any "'+ keyword +'"', list: 'file' }
		, Webradio      : { getwebradios  : 1 }
	}
	if ( [ 'Album', 'Artist', 'AlbumArtist', 'Composer', 'Genre' ].indexOf( path ) !== -1 ) {
		var mode = 'type';
	} else if ( path === 'Webradio' ) {
		var mode = 'Webradio';
	} else if ( // <li> in 'Album' and 'Genre'
		( browsemode === 'album' && currentpath !== 'Album' && artist )
		|| ( browsemode === 'genre' && currentpath !== 'Genre' && artist )
		|| browsemode === 'coverart'
	) {
		var mode = 'artistalbum';
	} else {
		if ( composer ) {
			var mode = 'composeralbum';
		} else {
			var mode = browsemode;
			if ( browsemode === 'composer' ) G.browsemode = 'composeralbum';
		}
	}
	$.post( 'commands.php', command[ mode ], function( data ) {
		if ( data ) {
			if ( mode === 'search' ) {
				var regex = new RegExp( keyword, 'ig' );
				$.each( data, function( i, v ) {
					[ 'Title', 'Album', 'Artist' ].forEach( function( key ) {
						if ( key in v ) data[ i ][ key ] = v[ key ].replace( regex, function( match ) {
					return '<bl>'+ match +'</bl>' } );
					} );
				} );
			}
			dataParse( data, path );
			G.keyword = keyword;
		} else {
			infoNoData();
			if ( mode === 'search' ) $( '#db-search-close' ).html( '<i class="fa fa-times"></i>&ensp;' );
		}
	}, 'json' );
}
function getOrientation( file, callback ) { // return: 1 - undefined
	var reader = new FileReader();
	reader.onload = function( e ) {
		var view = new DataView( e.target.result );
		if ( view.getUint16( 0, false ) != 0xFFD8 ) return callback( 1 ); // not jpeg
		
		var length = view.byteLength, offset = 2;
		while ( offset < length ) {
			if ( view.getUint16( offset + 2, false ) <= 8 ) return callback( 1 );
			
			var marker = view.getUint16( offset, false );
			offset += 2;
			if ( marker == 0xFFE1 ) {
				if ( view.getUint32( offset += 2, false ) != 0x45786966 ) return callback( 1 );
				
				var little = view.getUint16( offset += 6, false ) == 0x4949;
				offset += view.getUint32( offset + 4, little );
				var tags = view.getUint16( offset, little );
				offset += 2;
				for ( var i = 0; i < tags; i++ ) {
					if ( view.getUint16( offset + ( i * 12 ), little ) == 0x0112 ) {
						var ori = view.getUint16( offset + ( i * 12 ) + 8, little );
						return callback( ori );
					}
				}
			} else if ( ( marker & 0xFF00 ) != 0xFF00 ) {
				break;
			} else { 
				offset += view.getUint16( offset, false );
			}
		}
		return callback( 1 );
	};
	reader.readAsArrayBuffer( file.slice( 0, 64 * 1024 ) );
}
function getPlaybackStatus() {
	if ( G.status.mpd && G.status.librandom ) {
		$.post( 'commands.php', { getplaylist: 'playlist' }, function( data ) {
			G.pllist = data.playlist;
			if ( G.playlist && !G.pleditor ) renderPlaylist();
		}, 'json' );
	}
	
	$.post( 'commands.php', { getjson: '/srv/http/bash/status.sh' }, function( status ) {
		// 'gpio off' > audio output switched > restarts mpd which makes status briefly unavailable
//		if ( typeof status !== 'object' ) return
		$.each( status, function( key, value ) {
			G.status[ key ] = value;
		} );
		if ( !status.mpd ) {
			renderAirPlay();
			displayPlayback();
			setButton();
		} else {
			G.status.AlbumArtist = status.AlbumArtist || '';
			G.plreplace = 0;
			if ( G.playback ) {
				renderPlayback();
				setButton();
			} else if ( G.library && !( 'playbackswitch' in G.display ) ) {
				setButton();
			} else if ( G.playlist && !G.pleditor ) {
				setPlaylistScroll();
			}
			// imodedelay fix imode flashing on audio output switched
			if ( !G.imodedelay ) displayPlayback();
		}
		$( '#loader' ).addClass( 'hide' );
	}, 'json' );
}
function getTitleWidth() {
	plwW = $( window ).width();
	$title.css( {
		  'max-width' : 'none'
		, visibility  : 'hidden'
	} );
	pltW = $title.width();
	$title.removeAttr( 'style' );
}
function HMS2Second( HMS ) {
	var hhmmss = HMS.split( ':' ).reverse();
	if ( !hhmmss[ 1 ] ) return +hhmmss[ 0 ];
	if ( !hhmmss[ 2 ] ) return +hhmmss[ 0 ] + hhmmss[ 1 ] * 60;
	return +hhmmss[ 0 ] + hhmmss[ 1 ] * 60 + hhmmss[ 2 ] * 3600;
}
function imgError( image ) {
	image.onerror = '';
	image.src = coverrune;
	return true;
}
function infoCoverart( title, src, std ) {
	$( '.edit' ).remove();
	$( '#cover-art' ).css( 'opacity', '' );
	if ( std == 13 ) {
		info( {
			  icon    : 'coverart'
			, title   : '<i class="fa fa-warning fa-lg"></i>&ensp;'+ title +' Album Coverart'
			, message : 'Save file denied.'
					   +'<br>Set directory+file <w>permission</w> and try again.'
		} );
	} else if ( std == -1 ) {
		info( {
			  icon    : 'coverart'
			, title   : title +' Album Coverart'
			, message : '<i class="fa fa-warning fa-lg"></i>&ensp;Upload image failed.'
		} );
	} else {
		$( '.licoverimg' ).toggleClass( 'nocover', title === 'Remove' );
		if ( title === 'Save' ) {
			G.coversave = 0;
			notify( 'Album Coverart', 'Saved.', 'coverart' );
		} else {
			$( '#cover-art, .licoverimg img' )
				.prop( 'src', src )
				.css( 'opacity', '' );
		}
	}
}
function infoNoData() {
	$( '#loader' ).addClass( 'hide' );
	var keyword = $( '#db-search-keyword' ).val();
	info( {
		  icon      : 'info-circle'
		, message   : ( !keyword ? 'No data in this location.<br>Update for changes then try again.' : 'Nothing found for <wh>'+ keyword +'</wh>' )
		, autoclose : 8000
	} );
}
function loadCoverart( image ) {
	var img = new Image();
	img.crossOrigin = 'anonymous';
	img.src = image;
	img.onload = function() {
		var canvas = document.createElement( 'canvas' );
		canvas.width = this.width;
		canvas.height = this.height;
		canvas.getContext( '2d' ).drawImage( this, 0, 0 );
		$( '#cover-art' )
			.attr( 'src', canvas.toDataURL( 'image/jpeg' ) )
			.after( '<div class="licover-save"><i class="fa fa-save"></i></div>' );
		G.coversave = 1;
	}
}
function menuPackage( $this, $target ) {
	var id = $this.prop( 'id' );
	var title = id.charAt( 0 ).toUpperCase() + id.slice( 1 );
	var active = $this.data( 'active' );
	if ( $target.hasClass( 'submenu' ) ) {
		info( {
			  icon        : 'gear'
			, title       : title
			, checkbox    : { 'Enable on startup': 1 }
			, checked     : [ $this.data( 'enabled' ) ? 0 : 1 ]
			, buttonlabel : '<i class="fa fa-stop"></i>Stop'
			, buttoncolor : '#bb2828'
			, button      : function() {
				var checked = $( '#infoCheckBox input' ).prop( 'checked' ) ? 1 : 0;
				$.post( 'commands.php', { 
					  bash: [
						  'systemctl stop '+ id
						, 'systemctl '+ ( checked ? 'enable ' : 'disable ' ) + id
					]
					, pushstream : [ id, 0, checked ]
				} );
				$this
					.data( 'enabled', checked )
					.data( 'active', 0 )
					.find( 'img' ).removeClass( 'on' );
			}
			, ok          : function() {
				var checked = $( '#infoCheckBox input' ).prop( 'checked' ) ? 1 : 0;
				$.post( 'commands.php', { bash: [
					  'systemctl '+ ( checked ? 'enable ' : 'disable ' ) + id
					, 'curl -s -X POST "http://127.0.0.1/pub?id=notify" '
						+'-d \'{ "package": ["'+ id +'", ' +$this.data( 'active' ) +', '+ checked  +'] }\''
					
				] } );
				$this.data( 'enabled', checked );
			}
			, preshow     : function() {
				if ( !active ) $( '#infoButton' ).hide();
			}
		} );
	} else {
		$( '#settings' ).addClass( 'hide' );
		var url = {
			  aria2        : '/aria2/index.html'
			, transmission : 'http://'+ location.hostname +':9091'
		}
		$.post( 'commands.php', {
			  bash: 'systemctl start '+ id
			, pushstream : [ id, 1, $this.data( 'enabled' ) ]
		}, window.open( url[ id ] ) );
	}
}
function mpdSeek( seekto ) {
	var seektime = Math.round( seekto / 1000 * G.status.Time );
	G.status.elapsed = seektime;
	elapsed = seektime;
	position = seekto;
	$( '#time' ).roundSlider( 'setValue', seekto );
	$( '#elapsed' ).html( second2HMS( seektime ) );
	$( '#total' ).text( second2HMS( G.status.Time ) );
	if ( G.status.state === 'play' ) {
		clearIntervalAll();
		G.intElapsed = setInterval( function() {
			elapsed++;
			elapsedhms = second2HMS( elapsed );
			$( '#elapsed' ).text( elapsedhms );
		}, 1000 );
		G.intKnob = setInterval( function() {
			position++;
			$( '#time' ).roundSlider( 'setValue', position );
		}, G.status.Time );
		$.post( 'commands.php', { bash: 'mpc seek '+ seektime } );
	} else {
		if ( G.bars ) {
			$( '#playback-controls button' ).removeClass( 'active' );
			$( '#pause' ).addClass( 'active' );
			$( '#song' ).addClass( 'gr' );
		}
		$( '#elapsed' ).removeClass( 'gr' ).addClass( 'bl' );
		$.post( 'commands.php', { bash: [ 'mpc play', 'mpc seek '+ seektime, 'mpc pause' ] } );
	}
}
function muteColor( volumemute ) {
	$volumetooltip.text( volumemute ).addClass( 'bl' );
	$volumehandle.addClass( 'bgr' );
	$( '#volmute' ).addClass( 'active' )
		.find( 'i' ).removeClass( 'fa-volume' ).addClass( 'fa-mute' );
}
function numFormat( num ) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function orderLibrary() {
	if ( 'order' in G.display ) {
		$.each( G.display.order, function( i, name ) {
			var $divblock = $( '.divblock' ).filter( function() {
				return $( this ).find( '.lipath' ).text() === name;
			} );
			$divblock.detach();
			$( '#divhomeblocks' ).append( $divblock );
		} );
	}
}
function playlist2html( data ) {
	var content = '';
	var countradio = 0;
	var countsong = 0;
	var pltime = 0;
	var li2, sec;
	$.each( data, function( i, value ) {
		li2 = '';
		sec = 0;
		if ( value.file.slice( 0, 4 ) === 'http' ) {
			var name = 'Title' in value ? ( value.Title.toString().replace( '*', '' ) +' • ' ) : ''; // * dirble unsaved
			content += '<li>'
						  +'<i class="fa fa-webradio pl-icon" data-target="#context-menu-filesavedpl"></i>'
						  +'<a class="lipath">'+ value.file +'</a>'
						  +'<a class="liname">'+ name +'</a>'
						  + ( 'thumb' in value ? '<a class="lithumb">'+ value.thumb +'</a>' : '' )
						  + ( 'img' in value ? '<a class="liimg">'+ value.img +'</a>' : '' )
						  +'<span class="li1"><a class="name">'+ name +'</a><a class="song"></a><span class="duration"><a class="elapsed"></a></span></span>'
						  +'<span class="li2"><span class="nameli2 hide">'+ name +'</span>'+ value.file +'</span>'
					  +'</li>';
			countradio++;
		} else {
			sec = value.Time ? HMS2Second( value.Time ) : 0;
			pltime += sec;
			li2 = ( i + 1 ) +' • ';
			if ( value.Track ) li2 += value.Track +' - ';
			if ( value.Artist ) li2 +=  value.Artist +' - ';
			if ( value.Album ) li2 += value.Album;
			if ( !value.Artist && !value.Album ) li2 += value.file;
			var menu = G.pleditor ? '' : 'data-target="#context-menu-filesavedpl"';
			content += '<li class="file">'
						 + '<i class="fa fa-music pl-icon" '+ menu +'></i>'
						 +'<span class="li1"><a class="name">'+ value.Title +'</a>'
							 +'<span class="duration"><a class="elapsed"></a>'
							 +'<a class="time" time="'+ sec +'">'+ value.Time +'</a></span>'
						 +'</span>'
						 +'<span class="li2">'+ li2 +'</span>'
					 +'</li>';
			countsong++;
		}
	} );
	return {
		  content    : content
		, countradio : countradio
		, pltime     : pltime
		, countsong  : countsong
	}
}
function playlistInsert( indextarget ) {
	var plname = $( '#pl-currentpath .lipath' ).text();
	$.post( 'commands.php', {
			  savedplaylistedit : plname
			, index             : G.pladd.index
			, indextarget       : indextarget
	}, function() {
		renderSavedPlaylist( plname );
		if ( G.pladd.select === 'last' ) {
			setTimeout( function() {
				$( 'html, body' ).animate( { scrollTop: ( $( '#pl-editor li' ).length - 3 ) * 49 } );
			}, 300 );
		}
		G.pladd = {};
	} );
}
function playlistInsertSelect( $this ) {
	info( {
		  icon    : 'list-ul'
		, title   : 'Add to playlist'
		, message : 'Insert'
				   +'<br><w>'+ G.pladd.name +'</w>'
				   +'<br>before'
				   +'<br><w>'+ $this.find( '.name' ).text() +'</w>'
		, buttonlabel : 'Reselect'
		, button  : function() {
			playlistInsertTarget();
		}
		, cancel  : function() {
			G.plappend = {};
		}
		, ok      : function() {
			playlistInsert( $this.index() )
		}
	} );
}
function playlistInsertTarget() {
	info( {
		  icon    : 'list-ul'
		, title   : 'Add to playlist'
		, message : 'Select where to add:'
				   +'<br><w>'+ G.list.name +'</w>'
		, radio   : { First : 'first', Select: 'select', Last: 'last' }
		, cancel  : function() {
			G.pladd = {};
		}
		, ok      : function() {
			var target = $( '#infoRadio input:checked' ).val();
			G.pladd.select = target;
			if ( target !== 'select' ) {
				playlistInsert( target );
			}
		}
	} );
}
function playlistFilter() {
	var keyword = $( '#pl-filter' ).val();
	var regex = new RegExp( keyword, 'i' );
	var count = 0;
	$( '#pl-entries li' ).each( function() {
		var $this = $( this );
		var match = ( $this.text().search( regex ) !== -1 ) ? 1 : 0;
		count = match ? ( count + 1 ) : count;
		$this.toggleClass( 'hide', !match );
		if ( !$this.hasClass( 'hide' ) ) {
			var name = $this.find( '.name' ).text().replace( regex, function( match ) { return '<bl>'+ match +'</bl>' } );
			var li2 = $this.find( '.li2' ).text().replace( regex, function( match ) { return '<bl>'+ match +'</bl>' } );
			$this.find( '.name' ).html( name );
			$this.find( '.li2' ).html( li2 );
		}
	} );
	$( 'html, body' ).scrollTop( 0 );
	if ( keyword ) {
		$( '#pl-search-close' ).html( '<i class="fa fa-times"></i> <span>'+ count +' <grl>of</grl> </span>' );
	} else {
		$( '#pl-search-close' ).empty();
	}
}
function removeCoverart() {
	if ( G.playback ) {
		var src = $( '#cover-art' ).prop( 'src' );
		var path = G.status.file.substr( 0, G.status.file.lastIndexOf( '/' ) );
		var album = G.status.Album;
		var artist = G.status.AlbumArtist || G.status.Artist;
	} else {
		var src = $( '.licoverimg img' ).prop( 'src' );
		var path = $( '.licover .lipath' ).text();
		var album = $( '.licover .lialbum' ).text();
		var artist = $( '.licover .liartist' ).text();
	}
	$.post( 'commands.php', { bash: 'ls "/mnt/MPD/'+ path +'" | /usr/bin/grep -iE "^cover.jpg$|^cover.png$|^folder.jpg$|^folder.png$|^front.jpg$|^front.png$"' }, function( file ) {
		var fileL = file.length;
		var file = file[ 0 ];
		if ( fileL.length > 1 ) {
			info( {
				  icon    : 'coverart'
				, title   : 'Remove Album Coverart'
				, message : 'More than 1 coverart files found:'
						   +'<br><w>'+ file.replace( /\n/g, '<br>' ) +'</w>'
						   +'<br>No files removed.'
			} );
			return
		}
		
		info( {
			  icon    : 'coverart'
			, title   : 'Remove Album Coverart'
			, message : '<img src="'+ src +'">'
					   +'<br><w>'+ album +'</w>'
					   +'<br>'+ artist
					   +'<br><br><code>'+ file +'</code> > <code>'+ file +'.backup</code>'
			, oklabel : 'Remove'
			, ok      : function() {
				$.post( 'commands.php', { imagefile: '/mnt/MPD/'+ path +'/'+ file, coverfile: 1 }, function( std ) {
					infoCoverart( 'Remove', coverrune, std );
				} );
			}
		} );
	}, 'json' );
}
function removeFromPlaylist( $li ) {
	var $this = $li;
	var webradio = $this.find( '.fa-webradio' ).length;
	var $elcount = webradio ? $( '#countradio' ) : $( '#countsong' );
	var count = $elcount.attr( 'count' ) - 1;
	G.status.playlistlength--;
	$elcount.attr( 'count', count ).text( count );
	var time = +$( '#pltime' ).attr( 'time' ) - $this.find( '.time' ).attr( 'time' );
	if ( !webradio ) $( '#pltime' ).attr( 'time', time ).text( second2HMS( time ) );
	if ( count === 0 ) {
		$( '#pl-count' ).find( 'gr:contains(•)' ).remove();
		$elcount.next().remove();
		$elcount.remove();
		if ( $elcount[ 0 ].id === 'countradio' ) {
			$( '#pltime' ).css( 'color', '#e0e7ee' );
		} else {
			$( '#pltime' ).remove();
		}
	}
	if ( $this.hasClass( 'active' ) ) {
		if ( $this.index() + 1 < $this.siblings().length ) {
			$this.next().addClass( 'active' );
		} else {
			$( '#pl-entries li:eq( 0 )' ).addClass( 'active' );
			$( 'html, body' ).scrollTop( 0 );
			if ( G.bars ) {
				$( '#play, #pause' ).removeClass( 'active' );
				$( '#stop' ).addClass( 'active' );
			}
		}
	}
	$.post( 'commands.php', { bash: 'mpc del '+ ( $this.index() + 1 ) } );
	$this.remove();
	if ( G.bars ) $( '#previous, #next' ).toggleClass( 'hide', G.status.playlistlength === 1 );
	if ( !G.status.playlistlength ) {
		G.pllist = {};
		renderPlaylist();
		renderPlaybackBlank();
	}
}
function renderAirPlay() {
	G.status.ext = 'AirPlay';
	G.status.consume = 0;
	G.status.librandom = 0;
	G.status.playlistlength = 1;
	G.status.sampling = '16 bit 44.1 kHz 1.41 Mbit/s • AirPlay';
	G.status.state = 'play';
	G.status.volumemute = 0;
	renderPlayback();
}
function renderLibrary() {
	G.dbbackdata = [];
	$( '#db-currentpath' ).css( 'max-width', '' );
	$( '#db-currentpath>span, #db-currentpath>i, #db-searchbtn' ).removeClass( 'hide' );
	$( '#db-currentpath .lipath' ).empty()
	$( '#db-searchbtn' ).removeClass( 'hide' );
	$( '#db-back' ).css( 'right', '' );
	$( '#db-search, #db-index, #db-back, #db-webradio-new, #divcoverarts' ).addClass( 'hide' );
	$( '#db-search-close' ).empty();
	$( '#db-search-keyword' ).val( '' );
	$( '#db-entries' ).empty();
	if ( $( '#db-entries' ).hasClass( 'hide' ) ) return
	
	$( '#page-library .btnlist-top, db-entries' ).addClass( 'hide' );
	if ( 'count' in G.display ) {
		$( '#db-currentpath span' ).html( '<span class="title">LIBRARY<gr>·</gr></span><span id="li-count"><whl>'+ numFormat( $( '#home-blocks' ).data( 'count' ) ) +'</whl> <i class="fa fa-music"></i></span>' );
	} else {
		$( '#db-currentpath span' ).html( '<span class="title">LIBRARY</bl></span>' );
	}
	$( '#page-library .btnlist-top, #home-blocks' ).removeClass( 'hide' );
	$( '.home-block:not( .home-bookmark )' ).each( function() {
		var name = this.id.replace( 'home-', '' );
		$( this ).parent().toggleClass( 'hide', !( name in G.display ) );
	} );
	$( '.home-block grl' ).toggleClass( 'hide', !( 'count' in G.display ) );
	if ( 'label' in G.display ) {
		$( '#divhomeblocks a.label' ).show();
		$( '.home-block grl' ).css( 'color', '' );
		$( '.home-block' ).removeClass( 'nolabel' );
	} else {
		$( '#divhomeblocks a.label' ).hide();
		$( '.home-block grl' ).css( 'color', '#e0e7ee' );
		$( '.home-block:not( .home-bookmark )' ).addClass( 'nolabel' );
	}
	$( '#db-back' ).toggleClass( 'db-back-left', 'backonleft' in G.display );
	orderLibrary();
	displayTopBottom();
	$( 'html, body' ).scrollTop( 0 );
}
function renderLsPlaylists( lsplaylists ) {
	$( '.emptyadd' ).addClass( 'hide' );
	var content = '';
	$.each( lsplaylists, function( key, val ) {
		if ( 'indexes' in val ) {
			$( '#pl-index li' ).not( ':eq( 0 )' ).addClass( 'gr' );
			$.each( val.indexes, function( i, char ) {
				$( '#pl-index .index-'+ char ).removeClass( 'gr' );
			} );
		} else {
		content += '<li class="pl-folder" data-index="'+ val.index +'">'
						+'<i class="fa fa-list-ul pl-icon" data-target="#context-menu-playlist">'
						+'<a class="liname">'+ val.name +'</a></i>'
						+'<a class="lipath">'+ val.name +'</a></i>'
						+'<span class="plname">'+ val.name +'</span>'
				  +'</li>';
		}
	} );
	$( '#pl-back' ).css( 'float', 'backonleft' in G.display ? 'left' : '' );
	$( '#pl-editor' ).html( content +'<p></p>' ).promise().done( function() {
		G.pleditor = 1;
		// fill bottom of list to make last li movable to top
		$( '#pl-editor p' ).css( 'min-height', ( G.bars ? 40 : 0 ) +'px' );
		$( '#pl-editor' ).css( 'width', '' );
		$( '#loader' ).addClass( 'hide' );
		setTimeout( function() {
			$( 'html, body' ).scrollTop( G.plscrolltop );
		}, 300 );
		displayIndexBar();
	} );
}
function renderPlayback() {
	var status = G.status;
	// song and album before update for song/album change detection
	var previousartist = $( '#artist' ).text();
	var previoussong = $( '#song' ).text();
	var previousalbum = $( '#album' ).text();
	// volume
	$volumeRS.setValue( status.volume );
	$volumehandle.rsRotate( - $volumeRS._handle1.angle );
	if ( 'volume' in G.display && !( 'volumenone' in G.display ) ) {
		status.volumemute != 0 ? muteColor( status.volumemute ) : unmuteColor();
	}
	// empty queue
	if ( !status.playlistlength ) {
		renderPlaybackBlank();
		return
	}
	
	$( '.playback-controls' ).css( 'visibility', 'visible' );
	$( '#artist, #song, #album' ).css( 'width', '' );
	$( '#cover-art' ).removeClass( 'vu' );
	$( '#coverartoverlay, .emptyadd' ).addClass( 'hide' );
	if ( !G.coversave ) $( '.licover-save' ).remove();
	$( '#artist' ).html( status.Artist );
	$( '#song' ).html( status.Title );
	$( '#album' )
		.toggleClass( 'albumradio', status.ext === 'radio' )
		.html( status.Album ).promise().done( function() {
		scrollLongText();
	} );
	if ( status.mpd ) {
		$( '#songposition' ).html(  ( +status.song + 1 ) +'/'+ status.playlistlength );
	} else {
		$( '#songposition' ).html( '<i class="fa fa-airplay wh"></i>' );
	}
	$( '#format-bitrate' ).html( status.sampling )
	var elapsed = status.elapsed;
	clearIntervalAll();
	if ( status.ext === 'radio' ) {
		$( '#time' ).roundSlider( 'setValue', 0 );
		if ( status.state === 'play' ) {
			if ( !status.Title ) $( '#song' ).html( blinkdot );
			$( '#elapsed' ).html( status.state === 'play' ? blinkdot : '' );
			if ( G.display.time ) {
				$( '#timepos' ).empty();
				if ( 'radioelapsed' in G.display || G.localhost ) {
					G.intElapsed = setInterval( function() {
						elapsed++;
						elapsedhms = second2HMS( elapsed );
						$( '#total' ).text( elapsedhms ).addClass( 'gr' );
					}, 1000 );
				} else {
					$( '#total' ).empty();
				}
			} else {
				$( '#total' ).empty();
				if ( 'radioelapsed' in G.display ) {
					G.intElapsed = setInterval( function() {
						elapsed++;
						elapsedhms = second2HMS( elapsed );
					$( '#timepos' ).html( '&ensp;<i class="fa fa-play"></i>&ensp;'+ elapsedhms );
					}, 1000 );
				} else {
					$( '#timepos' ).empty();
				}
			}
		} else {
			$( '#song' ).html( '·&ensp;·&ensp;·' );
			$( '#elapsed, #total, #timepos' ).empty();
		}
		// webradio coverart
		if ( status.coverart ) {
			$( '#cover-art' )
				.attr( 'src', status.coverart )
				.css( 'border-radius', '' );
		} else {
			$( '#cover-art' )
				.attr( 'src', status.state === 'play' ? vu : vustop )
				.css( 'border-radius', '18px' )
				.addClass( 'vu' );
		}
		return
	}
	
	$( '#cover-art' ).css( 'border-radius', '' );
	if ( !G.status.mpd ) {
		if ( status.coverart ) $( '#cover-art' ).attr( 'src', status.coverart );
	} else if ( status.Artist !== previousartist || status.Album !== previousalbum ) {
		$( '.licover-save' ).remove();
		if ( status.coverart ) {
			G.coversave = 0;
			$( '#cover-art' ).attr( 'src', status.coverart );
		} else {
			$( '#cover-art' ).attr( 'src', coverrune );
			
			$.ajax( {
				  type     : 'post'
				, url      : 'http://ws.audioscrobbler.com/2.0/'
				, data     : { 
					  api_key     : G.apikeylastfm
					, autocorrect : 1
					, format      : 'json'
					, method      : 'album.getinfo'
					, artist      : status.Artist
					, album       : status.Album
				}
				, timeout  : 5000
				, dataType : 'json'
				, success  : function( data ) {
					if ( data.album.image ) {
						var image = data.album.image[ 3 ][ '#text' ];
						if ( data.album ) {
							loadCoverart( image );
						} else if ( data.album.mbid ) {
							$.post( 'https://coverartarchive.org/release/'+ data.album.mbid, function( data ) {
								var image = data.images[ 0 ][ 'image' ];
								if ( image ) loadCoverart( image );
							}, 'json' );
						}
					}
				}
			} );
		}
	}
	// time
	time = status.Time;
	var timehms = second2HMS( time );
	$( '#total' ).text( timehms );
	// stop <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	if ( status.state === 'stop' ) {
		$( '#song' ).removeClass( 'gr' );
		if ( 'time' in G.display ) {
			$( '#time' ).roundSlider( 'setValue', 0 );
			$( '#elapsed' ).text( timehms ).addClass( 'gr' );
			$( '#total, #timepos' ).empty();
		} else {
			$( '#timepos' ).html( '&ensp;<i class="fa fa-stop"></i>&ensp;'+ timehms );
		}
		return
	}
	
	$( '#elapsed, #total' ).removeClass( 'bl gr wh' );
	$( '#song' ).toggleClass( 'gr', status.state === 'pause' );
	var elapsedhms = second2HMS( elapsed );
	var position = Math.round( elapsed / time * 1000 );
	// pause <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
	if ( status.state === 'pause' ) {
		if ( 'time' in G.display ) {
			$( '#time' ).roundSlider( 'setValue', position );
			$( '#elapsed' ).text( elapsedhms ).addClass( 'bl' );
			$( '#total' ).addClass( 'wh' );
			$( '#timepos' ).empty();
		} else {
			$( '#timepos' ).html( '&ensp;<i class="fa fa-pause"></i>&ensp;<bl>'+ elapsedhms +'</bl> / '+ timehms );
		}
		return
	}
	
	// playlist current song
	if ( status.Title !== previoussong || status.Album !== previousalbum ) {
		if ( G.playlist && !G.pleditor ) setPlaylistScroll();
		if ( $( '#lyricscontainer' ).length && !$( '#lyricscontainer' ).hasClass( 'hide' ) ) getlyrics();
	}
	
	if ( 'time' in G.display ) {
		if ( G.status.mpd ) $( '#elapsed' ).text( second2HMS( elapsed ) );
		G.intElapsed = setInterval( function() {
			elapsed++;
			elapsedhms = second2HMS( elapsed );
			$( '#elapsed' ).text( elapsedhms );
		}, 1000 );
		if ( G.localhost ) { // fix: high cpu - interval each 1 sec
			G.intKnob = setInterval( function() {
				position = Math.round( elapsed / time * 1000 );
				if ( position === 1000 ) {
					clearIntervalAll();
					$( '#elapsed' ).empty();
				}
				$( '#time' ).roundSlider( 'setValue', position );
			}, 1000 );
		} else {
			G.intKnob = setInterval( function() {
				position++;
				if ( position === 1000 ) {
					clearIntervalAll();
					$( '#elapsed' ).empty();
				}
				$( '#time' ).roundSlider( 'setValue', position );
			}, time );
		}
	} else {
		G.intElapsed = setInterval( function() {
			elapsed++;
			elapsedhms = second2HMS( elapsed );
			$( '#timepos' ).html( '&ensp;<i class="fa fa-play"></i>&ensp;<w>'+ elapsedhms +'</w> / '+ timehms );
		}, 1000 );
	}
}
function renderPlaybackBlank() {
	$( '#playback-controls, #divpos i, #coverartoverlay' ).addClass( 'hide' );
	if ( G.status.mpd ) $( '#page-playback .emptyadd' ).removeClass( 'hide' );
	$( '#divartist, #divsong, #divalbum' ).removeClass( 'scroll-left' );
	$( '#artist, #song, #album, #songposition, #format-bitrate, #timepos, #elapsed, #total' ).empty();
	$( '.licover-save' ).remove();
	if ( 'time' in G.display ) $( '#time' ).roundSlider( 'setValue', 0 );
	$( '#cover-art' )
		.attr( 'src', coverrune )
		.css( 'border-radius', '' );
	$( '#artist, #song, #album' )
		.removeClass( 'scrollleft' )
		.removeAttr( 'style' )
		.css( 'visibility', 'visible' );
}
function renderPlaylist() {
	$( '#pl-filter' ).val( '' );
	$( '#pl-currentpath, #pl-back, #pl-editor, #pl-index, #pl-search' ).addClass( 'hide' );
	$( '#db-currentpath>span, #pl-searchbtn' ).removeClass( 'hide' );
	$( '#plopen' ).toggleClass( 'disable', !G.lsplaylists.length );
	G.status.playlistlength = G.pllist.length;
	if ( !G.pllist.length ) {
		$( '#pl-count' ).html( '<span class="title">PLAYLIST</span>' );
		$( '#plsave, #plcrop, #plclear, #pl-searchbtn' ).addClass( 'disable' );
		$( '#pl-entries' ).empty();
		$( '.playlist, #page-playlist .emptyadd' ).removeClass( 'hide' );
		$( 'html, body' ).scrollTop( 0 );
		return
	}
	
	var data = playlist2html( G.pllist );
	var counthtml = '<span class="title">PLAYLIST<gr>·</gr></span>';
	var countradiohtml = '<whl id="countradio" count="'+ data.countradio +'">'+ data.countradio +'</whl>&ensp;<i class="fa fa-webradio"></i>';
	if ( data.countsong ) {
		var pltimehtml = ' id="pltime" time="'+ data.pltime +'">'+ second2HMS( data.pltime );
		var totalhtml = data.countradio ? '<gr'+ pltimehtml +'</gr>&ensp;<gr>•</gr>'+ countradiohtml : '<whl'+ pltimehtml +'</whl>';
		counthtml += '<whl id="countsong" count="'+ data.countsong +'">'+ numFormat( data.countsong ) +'</whl>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
	} else {
		counthtml += countradiohtml;
	}
	$( '.playlist' ).removeClass( 'hide' );
	$( '.emptyadd' ).addClass( 'hide' );
	$( '#pl-count' ).html( counthtml );
	$( '#plsave, #plclear, #pl-searchbtn' ).removeClass( 'disable' );
	$( '#plcrop' ).toggleClass( 'disable', G.pllist.length < 2 );
	$( '#plconsume' ).toggleClass( 'bl', G.status.consume === 1 );
	$( '#pllibrandom' ).toggleClass( 'bl', G.status.librandom === 1 );
	$( '#pl-entries' ).html( data.content +'<p></p>' ).promise().done( function() {
		$( '#pl-entries p' ).css( 'min-height', window.innerHeight - ( G.bars ? 277 : 237 ) +'px' );
		setPlaylistScroll();
	} );
}
function renderSavedPlaylist( name ) {
	$( '.menu' ).addClass( 'hide' );
	$.post( 'commands.php', { getplaylist: name.toString().replace( /"/g, '\\"' ) }, function( list ) {
		var data = playlist2html( list );
		var counthtml = '<whl><i class="fa fa-list-ul"></i></whl><bl class="title">'+ name +'<gr>&ensp;·&emsp;</gr></bl>';
		var countradiohtml = '<whl>'+ data.countradio +'</whl>&ensp;<i class="fa fa-webradio"></i>';
		if ( data.countsong ) {
			var pltimehtml = ' id="pltime" time="'+ data.pltime +'">'+ second2HMS( data.pltime );
			var totalhtml = data.countradio ? '<grl'+ pltimehtml +'</grl> <gr>•</gr> '+ countradiohtml : '<whl'+ pltimehtml +'</whl>';
			counthtml += '<whl>'+ numFormat( data.countsong ) +'</whl>&ensp;<i class="fa fa-music"></i>&ensp;'+ totalhtml;
		} else {
			counthtml += countradiohtml;
		}
		$( '#pl-back' ).css( 'float', 'backonleft' in G.display ? 'left' : '' );
		$( '#pl-currentpath' ).html( '<a class="lipath">'+ name +'</a></ul>'+ counthtml );
		$( '#pl-currentpath, #pl-back, #pl-editor' ).removeClass( 'hide' );
		$( '#pl-currentpath bl' ).removeClass( 'title' );
		$( '#pl-editor' ).html( data.content +'<p></p>' ).promise().done( function() {
			G.pleditor = 1;
			// fill bottom of list to mave last li movable to top
			$( '#pl-editor p' ).css( 'min-height', ( G.bars ? 40 : 0 ) +'px' );
			$( '#pl-editor' ).css( 'width', '100%' );
			$( '#loader, #pl-index' ).addClass( 'hide' );
			$( 'html, body' ).scrollTop( G.plscrolltop );
		} );
	}, 'json' );
}
function replaceCoverart() {
	if ( G.playback ) {
		var src = $( '#cover-art' ).prop( 'src' );
		var path = G.status.file.substr( 0, G.status.file.lastIndexOf( '/' ) );
		var album = G.status.Album;
		var artist = G.status.AlbumArtist || G.status.Artist;
	} else {
		var src = $( '.licoverimg img' ).prop( 'src' );
		var path = $( '.licover .lipath' ).text();
		var album = $( '.licover .lialbum' ).text();
		var artist = $( '.licover .liartist' ).text();
	}
	info( {
		  icon        : 'coverart'
		, title       : 'Replace Album Coverart'
		, message     : '<img src="'+ src +'">'
					   +'<span class="bkname"><br><w>'+ album +'</w>'
					   +'<br>'+ artist +'<span>'
		, fileoklabel : 'Replace'
		, ok          : function() {
			var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
			$.post( 'commands.php', { imagefile: '/mnt/MPD/'+ path +'/cover.jpg', base64: newimg.split( ',' ).pop(), coverfile: 1 }, function( std ) {
				infoCoverart( 'Replace', newimg, std );
			} );
		}
	} );
}
function resetOrientation( file, ori, callback ) {
	var reader = new FileReader();
	reader.onload = function( e ) {
		var img = new Image();
		img.src = e.target.result;
		img.onload = function() {
			var imgW = img.width,
				imgH = img.height,
				canvas = document.createElement( 'canvas' ),
				ctx = canvas.getContext( '2d' );
			// set proper canvas dimensions before transform
			if ( 4 < ori && ori < 9 ) {
				canvas.width = imgH;
				canvas.height = imgW;
			} else {
				canvas.width = imgW;
				canvas.height = imgH;
			}
			// transform context before drawing image
			switch ( ori ) {
				// transform( Hscale, Hskew, Vscale, Vskew, Hmove, Vmove )
				case 2: ctx.transform( -1,  0,  0,  1, imgW,    0 ); break; // mirror up
				case 3: ctx.transform( -1,  0,  0, -1, imgW, imgH ); break; // down
				case 4: ctx.transform(  1,  0,  0, -1,    0, imgH ); break; // mirror down
				case 5: ctx.transform(  0,  1,  1,  0,    0,    0 ); break; // mirror on left side
				case 6: ctx.transform(  0,  1, -1,  0, imgH,    0 ); break; // on left side
				case 7: ctx.transform(  0, -1, -1,  0, imgH, imgW ); break; // mirror on right side
				case 8: ctx.transform(  0, -1,  1,  0,    0, imgW ); break; // on right side
				default: break;
			}
			ctx.drawImage( img, 0, 0 );
			callback( canvas, imgW, imgH );
		}
	}
	reader.readAsDataURL( file );
};
function saveCoverart() {
	var src = $( '#cover-art' ).prop( 'src' );
	var file = G.status.file;
	var path = '/mnt/MPD/'+ file.substr( 0, file.lastIndexOf( '/' ) );
	var coverfile = path.replace( /"/g, '\"' ) +'/cover.jpg';
	var artist = G.status.AlbumArtist || G.status.Artist;
	info( {
		  icon    : 'coverart'
		, title   : 'Save Album Coverart'
		, message : '<img src="'+ src +'">'
					   +'<span class="bkname"><br><w>'+ G.status.Album +'</w>'
					   +'<br>'+ artist +'<span>'
		, ok      : function() { 
			$.post( 'commands.php', { imagefile: coverfile, base64: src.split( ',' ).pop() }, function( std ) {
				infoCoverart( 'Save', src, std );
				$( '.licover-save' ).remove();
			} );
		}
	} );
}
function scrollLongText() {
	var $el = $( '#artist, #song, #album' );
	$el
		.removeClass( 'scrollleft' )
		.removeAttr( 'style' ); // fix - iOS needs whole style removed
	var wW = window.innerWidth;
	var tWmax = 0;
	$el.each( function() {
		var $this = $( this );
		var tW = $this.width() * G.scale;
		if ( tW > wW * 0.98 ) {
			if ( tW > tWmax ) tWmax = tW; // same width > scroll together (same speed)
			$this.addClass( 'scrollleft' );
		}
	} );
	$el.css( 'visibility', 'visible' ); // from initial hidden
	if ( !$( '.scrollleft' ).length ) return
	
	// varied with only when scaled
	var cssanimate = ( wW + tWmax ) / G.scrollspeed +'s infinite scrollleft linear'; // calculate to same speed
	$( '.scrollleft' ).css( {
		  width               : tWmax +'px'
		, animation           : cssanimate
		, '-moz-animation'    : cssanimate
		, '-webkit-animation' : cssanimate
	} )
}
function second2HMS( second ) {
	if ( second <= 0 ) return 0;
	
	var second = Math.round( second );
	var hh = Math.floor( second / 3600 );
	var mm = Math.floor( ( second % 3600 ) / 60 );
	var ss = second % 60;
	
	hh = hh ? hh +':' : '';
	mm = hh ? ( mm > 9 ? mm +':' : '0'+ mm +':' ) : ( mm ? mm +':' : '' );
	ss = mm ? ( ss > 9 ? ss : '0'+ ss ) : ss;
	return hh + mm + ss;
}
function setButton() {
	$( '#playback-controls' ).toggleClass( 'hide', G.status.playlistlength === 0 );
	$( '#previous, #next' ).toggleClass( 'hide', G.status.playlistlength === 1 || !G.status.mpd );
	$( '#pause' ).toggleClass( 'hide', G.status.ext === 'radio' || !G.status.mpd );
	if ( G.bars ) {
		$( '#playback-controls button' ).removeClass( 'active' );
		$( '#'+ G.status.state ).addClass( 'active' );
	}
	$( '#badge, #badgeaddons' ).remove();
	if ( 'update' in G.display ) {
		if ( G.bars ) $( '#menu-settings' ).after( '<span id="badge"></span>' );
		$( '#addons i' ).after( '<span id="badgeaddons">'+ G.display.update +'</span>' );
	}
	setTimeout( function() {
		setButtonUpdate();
		if ( G.playback ) setButtonToggle();
	}, 100 );
}
function setButtonToggle() {
	if ( $( '#time-knob' ).is( ':hidden' ) ) {
		$( '#imode i' ).addClass( 'hide' );
		if ( G.status.playlistlength ) {
			$( '#posrandom' ).toggleClass( 'hide', G.status.random === 0 );
			$( '#posrepeat' ).attr( 'class', G.status.repeat ? ( G.status.single ? 'fa fa-repeat-single' : 'fa fa-repeat' ) : 'fa hide' );
		}
		if ( G.status.mpd ) {
			$( '#posconsume' ).toggleClass( 'hide', G.status.consume === 0 );
			$( '#poslibrandom' ).toggleClass( 'hide', G.status.librandom === 0 );
		}
		$( '#posaddons' ).toggleClass( 'hide', G.bars !== '' || !( 'update' in G.display ) );
		$( '#posgpio' ).toggleClass( 'hide', G.gpio !== 'ON' )
	} else {
		$( '#posmode i' ).addClass( 'hide' );
		$( '#iconsume' ).toggleClass( 'hide', G.status.consume === 0 );
		$( '#ilibrandom' ).toggleClass( 'hide', G.status.librandom === 0 );
		$( '#iaddons' ).toggleClass( 'hide', G.bars !== '' || !( 'update' in G.display ) );
		if ( $( '#play-group' ).is( ':visible' ) ) {
			$( '#irandom' ).addClass( 'hide' )
			$( '#irepeat' ).attr( 'class', 'fa hide' );
			$( '#random' ).toggleClass( 'active', G.status.random === 1 );
			$( '#repeat' ).toggleClass( 'active', G.status.repeat === 1 );
			$( '#single' ).toggleClass( 'active', G.status.single === 1 );
		} else {
			$( '#irandom' ).toggleClass( 'hide', G.status.random === 0 );
			$( '#irepeat' ).attr( 'class', G.status.repeat ? ( G.status.single ? 'fa fa-repeat-single' : 'fa fa-repeat' ) : 'fa hide' );
		}
		$( '#igpio' ).toggleClass( 'hide', G.gpio !== 'ON' )
	}
}
function setButtonUpdate() {
	if ( G.status.updating_db ) {
		if ( !G.localhost ) $( '#tab-library i, #db-home i' ).addClass( 'blink' );
		if ( G.playback && !G.bars ) {
			if ( $( '#time-knob' ).is( ':hidden' ) ) {
				$( '#posupdate' ).removeClass( 'hide' );
				$( '#iupdate' ).addClass( 'hide' );
			} else {
				$( '#posupdate' ).addClass( 'hide' );
				$( '#iupdate' ).removeClass( 'hide' );
			}
		}
	} else {
		if ( !G.localhost ) $( '#tab-library i, #db-home i, .db-icon' ).removeClass( 'blink' );
		$( '#posupdate, #iupdate' ).addClass( 'hide' );
	}
}
function setImage( canvas, imgW, imgH ) {
	$( '#infoFilename' ).empty();
	$( '.newimg, .imagewh, .bkname' ).remove();
	if ( !G.playback && !$( '#db-entries .licover' ).length ) {
		var px = 200;
	} else if ( imgW > 1000 || imgH > 1000 ) {
		var px = 1000;
	} else {
		var px = imgW < imgH ? imgW : imgH;
	}
	picacanvas = document.createElement( 'canvas' );
	picacanvas.width = picacanvas.height = px; // size of resized image
	var imgWHhtml = '<div class="imagewh"><span>Current</span><span>'+ px +' x '+ px +'</span>';
	if ( imgW === px && imgH === px ) {
		$( '#infoMessage' ).append( '<img class="newimg" src="'+ canvas.toDataURL( 'image/jpeg' ) +'">'+ imgWHhtml +'</div>' );
	} else {
		imgWHhtml += '<div>(Resized from '+ imgW +' x '+ imgH +' px)'
					+'<br>Tap to rotate.'
					+'</div></div>';
		pica.resize( canvas, picacanvas, picaOption ).then( function() {
			var resizedimg = picacanvas.toDataURL( 'image/jpeg' ); // canvas -> base64
			$( '#infoMessage' ).append( '<img class="newimg" src="'+ resizedimg +'">'+ imgWHhtml );
		} );
	}
}
function setNameWidth() {
	var wW = window.innerWidth;
	$.each( $( '#pl-entries .name' ), function() {
		var $name = $( this );
		var $dur =  $name.next();
		// pl-icon + margin + duration + margin
		var iWdW = 40 + 10 + $dur.width();
		if ( iWdW + $name.width() < wW ) {
			$dur.removeClass( 'duration-right' );
			$name.css( 'max-width', '' );
		} else {
			$dur.addClass( 'duration-right' );
			$name.css( 'max-width', wW - iWdW +'px' );
		}
	} );
}
function setPageSwipe( type ) {
	var swipeleft = type === 'swipeleft';
	var $target = {
		  library  : swipeleft ? $( '#tab-playback' ) : $( '#tab-playlist' )
		, playback : swipeleft ? $( '#tab-playlist' ) : $( '#tab-library' )
		, playlist : swipeleft ? $( '#tab-library' )  : $( '#tab-playback' )
	}
	$target[ G.currentpage  ].click();
	$( '#swipebar' ).addClass( 'transparent' );
}
function setPlaylistScroll() {
	if ( !G.status.playlistlength || G.sortable ) return // skip if empty or Sortable
	
	clearInterval( G.intElapsedPl );
	clearTimeout( G.debounce );
	G.debounce = setTimeout( function() {
		displayTopBottom();
		$( '#context-menu-plaction' ).addClass( 'hide' );
		$( '#pl-entries li' ).removeClass( 'lifocus' );
		setNameWidth();
		var $linotactive, $liactive, $name, $song, $elapsed, elapsedtxt;
		$.post( 'commands.php', { getjson: '/srv/http/bash/status.sh statusonly' }, function( status ) {
			$.each( status, function( key, value ) {
				G.status[ key ] = value;
			} );
			if ( G.bars ) setButton();
			elapsed = status.elapsed;
			var radio = G.status.ext === 'radio';
			var slash = radio ? '' : ' <gr>/</gr>';
			$linotactive = $( '#pl-entries li:not(:eq( '+ status.song +' ) )' );
			$linotactive.removeClass( 'active activeplay' ).find( '.elapsed, .song' ).empty();
			$linotactive.find( '.name' ).removeClass( 'hide' );
			$linotactive.find( '.song' ).css( 'max-width', '' );
			$liactive = $( '#pl-entries li' ).eq( status.song );
			$liactive.addClass( 'active' );
			$name = $liactive.find( '.name' );
			$song = $liactive.find( '.song' );
			$title = radio ? $song : $name;
			$duration = $liactive.find( '.duration' );
			$elapsed = $liactive.find( '.elapsed' );
			setTimeout( function() {
				var scrollpos = $liactive.offset().top - $( '#pl-entries' ).offset().top - ( 49 * 3 );
				$( 'html, body' ).scrollTop( scrollpos );
			}, 300 );
			if ( status.state === 'pause' ) {
				elapsedtxt = second2HMS( elapsed );
				$elapsed.html( '<i class="fa fa-pause"></i> '+ elapsedtxt + slash );
				getTitleWidth();
				setTitleWidth();
			} else if ( status.state === 'play' ) {
				if ( radio ) {
					$name.addClass( 'hide' );
					$liactive.find( '.nameli2' ).removeClass( 'hide' );
					$song.html( status.Title || blinkdot );
				} else {
					$name.removeClass( 'hide' );
					$song.empty();
				}
				getTitleWidth();
				var time = $liactive.find( '.time' ).attr( 'time' );
				clearInterval( G.intElapsedPl ); // fix: some G.intElapsedPl not properly cleared
				G.intElapsedPl = setInterval( function() {
					elapsed++;
					if ( elapsed === +time ) {
						clearInterval( G.intElapsedPl );
						$elapsed.empty();
						return
					}
					
					elapsedtxt = second2HMS( elapsed );
					$elapsed.html( '<i class="fa fa-play"></i>'+ elapsedtxt + slash );
					setTitleWidth();
				}, 1000 );
			} else { // stop
				$name.removeClass( 'hide' );
				$liactive.find( '.nameli2' ).addClass( 'hide' );
				$song
					.empty()
					.css( 'max-width', '' );
				$elapsed.empty();
			}
		}, 'json' );
	}, G.debouncems );
}
function setSwipe() {
	if ( !( 'bars' in G.display ) || ( G.screenS && !( 'barsauto' in G.display ) ) ) {
		G.bars = 0;
		$( '#swipebar, .page' ).on( 'swipeleft swiperight', function( e ) {
			if ( G.swipepl ) return // suppress if swipe playlist li
			
			G.swipe = 1;
			setTimeout( function() { G.swipe = 0 }, 1000 );
			// skip if swipe to show remove in playlist
			if ( !$( e.target ).parents( '#pl-entries li' ).length ) setPageSwipe( e.type );
		} );
	} else {
		G.bars = 1;
	}
}
function setTitleWidth() {
	// pl-icon + margin + duration + margin
	var iWdW = 40 + 10 + $duration.width() + 10;
	if ( iWdW + pltW < plwW ) {
		$title.css(  'max-width', '' );
		$duration.removeClass( 'duration-right' );
	} else {
		$title.css( 'max-width', plwW - iWdW +'px' );
		$duration.addClass( 'duration-right' );
	}
	$( '.duration-right' ).css( 'right', '' );
}
function stopAirplay() {
	info( {
		  icon    : 'airplay'
		, title   : 'AirPlay'
		, message : 'AirPlay is playing.'
				   +'<br>Stop AirPlay?'
		, ok      : function() {
			$( '#stop' ).click();
		}
	} );
}
function switchPage( page ) {
	clearIntervalAll();
	if ( G.library && $( '#home-blocks' ).hasClass( 'hide' ) ) {
		if ( !$( '#divcoverarts' ).hasClass( 'hide' ) ) {
			G.cvscrolltop = $( window ).scrollTop();
		} else {
			G.libraryscrolltop = G.currentpath ? $( window ).scrollTop() : 0;
		}
	} else if ( G.playlist && G.pleditor ) {
		G.playlistscrolltop = $( window ).scrollTop();
	}
	$( '#menu-bottom li' ).removeClass( 'active' );
	$( '.page, .menu' ).addClass( 'hide' );
	$( '#page-'+ page ).removeClass( 'hide' );
	$( '#tab-'+ page ).addClass( 'active' );
	$( '#pl-search-close, #pl-search-close' ).addClass( 'hide' );
	G.library = G.playback = G.playlist = 0;
	G[ page ] = 1;
	G.currentpage = page;
	// restore page scroll
	if ( G.playback ) {
		if ( G.status.state === 'play' && G.status.ext !== 'radio' ) $( '#elapsed' ).empty(); // hide flashing
		$( 'html, body' ).scrollTop( 0 );
	} else if ( G.library ) {
		if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
			renderLibrary();
		} else {
			var scrolltop = $( '#divcoverarts' ).hasClass( 'hide' ) ? G.libraryscrolltop : G.cvscrolltop;
			$( 'html, body' ).scrollTop( scrolltop );
		}
	} else if ( G.playlist && G.pleditor ) {
		$( '.emptyadd' ).addClass( 'hide' );
		$( 'html, body' ).scrollTop( G.playlistscrolltop );
	}
}
function unmuteColor() {
	$volumetooltip.removeClass( 'bl' );
	$volumehandle.removeClass( 'bgr' );
	$( '#volmute' ).removeClass( 'active' )
		.find( 'i' ).removeClass( 'fa-mute' ).addClass( 'fa-volume' );
}
function updatePlaylist() {
	if ( G.pleditor || G.contextmenu || $( '#pl-entries .pl-remove' ).length ) return
	
	$.post( 'commands.php', { getplaylist: 'playlist' }, function( data ) {
		var playlistlength = data.playlist.length;
		if ( G.similarpl !== -1 ) {
			notify( 'Playlist Add Similar', ( playlistlength - G.similarpl ) +' tracks added', 'list-ul' );
			G.similarpl = -1;
		}
		if ( playlistlength ) {
			G.status.playlistlength = playlistlength;
			G.lsplaylists = data.lsplaylists || [];
			G.pllist = data.playlist;
		} else {
			G.status.playlistlength = 0;
			G.pllist = {};
		}
		if ( G.playlist ) renderPlaylist();
		if ( G.bars ) $( '#previous, #next' ).toggleClass( 'hide', G.status.playlistlength === 1 );
		getPlaybackStatus();
	}, 'json' );
}
function windowopen( url ) { // share this track
	window.open = (
		  url
		, 'menubar=no'
		, 'toolbar=no'
		, 'resizable=yes'
		, 'scrollbars=yes'
		, 'height=600'
		, 'width=600'
	);
}
