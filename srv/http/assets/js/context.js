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
			$( '#pl-entries li' ).eq( G.list.li.index() ).click();
		} else {
			$( '#'+ cmd ).click();
		}
		return
	}
	
	if ( cmd === 'update' ) {
		G.list.li.find( '.db-icon' ).addClass( 'blink' );
		$.post( 'commands.php', { bash: 'mpc update "'+ G.list.path +'"' } );
	} else if ( cmd === 'tag' ) {
		$.post( 'commands.php', { counttag: G.list.path }, function( counts ) {
			tag( counts );
		}, 'json' );
	} else if ( cmd === 'remove' ) {
		G.contextmenu = 1;
		setTimeout( function() { G.contextmenu = 0 }, 500 );
		removeFromPlaylist( G.list.li );
	} else if ( cmd === 'savedpladd' ) {
		info( {
			  icon    : 'list-ul'
			, title   : 'Add to playlist'
			, message : 'Open target playlist to add:'
					   +'<br><w>'+ G.list.name +'</w>'
			, ok      : function() {
				G.pladd.index = G.list.li.index();
				G.pladd.name = G.list.name;
				$( '#plopen' ).click();
			}
		} );
	} else if ( cmd === 'savedplremove' ) {
		var plname = $( '#pl-currentpath .lipath' ).text();
		var plline = G.list.li.index();
		$.post( 'commands.php', { savedplaylistedit: plname, remove: plline } );
		G.list.li.remove();
	} else if ( cmd === 'similar' ) {
		notify( 'Playlist Add Similar', '<span class="blink">Fetcthing list...</span>', 'list-ul', -1 );
		$.ajax( {
			  type     : 'post'
			, url      : 'http://ws.audioscrobbler.com/2.0/'
			, data     : { 
				  api_key     : G.apikeylastfm
				, autocorrect : 1
				, format      : 'json'
				, method      : 'track.getsimilar'
				, artist      : G.list.artist
				, track       : G.list.name
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
				
				G.similarpl = G.status.playlistlength;
				$.each( similartracks, function( i, val ) {
					$.post( 'commands.php', { mpc : 'mpc findadd artist "'+ val.artist.name +'" title "'+ val.name +'"' }, function() {
						$( '#bannerMessage' ).html( 'Find '+ ( i + 1 ) +'/'+ tracklength +' in Library ...' );
					} );
				} );
				if ( submenu ) $.post( 'commands.php', { mpc : 'mpc play' } );
			}
		} );
	} else if ( cmd === 'exclude' ) {
		var path = G.list.path.split( '/' );
		var dir = path.pop();
		var mpdpath = path.join( '/' );
		var pathfile = '/mnt/MPD/'+ mpdpath +'/.mpdignore';
		G.local = 1;
		setTimeout( function() { G.local = 0 }, 2000 );
		$.post( 'commands.php', { bash: [
			  "echo '"+ dir +"' | /usr/bin/sudo /usr/bin/tee -a '"+ pathfile +"'"
			, 'mpc update "'+ mpdpath +'"' // get .mpdignore into database
			, 'mpc update "'+ mpdpath +'"' // after .mpdignore was in database
		] }, function() {
			G.list.li.remove();
		} );
		notify( 'Exclude Directory', '<wh>'+ dir +'</wh> excluded from database.', 'folder' );
	}
	if ( [ 'savedpladd', 'savedplremove', 'similar', 'tag', 'remove', 'update' ].indexOf( cmd ) !== -1 ) return
	
	// functions with dialogue box ////////////////////////////////////////////
	var contextFunction = {
		  bookmark   : bookmarkNew
		, plrename   : playlistRename
		, pldelete   : playlistDelete
		, thumbnail  : updateThumbnails
		, wrcoverart : webRadioCoverart
		, wrdelete   : webRadioDelete
		, wredit     : webRadioEdit
	}
	if ( cmd in contextFunction ) {
		contextFunction[ cmd ]();
		return
	}
	
	// replaceplay|replace|addplay|add //////////////////////////////////////////
	var name = ( G.browsemode === 'coverart' && !G.list.isfile ) ? G.list.name : G.list.path;
	name = name.replace( /"/g, '\\"' );
	// compose command
	var mpcCmd;
	// must keep order otherwise replaceplay -> play, addplay -> play
	var mode = cmd.replace( /replaceplay|replace|addplay|add/, '' );
	if ( [ 'album', 'artist', 'composer', 'genre' ].indexOf( G.list.mode ) !== -1 ) {
		var artist = G.list.artist;
		mpcCmd = 'mpc findadd '+ G.list.mode +' "'+ name +'"'+ ( artist ? ' artist "'+ artist +'"' : '' );
	} else if ( !mode ) {
		var ext = name.slice( -3 );
		if ( G.list.isfile ) {
			if ( ext === 'cue' ) { // cue: individual with 'pc --range=N load file.cue'
				mpcCmd = 'mpc --range='+ ( G.list.track - 1 ) +' load "'+ name +'"';
			} else {
				mpcCmd = 'mpc add "'+ name +'"';
			}
		} else {
			mpcCmd = 'mpc load "'+ name +'"';
		}
	} else if ( mode === 'wr' ) {
		cmd = cmd.slice( 2 );
		mpcCmd = 'mpc add "'+ G.list.path.replace( /"/g, '\\"' ) +'"';
	} else if ( mode === 'pl' ) {
		cmd = cmd.slice( 2 );
		if ( G.library ) {
			mpcCmd = 'mpc load "'+ name +'"';
		} else { // saved playlist
			var play = cmd.slice( -1 ) === 'y' ? 1 : 0;
			var replace = cmd.slice( 0, 1 ) === 'r' ? 1 : 0;
			if ( replace && 'plclear' in G.display && G.status.playlistlength ) {
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
	var sleep = G.list.path.slice( 0, 4 ) === 'http' ? 1 : 0.2;
	var contextCommand = {
		  add         : mpcCmd
		, addplay     : [ mpcCmd, 'sleep '+ sleep, 'mpc play $(( $( mpc playlist | wc -l ) + 1 ))' ]
		, replace     : [ 'mpc clear', mpcCmd ]
		, replaceplay : [ 'mpc clear', mpcCmd, 'sleep '+ sleep, 'mpc play' ]
	}
	if ( cmd in contextCommand ) {
		var command = contextCommand[ cmd ];
		if ( [ 'add', 'addplay' ].indexOf( cmd ) !== -1 ) {
			var msg = 'Add to Playlist'+ ( cmd === 'add' ? '' : ' and play' )
			addReplace( cmd, command, msg );
		} else {
			var msg = 'Replace playlist'+ ( cmd === 'replace' ? '' : ' and play' )
			if ( 'plclear' in G.display && G.status.playlistlength ) {
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
	var playbackswitch = 'playbackswitch' in G.display && ( cmd === 'addplay' || cmd === 'replaceplay' );
	$.post( 'commands.php', { bash: command }, function() {
		if ( playbackswitch ) {
			$( '#tab-playback' ).click();
		} else {
			if ( cmd === 'replace' ) G.plreplace = 1;
			if ( G.list.li.hasClass( 'licover' ) ) {
				var msg = G.list.li.find( '.lialbum' ).text()
						+'<a class="li2">'+ G.list.li.find( '.liartist' ).text() +'</a>';
			} else if ( G.list.li.find( '.li1' ).length ) {
				var msg = G.list.li.find( '.li1' )[ 0 ].outerHTML
						+ G.list.li.find( '.li2' )[ 0 ].outerHTML;
				msg = msg.replace( '<bl>', '' ).replace( '</bl>', '' );
			} else {
				var msg = G.list.li.find( '.lipath' ).text();
			}
			getPlaybackStatus();
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
			G.bookmarkedit = 1;
			$.post( 'commands.php', { bookmarks: name, path: path, delete: 1 } );
			$block.parent().remove();
		}
	} );
}
function bookmarkNew() {
	var path = G.list.path;
	var name = path.split( '/' ).pop();
	var $el = $( '.home-bookmark' );
	if ( $el.length ) {
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
	}
	
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
				G.lsplaylists.length++;
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
				   +'<br><w>'+ G.list.name +'</w>'
		, oklabel : 'Delete'
		, ok      : function() {
			var count = $( '#pls-count' ).text() - 1;
			if ( count ) $( '#pls-count' ).text( numFormat( count ) );
			G.list.li.remove();
			$.post( 'commands.php', { saveplaylist: G.list.name.replace( /"/g, '\\"' ), delete: 1 }, function(data) {
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
	var name = G.list.name;
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
			G.list.li.find( '.plname' ).text( newname );
		}
	} );
}
function tag( counts ) {
	var cue = G.list.path.split( '.' ).pop() === 'cue';
	var cmd = 'mpc -f "%artist%^^%albumartist%^^%album%^^%composer%^^%genre%^^%title%^^%track%^^%file%" ';
	if ( !cue ) {
		cmd += 'ls "'+ G.list.path +'" 2> /dev/null | head -1';
	} else {
		cmd += 'playlist "'+ G.list.path +'"';
		var track = G.list.index;
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
		if ( G.list.isfile ) {
			labels.push(
				  '<i class="fa fa-music wh"></i>'
				, '<i class="fa fa-hash wh"></i>'
			);
			values.push( tags[ 5 ], tags[ 6 ] );
			var message = '<i class="fa fa-file-music wh"></i> '+ ( cue ? G.list.path : file ) +'<br>&nbsp;'
			var pathfile = '"/mnt/MPD/'+ file +'"';
		} else {
			var message = '<img src="'+ $( '.licoverimg img' ).attr( 'src' ) +'" style="width: 50px; height: 50px;">'
						 +'<br><i class="fa fa-folder wh"></i>'+ ( cue ? G.list.path : path ) +'<br>&nbsp;'
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
				if ( cue && G.list.isfile ) {
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
					var                         sed = "sed -i"
													  +" -e '/^PERFORMER/ d'"
													  +" -e '/^REM COMPOSER/ d'"
													  +" -e '/^REM GENRE/ d'";
					if ( artist !== various )   sed += " -e 's/^\\s\\+PERFORMER.*/    PERFORMER \""+ artist +"\"/'";
					if ( albumartist )          sed += " -e '/^TITLE/ i\\PERFORMER \""+ albumartist +"\"'";
					if ( album )                sed += " -e 's/^TITLE.*/TITLE \""+ album +"\"/'";
					if ( composer !== various ) sed += " -e '1 i\\REM COMPOSER \""+ composer +"\"'";
					if ( genre !== various )    sed += " -e '1 a\\REM GENRE \""+ genre +"\"'";
					
					if ( G.list.isfile )      sed += " -e '/^\\s\\+TRACK "+ track +"/ {"
														+' n;  s/^\\s\\+TITLE.*/    TITLE "'+ title +'"/'
														+';n;  s/^\\s\\+PERFORMER.*/    PERFORMER "'+ artist +'"/'
														+"}'";
												
												sed += " '/mnt/MPD/"+ G.list.path +"'";
					var cmd = [ sed, 'mpc update "'+ G.list.path.substr( 0, file.lastIndexOf( '/' ) ) +'"' ];
				}
				$.post( 'commands.php', { bash: cmd } );
				// local fields update
				if ( G.list.isfile ) {
					G.list.li.find( '.name' ).text( title );
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
	var path = '&quot;/mnt/MPD/'+ G.list.path.replace( /"/g, '\"' ) +'&quot;';
	info( {
		  icon     : 'coverart'
		, title    : 'Coverart Thumbnails Update'
		, message  : 'Update thumbnails in:'
					+'<br><w>'+ G.list.path +'</w>'
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
	var urlname = G.list.path.replace( /\//g, '|' );
	var img = 'li' in G.list ? G.list.li.find( 'img' ).prop( 'src' ) : '';
	var name = G.list.name;
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
						if ( G.playback ) {
							$( '#cover-art' ).attr( 'src', newimg );
						} else {
							G.list.li.find( '.db-icon' ).remove();
							G.list.li.find( '.liname' ).after( '<img class="radiothumb db-icon" src="'+ newthumb +'" data-target="#context-menu-radio">' );
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
			if ( G.playback ) {
				$( '#cover-art' ).attr( 'src', G.status.state === 'play' ? vu : vustop );
			} else {
				G.list.li.find( 'img' ).remove();
				G.list.li.find( '.liname' ).after( '<i class="fa fa-webradio db-icon" data-target="#context-menu-webradio"></i>' );
			}
		}
	}
	info( infojson );
}
function webRadioDelete() {
	var name = G.list.name;
	var img = G.list.li.find( 'img' ).prop( 'src' );
	var url = G.list.path;
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
function webRadioEdit() {
	var name = G.list.name;
	var img = G.list.li.find( 'img' ).prop( 'src' );
	var url = G.list.path;
	var urlname = url.replace( /\//g, '|' );
	info( {
		  icon         : 'webradio'
		, title        : 'Edit Webradio'
		, width        : 500
		, message      : ( img ? '<img src="'+ img +'">' : '<i class="fa fa-webradio bookmark"></i>' )
		, textlabel    : [ 'Name', 'URL' ]
		, textvalue    : [ name, url ]
		, textrequired : [ 0, 1 ]
		, boxwidth     : 'max'
		, oklabel      : 'Save'
		, ok           : function() {
			var newname = $( '#infoTextBox' ).val();
			var newurl = $( '#infoTextBox1' ).val().replace( /\/\s*$/, '' ); // omit trailling / and space
			if ( newname !== name || newurl !== url ) $.post( 'commands.php', { webradios: newname, newurl: newurl, url: url, edit: 1 } );
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
			var newname = $( '#infoTextBox' ).val().replace( /\/\s*$/, '' ); // omit trailling / and space
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
function webRadioSave( name, url ) {
	var urlname = url.replace( /\//g, '|' );
	var thumb = G.list.thumb;
	var img = G.list.img;
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
