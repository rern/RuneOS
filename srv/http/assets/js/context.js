// single quotes in mpc name arguments - enclosed with double quotes + escape double quotes
// example: mpc save "abc's \"xyz\"" << name.replace( /"/g, '\\"' )

$( '.contextmenu a' ).click( function( e ) {
	var submenu = $( e.target ).hasClass( 'submenu' );
	if ( submenu ) {
		var $this = $( e.target );
	} else {
		var $this = $( this );
	}
	var cmd = $this.data( 'cmd' );
	$( '.menu' ).addClass( 'hide' );
	$( 'li.updn' ).removeClass( 'updn' );
	// playback //////////////////////////////////////////////////////////////
	if ( [ 'play', 'pause', 'stop' ].indexOf( cmd ) !== -1 ) {
		if ( cmd === 'play' ) {
			$( '#pl-entries li' ).eq( GUI.list.li.index() ).click();
		} else {
			$( '#'+ cmd ).click();
		}
		return
	}
	
	if ( cmd === 'update' ) {
		GUI.list.li.find( '.db-icon' ).addClass( 'blink' );
		$.post( 'commands.php', { bash: 'mpc update "'+ GUI.list.path +'"' } );
	} else if ( cmd === 'tag' ) {
		$.post( 'commands.php', { counttag: GUI.list.path }, function( counts ) {
			tag( counts );
		}, 'json' );
	} else if ( cmd === 'remove' ) {
		GUI.contextmenu = 1;
		setTimeout( function() { GUI.contextmenu = 0 }, 500 );
		removeFromPlaylist( GUI.list.li );
	} else if ( cmd === 'savedpladd' ) {
		GUI.plappend = {
			  file  : GUI.list.path
			, index : GUI.list.index
		}
		info( {
			  icon    : 'list-ul'
			, title   : 'Add to playlist'
			, message : 'Select playlist to add:'
					   +'<br><w>'+ GUI.list.name +'</w>'
			, cancel  : function() {
				GUI.plappend = '';
			}
			, ok      : function() {
				$( '#plopen' ).click();
			}
		} );
	} else if ( cmd === 'savedplremove' ) {
		var plline = GUI.list.li.index() + 1;
		var plname = $( '#pl-currentpath .lipath' ).text();
		$.post( 'commands.php', { bash: 'sed -i "'+ plline +' d" "/srv/http/data/playlists/'+ plname +'"' } );
		GUI.list.li.remove();
	} else if ( cmd === 'similar' ) {
		notify( 'Playlist Add Similar', '<span class="blink">Fetcthing list...</span>', 'list-ul', -1 );
		$.ajax( {
			  type     : 'post'
			, url      : 'http://ws.audioscrobbler.com/2.0/'
			, data     : { 
				  api_key     : GUI.apikeylastfm
				, autocorrect : 1
				, format      : 'json'
				, method      : 'track.getsimilar'
				, artist      : GUI.list.artist
				, track       : GUI.list.name
				, limit       : 1000
			}
			, timeout  : 5000
			, dataType : 'json'
			, success  : function( data ) {
				var similartracks = data.similartracks.track;
				var tracklength = similartracks.length;
				if ( !data || !tracklength ) {
					notify( 'Playlist Add Similar', 'Data not available.', 'list-ul' );
					return
				}
				
				GUI.similarpl = GUI.status.playlistlength;
				$.each( similartracks, function( i, val ) {
					$.post( 'commands.php', { mpc : 'mpc findadd artist "'+ val.artist.name +'" title "'+ val.name +'"' }, function() {
						$( '#bannerMessage' ).html( 'Find '+ ( i + 1 ) +'/'+ tracklength +' in Library ...' );
					} );
				} );
				if ( submenu ) $.post( 'commands.php', { mpc : 'mpc play' } );
			}
		} );
	} else if ( cmd === 'exclude' ) {
		var path = GUI.list.path.split( '/' );
		var dir = path.pop();
		var mpdpath = path.join( '/' );
		var pathfile = '/mnt/MPD/'+ mpdpath +'/.mpdignore';
		GUI.local = 1;
		setTimeout( function() { GUI.local = 0 }, 2000 );
		$.post( 'commands.php', { bash: [
			  "echo '"+ dir +"' | /usr/bin/sudo /usr/bin/tee -a '"+ pathfile +"'"
			, 'mpc update "'+ mpdpath +'"' // get .mpdignore into database
			, 'mpc update "'+ mpdpath +'"' // after .mpdignore was in database
		] }, function() {
			GUI.list.li.remove();
		} );
		notify( 'Exclude Directory', '<wh>'+ dir +'</wh> excluded from database.', 'folder' );
	}
	if ( [ 'savedpladd', 'savedplremove', 'similar', 'tag', 'remove', 'update' ].indexOf( cmd ) !== -1 ) return
	
	// functions with dialogue box ////////////////////////////////////////////
	var contextFunction = {
		  wrrename      : webRadioRename
		, wrcoverart    : webRadioCoverart
		, wrdelete      : webRadioDelete
		, plrename      : playlistRename
		, pldelete      : playlistDelete
		, bookmark      : bookmarkNew
		, thumbnail     : updateThumbnails
	}
	if ( cmd in contextFunction ) {
		contextFunction[ cmd ]();
		return
	}
	
	// replaceplay|replace|addplay|add //////////////////////////////////////////
	var name = ( GUI.browsemode === 'coverart' && !GUI.list.isfile ) ? GUI.list.name : GUI.list.path;
	name = name.replace( /"/g, '\\"' );
	// compose command
	var mpcCmd;
	// must keep order otherwise replaceplay -> play, addplay -> play
	var mode = cmd.replace( /replaceplay|replace|addplay|add/, '' );
	if ( [ 'album', 'artist', 'composer', 'genre' ].indexOf( GUI.list.mode ) !== -1 ) {
		var artist = GUI.list.artist;
		mpcCmd = 'mpc findadd '+ GUI.list.mode +' "'+ name +'"'+ ( artist ? ' artist "'+ artist +'"' : '' );
	} else if ( !mode ) {
		var ext = name.split( '.' ).pop();
		if ( ext === 'cue' && GUI.list.index ) { // cue
			var plfile = GUI.list.path.replace( /"/g, '\\"' );
			mpcCmd = 'mpc --range='+ ( GUI.list.index - 1 ) +':'+ GUI.list.index +' load "'+ plfile +'"';
		} else if ( ext === 'cue' || ext === 'pls' ) {
			mpcCmd = 'mpc load "'+ name +'"';
		} else {
			mpcCmd = GUI.list.isfile ? 'mpc add "'+ name +'"' : 'mpc ls "'+ name +'" | mpc add';
		}
	} else if ( mode === 'wr' ) {
		cmd = cmd.slice( 2 );
		mpcCmd = 'mpc add "'+ GUI.list.path.replace( /"/g, '\\"' ) +'"';
	} else if ( mode === 'pl' ) {
		cmd = cmd.slice( 2 );
		if ( GUI.library ) {
			mpcCmd = 'mpc load "'+ name +'"';
		} else { // saved playlist
			var play = cmd.slice( -1 ) === 'y' ? 1 : 0;
			var replace = cmd.slice( 0, 1 ) === 'r' ? 1 : 0;
			if ( replace && 'plclear' in GUI.display && GUI.status.playlistlength ) {
				info( {
					  icon    : 'list-ul'
					, title   : 'Playlist Replace'
					, message : 'Replace current playlist?'
					, ok      : function() {
						notify( 'Saved Playlist', '<i class="fa fa-gear fa-spin"></i> Loading ...', 'list-ul', -1 );
						$.post( 'commands.php', { loadplaylist: name, play: play, replace: replace }, function() {
							notify( 'Playlist Replaced', name, 'list-ul' );
						} );
					}
				} );
			} else {
				notify( 'Saved Playlist', '<i class="fa fa-gear fa-spin"></i> Loading ...', 'list-ul', -1 );
				$.post( 'commands.php', { loadplaylist: name, play: play, replace: replace }, function() {
					notify( ( replace ? 'Playlist Replaced' : 'Playlist Added' ), 'Done', 'list-ul' );
				} );
			}
			return
		}
	}
	
	cmd = cmd.replace( /album|artist|composer|genre/, '' );
	var sleep = GUI.list.path.slice( 0, 4 ) === 'http' ? '; sleep 1' : '; sleep 0.2';
	var contextCommand = {
		  add         : mpcCmd
		, addplay     : 'pos=$( mpc playlist | wc -l ); '+ mpcCmd + sleep +'; mpc play $(( pos + 1 ))'
		, replace     : [ 'mpc clear', mpcCmd ]
		, replaceplay : [ 'mpc clear', mpcCmd, sleep, 'mpc play' ]
	}
	if ( cmd in contextCommand ) {
		var command = contextCommand[ cmd ];
		if ( [ 'add', 'addplay' ].indexOf( cmd ) !== -1 ) {
			var msg = 'Add to Playlist'+ ( cmd === 'add' ? '' : ' and play' )
			addReplace( cmd, command, msg );
		} else {
			var msg = 'Replace playlist'+ ( cmd === 'replace' ? '' : ' and play' )
			if ( 'plclear' in GUI.display && GUI.status.playlistlength ) {
				info( {
					  title   : 'Playlist'
					, message : 'Replace current Playlist?'
					, ok      : function() {
						addReplace( cmd, command, msg );
					}
				} );
			} else {
				addReplace( cmd, command, msg );
			}
		}
	}
} );

function addReplace( cmd, command, title ) {
	var playbackswitch = 'playbackswitch' in GUI.display && ( cmd === 'addplay' || cmd === 'replaceplay' );
	$.post( 'commands.php', { mpc: command }, function() {
		if ( playbackswitch ) {
			$( '#tab-playback' ).click();
		} else {
			if ( cmd === 'replace' ) GUI.plreplace = 1;
			if ( GUI.list.li.hasClass( 'licover' ) ) {
				var msg = GUI.list.li.find( '.lialbum' ).text()
						+'<a class="li2">'+ GUI.list.li.find( '.liartist' ).text() +'</a>';
			} else if ( GUI.list.li.find( '.li1' ).length ) {
				var msg = GUI.list.li.find( '.li1' )[ 0 ].outerHTML
						+ GUI.list.li.find( '.li2' )[ 0 ].outerHTML;
			} else {
				var msg = GUI.list.li.find( '.lipath' ).text();
			}
			notify( title, msg, 'list-ul' );
		}
	} );
}
function bookmarkDelete( path, name, $block ) {
	var $img = $block.find( 'img' );
	var src = $img.attr( 'src' );
	if ( src ) {
		var icon = '<img src="'+ src +'">'
	} else {
		var icon = '<i class="fa fa-bookmark bookmark"></i>'
				  +'<br><a class="bklabel">'+ name +'</a>'
	}
	info( {
		  icon    : 'bookmark'
		, title   : 'Remove Bookmark'
		, message : icon
		, oklabel : 'Remove'
		, ok      : function() {
			GUI.bookmarkedit = 1;
			$.post( 'commands.php', { bookmarks: name, path: path, delete: 1 } );
			$block.parent().remove();
		}
	} );
}
function bookmarkNew() {
	var path = GUI.list.path;
	var name = path.split( '/' ).pop();
	var $el = $( '.home-bookmark' );
	if ( !$el.length ) return
	
	var exist = 0;
	$el.each( function() {
		var $this = $( this );
		if ( $this.find( '.lipath' ).text() === path ) {
			var $img = $this.find( 'img' );
			if ( $img.length ) {
				var iconhtml = '<img src="'+ $img.attr( 'src' ) +'">'
							  +'<br><w>'+ path +'</w>';
			} else {
				var iconhtml = '<i class="fa fa-bookmark bookmark"></i>'
							  +'<br><a class="bklabel">'+ $this.find( '.bklabel' ).text() +'</a>'
							  + path;
			}
			info( {
				  icon    : 'bookmark'
				, title   : 'Add Bookmark'
				, message : iconhtml
						   +'<br><br>Already exists.'
			} );
			exist = 1;
			return false
		}
	} );
	if ( exist ) return
	
	$.post( 'commands.php', { getcover: path }, function( base64img ) {
		if ( base64img ) {
			info( {
				  icon    : 'bookmark'
				, title   : 'Add Bookmark'
				, message : '<img src="'+ base64img +'">'
						   +'<br><w>'+ path +'</w>'
				, ok      : function() {
					$.post( 'commands.php', { bookmarks: 1, path: path, base64: base64img, new: 1 } );
					notify( 'Bookmark Added', path, 'bookmark' );
				}
			} );
		} else {
			info( {
				  icon         : 'bookmark'
				, title        : 'Add Bookmark'
				, width        : 500
				, message      : '<i class="fa fa-bookmark bookmark"></i>'
								+'<br>'
								+'<br><w>'+ path +'</w>'
								+'<br>As:'
				, textvalue    : name
				, textrequired : 0
				, boxwidth     : 'max'
				, textalign    : 'center'
				, ok           : function() {
					$.post( 'commands.php', { bookmarks: $( '#infoTextBox' ).val(), path: path, new: 1 } );
					notify( 'Bookmark Added', path, 'bookmark' );
				}
			} );
		}
	} );
}
function bookmarkRename( name, path, $block ) {
	info( {
		  icon         : 'bookmark'
		, title        : 'Rename Bookmark'
		, width        : 500
		, message      : '<i class="fa fa-bookmark bookmark"></i>'
						+'<br><a class="bklabel">'+ name +'</a>'
						+'To:'
		, textvalue    : name
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, oklabel      : 'Rename'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			$.post( 'commands.php', { bookmarks: newname, path: path, rename: 1 } );
			$block.find( '.bklabel' ).text( newname );
		}
	} );
}
function playlistAdd( name, oldname ) {
	if ( oldname ) {
		var path = '/srv/http/data/playlists/'
		var oldfile = path + oldname.replace( /"/g, '\\"' );
		var newfile = path + name.replace( /"/g, '\\"' );
		$.post( 'commands.php', { bash: 'mv "'+ oldfile +'" "'+ newfile +'"' } );
	} else {
		$.post( 'commands.php', { saveplaylist: name.replace( /"/g, '\\"' ) }, function( exist ) {
			if ( exist == -1 ) {
				info( {
					  icon        : 'list-ul'
					, title       : oldname ? 'Rename Playlist' : 'Add Playlist'
					, message     : '<i class="fa fa-warning fa-lg"></i>&ensp;<w>'+ name +'</w>'
								   +'<br>Already exists.'
					, buttonlabel : 'Back'
					, button      : playlistNew
					, oklabel     : 'Replace'
					, ok          : function() {
						oldname ? playlistAdd( name, oldname ) : playlistAdd( name );
					}
				} );
			} else {
				notify( 'Playlist Saved', name, 'list-ul' );
				$( '#plopen' ).removeClass( 'disable' );
			}
		} );
	}
}
function playlistDelete() {
	info( {
		  icon    : 'list-ul'
		, title   : 'Delete Playlist'
		, message : 'Delete?'
				   +'<br><w>'+ GUI.list.name +'</w>'
		, oklabel : 'Delete'
		, ok      : function() {
			var count = $( '#pls-count' ).text() - 1;
			if ( count ) $( '#pls-count' ).text( numFormat( count ) );
			GUI.list.li.remove();
			$.post( 'commands.php', { bash: 'rm "/srv/http/data/playlists/'+ GUI.list.name.replace( /"/g, '\\"' ) +'"' }, function() {
				if ( !count ) $( '#pl-home' ).click();
			} );
		}
	} );
}
function playlistNew() {
	info( {
		  icon         : 'list-ul'
		, title        : 'Add Playlist'
		, message      : 'Save current playlist as:'
		, textlabel    : 'Name'
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, ok           : function() {
			playlistAdd( $( '#infoTextBox' ).val() );
		}
	} );
}
function playlistRename() {
	var name = GUI.list.name;
	info( {
		  icon         : 'list-ul'
		, title        : 'Rename Playlist'
		, message      : 'Rename:'
						+'<br><w>'+ name +'</w>'
						+'<br>To:'
		, textvalue    : name
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, oklabel      : 'Rename'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			playlistAdd( newname, name );
			GUI.list.li.find( '.plname' ).text( newname );
		}
	} );
}
function tag( counts ) {
	var cue = GUI.list.path.split( '.' ).pop() === 'cue';
	var cmd = 'mpc -f "%artist%^^%albumartist%^^%album%^^%composer%^^%genre%^^%title%^^%track%^^%file%" ';
	if ( !cue ) {
		cmd += 'ls "'+ GUI.list.path +'" 2> /dev/null | head -1';
	} else {
		cmd += 'playlist "'+ GUI.list.path +'"';
		var track = GUI.list.index;
		if ( track ) {
			if ( track < 10 ) track = '0'+ track; 
			cmd += ' | grep "\\^\\^'+ track +'\\^\\^"';
		} else {
			cmd += ' 2> /dev/null | head -1';
		}
	}
	$.post( 'commands.php', { bash: cmd }, function( data ) {
		var tags = data[ 0 ].split( '^^' );
		var file = tags[ 7 ].replace( /"/g, '\"' );
		var ext = file.split( '.' ).pop();
		var path = file.substr( 0, file.lastIndexOf( '/' ) );
		var labels = [
			  '<i class="fa fa-artist wh"></i>'
			, '<i class="fa fa-albumartist wh"></i>'
			, '<i class="fa fa-album wh"></i>'
			, '<i class="fa fa-composer wh"></i>'
			, '<i class="fa fa-genre wh"></i>'
		];
		var values = [ tags[ 0 ], tags[ 1 ], tags[ 2 ], tags[ 3 ], tags[ 4 ] ];
		if ( GUI.list.isfile ) {
			labels.push(
				  '<i class="fa fa-music wh"></i>'
				, '<i class="fa fa-hash wh"></i>'
			);
			values.push( tags[ 5 ], tags[ 6 ] );
			var message = '<i class="fa fa-file-music wh"></i> '+ ( cue ? GUI.list.path : file ) +'<br>&nbsp;'
			var pathfile = '"/mnt/MPD/'+ file +'"';
		} else {
			var message = '<img src="'+ $( '.licoverimg img' ).attr( 'src' ) +'" style="width: 50px; height: 50px;">'
						 +'<br><i class="fa fa-folder wh"></i>'+ ( cue ? GUI.list.path : path ) +'<br>&nbsp;'
			var pathfile = '"/mnt/MPD/'+ path +'/*.'+ ext +'"';
		}
		var various = '***various***';
		info( {
			  icon      : 'tag'
			, title     : 'Tag Editor'
			, width     : 500
			, message   : message
			, textlabel : labels
			, textvalue : values
			, boxwidth  : 'max'
			, preshow   : function() {
				if ( counts.artist > 1 ) $( '#infoTextBox' ).val( various );
				if ( counts.composer > 1 ) $( '#infoTextBox3' ).val( various );
				if ( counts.genre > 1 ) $( '#infoTextBox4' ).val( various );
				if ( cue && GUI.list.isfile ) {
					for ( i = 1; i < 7; i++ ) if ( i !== 5 ) $( '#infoTextLabel'+ i +', #infoTextBox'+ i ).next().andSelf().addClass( 'hide' );
					$( '#infoTextLabel6, #infoTextBox6' ).next().andSelf().addClass( 'hide' );
				}
			}
			, ok        : function() {
				var val = [];
				$( '#infotextbox .infoinput' ).each( function() {
					val.push( this.value );
				} );
				var artist      = val[ 0 ];
				var albumartist = val[ 1 ];
				var album       = val[ 2 ];
				var composer    = val[ 3 ];
				var genre       = val[ 4 ];
				var title       = val[ 5 ];
				if ( !cue ) {
					var names = [ 'artist', 'albumartist', 'album', 'composer', 'genre', 'title', 'tracknumber' ];
					var vL = val.length;
					var kid3 = 'kid3-cli ';
					for ( i = 0; i < vL; i++ ) {
						if ( val[ i ] !== various ) kid3 += "-c \"set "+ names[ i ] +" '"+ val[ i ].toString().replace( /(["'])/g, '\\$1' ) +'\'" ';
					}
					kid3 += pathfile;
					var cmd = [ kid3, 'mpc update "'+ path +'"' ];
				} else {
					var                         sed  = "sed -i"
													  +" -e '/^PERFORMER/ d'"
													  +" -e '/^REM COMPOSER/ d'"
													  +" -e '/^REM GENRE/ d'";
					if ( artist !== various )   sed += " -e 's/^\\s\\+PERFORMER.*/    PERFORMER \""+ artist +"\"/'";
					if ( albumartist )          sed += " -e '/^TITLE/ i\\PERFORMER \""+ albumartist +"\"'";
					if ( album )                sed += " -e 's/^TITLE.*/TITLE \""+ album +"\"/'";
					if ( composer !== various ) sed += " -e '1 i\\REM COMPOSER \""+ composer +"\"'";
					if ( genre !== various )    sed += " -e '1 a\\REM GENRE \""+ genre +"\"'";
					
					if ( GUI.list.isfile )      sed += " -e '/^\\s\\+TRACK "+ track +"/ {"
													  +' n;  s/^\\s\\+TITLE.*/    TITLE "'+ title +'"/'
													  +';n;  s/^\\s\\+PERFORMER.*/    PERFORMER "'+ artist +'"/'
													  +"}'";
												
												sed = ' "/mnt/MPD/'+ GUI.list.path +'"';
					var cmd = [ sed, 'mpc update "'+ GUI.list.path.substr( 0, file.lastIndexOf( '/' ) ) +'"' ];
				}
				$.post( 'commands.php', { bash: cmd } );
				// local fields update
				if ( GUI.list.isfile ) {
					GUI.list.li.find( '.name' ).text( title );
				} else {
					$( '.liartist' ).text( albumartist || artist );
					$( '.lialbum' ).text( album );
					$( '.licomposer, .ligenre' ).next().andSelf().remove();
					if ( composer ) $( '.liartist' ).next().after( '<span class="licomposer"><i class="fa fa-composer"></i>'+ composer +'</span><br>' );
					if ( genre ) $( '.liinfo .db-icon' ).before( '<span class="ligenre"><i class="fa fa-genre"></i>'+ genre +'</span><br>' );
				}
			}
		} );
	}, 'json' );
}
function updateThumbnails() {
	// enclosed in double quotes entity &quot;
	var path = '&quot;/mnt/MPD/'+ GUI.list.path.replace( /"/g, '\"' ) +'&quot;';
	info( {
		  icon     : 'coverart'
		, title    : 'Coverart Thumbnails Update'
		, message  : 'Update thumbnails in:'
					+'<br><w>'+ GUI.list.path +'</w>'
					+'<br>&nbsp;'
		, checkbox : {
			  'Replace existings'       : 1
			, 'Update Library database' : 1
		}
		, ok       : function() {
			$( 'body' ).append(
				'<form id="formtemp" action="addons-bash.php" method="post">'
					+'<input type="hidden" name="alias" value="cove">'
					+'<input type="hidden" name="type" value="scan">'
				+'</form>' );
			$( '#infoCheckBox input' ).each( function() {
				path += $( this ).prop( 'checked' ) ? ' 1': ' 0';
			} );
			$( '#formtemp' )
				.append( '<input type="hidden" name="opt" value="'+ path +'">' )
				.submit();
		}
	} );
}
function webRadioCoverart() {
	var urlname = GUI.list.path.replace( /\//g, '|' );
	var img = 'li' in GUI.list ? GUI.list.li.find( 'img' ).prop( 'src' ) : '';
	var name = GUI.list.name;
	var $img = img ? '<img src="'+ img +'">' : '<img src="'+ vu +'" style="border-radius: 9px">';
	var infojson = {
		  icon        : 'webradio'
		, title       : 'Change Coverart'
		, message     : ( img ? '<img src="'+ img +'">' : '<img src="'+ vu +'" style="border-radius: 9px">' )
					   +'<span class="bkname"><br><w>'+ name +'</w><span>'
		, fileoklabel : 'Replace'
		, ok         : function() {
			var newimg = $( '#infoMessage .newimg' ).attr( 'src' );
			var picacanvas = document.createElement( 'canvas' );
			picacanvas.width = picacanvas.height = 80;
			pica.resize( $( '#infoMessage .newimg' )[ 0 ], picacanvas, picaOption ).then( function() {
				var newthumb = picacanvas.toDataURL( 'image/jpeg', 0.9 );
				$.post( 'commands.php', { imagefile: urlname, base64webradio: name +'\n'+ newthumb +'\n'+ newimg }, function( result ) {
					if ( result != -1 ) {
						if ( GUI.playback ) {
							$( '#cover-art' ).attr( 'src', newimg );
						} else {
							GUI.list.li.find( '.db-icon' ).remove();
							GUI.list.li.find( '.lisort' ).after( '<img class="radiothumb db-icon" src="'+ newthumb +'" data-target="#context-menu-radio">' );
						}
					} else {
						info( {
							  icon    : 'webradio'
							, title   : 'Change Coverart'
							, message : '<i class="fa fa-warning fa-lg"></i>&ensp;Upload image failed.'
						} );
					}
				} );
			} );
		}
	}
	if ( img ) {
		infojson.buttonlabel = 'Remove'
		infojson.button      = function() {
			$.post( 'commands.php', { bash: 'echo "'+ name +'" > "/srv/http/data/webradios/'+ urlname +'"' } );
			if ( GUI.playback ) {
				$( '#cover-art' ).attr( 'src', GUI.status.state === 'play' ? vu : vustop );
			} else {
				GUI.list.li.find( 'img' ).remove();
				GUI.list.li.find( '.lisort' ).after( '<i class="fa fa-webradio db-icon" data-target="#context-menu-webradio"></i>' );
			}
		}
	}
	info( infojson );
}
function webRadioDelete() {
	var name = GUI.list.name;
	var img = GUI.list.li.find( 'img' ).prop( 'src' );
	var url = GUI.list.path;
	var urlname = url.replace( /\//g, '|' );
	info( {
		  icon    : 'webradio'
		, title   : 'Delete Webradio'
		, width   : 500
		, message : ( img ? '<br><img src="'+ img +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
				   +'<br><w>'+ name +'</w>'
				   +'<br>'+ url
		, oklabel : 'Delete'
		, ok      : function() {
			if ( $( '#db-entries li' ).length === 1 ) $( '#db-home' ).click();
			$.post( 'commands.php', { webradios: name, url: url, delete: 1 } );
		}
	} );
}
function webRadioNew( name, url ) {
	info( {
		  icon         : 'webradio'
		, title        : 'Add Webradio'
		, width        : 500
		, message      : 'Add new Webradio:'
		, textlabel    : [ 'Name', 'URL' ]
		, textvalue    : [ ( name || '' ), ( url || '' ) ]
		, textrequired : [ 0, 1 ]
		, textalign    : 'center'
		, boxwidth     : 'max'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			var url = $( '#infoTextBox1' ).val();
			$.post( 'commands.php', { webradios: newname, url: url, new: 1 }, function( exist ) {
				if ( exist ) {
					var nameimg = exist.split( "\n" );
					info( {
						  icon    : 'webradio'
						, title   : 'Add Webradio'
						, message : ( nameimg[ 2 ] ? '<img src="'+ nameimg[ 2 ] +'">' : '<i class="fa fa-webradio bookmark"></i>' )
								   +'<br><w>'+ nameimg[ 0 ] +'</w>'
								   +'<br>'+ url
								   +'<br>Already exists.'
						, ok      : function() {
							webRadioNew( newname, url );
						}
					} );
				}
			} );
		}
	} );
}
function webRadioRename() {
	var name = GUI.list.name;
	var img = GUI.list.li.find( 'img' ).prop( 'src' );
	var url = GUI.list.path;
	var urlname = url.replace( /\//g, '|' );
	info( {
		  icon         : 'webradio'
		, title        : 'Rename Webradio'
		, width        : 500
		, message      : ( img ? '<br><img src="'+ img +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
						+'<br><w>'+ name +'</w>'
						+'<br>'+ url
						+'<br>To:'
		, textvalue    : name
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, oklabel      : 'Rename'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			$.post( 'commands.php', { webradios: newname, url: url, rename: 1 } );
		}
	} );
}
function webRadioSave( name, url ) {
	var urlname = url.replace( /\//g, '|' );
	var thumb = GUI.list.thumb;
	var img = GUI.list.img;
	$.post( 'commands.php', { bash: "test -e '/srv/http/data/webradios/"+ urlname +"' && echo 1" }, function( data ) {
		if ( data ) {
			var nameimg = data.split( "\n" );
			info( {
				  icon    : 'webradio'
				, title   : 'Save Webradio'
				, message : ( img ? '<br><img src="'+ img +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
						   +'<br><w>'+ name +'</w>'
						   +'<br>'+ url
						   +'<br>Already exists.'
			} );
			return false
		}
	} );
	info( {
		  icon         : 'webradio'
		, title        : 'Save Webradio'
		, width        : 500
		, message      : ( img ? '<br><img src="'+ img +'">' : '<br><i class="fa fa-webradio bookmark"></i>' )
						+'<br><w>'+ url +'</w>'
						+'<br>As:'
		, textlabel    : ''
		, textvalue    : name
		, textrequired : 0
		, textalign    : 'center'
		, boxwidth     : 'max'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			notify( 'Webradio saved', newname, 'webradio' );
			if ( thumb ) newname += "\n"+ thumb +"\n"+ img;
			$.post( 'commands.php', { webradios: newname, url: url, save: 1 } );
		}
	} );
}
