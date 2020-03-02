<?php
if ( isset( $_POST[ 'getjson' ] ) ) {
	$script = $_POST[ 'getjson' ];
	$output = exec( '/usr/bin/sudo '.$script );
	$json = str_replace( '\\', '', $output ); // remove escaped quotes
	$array = json_decode( $json, true );
	echo json_encode( $array, JSON_NUMERIC_CHECK );
	exit;
} else if ( isset( $_POST[ 'bash' ] ) ) {
	$bash = $_POST[ 'bash' ];
	$command = '';
	if ( !is_array( $bash ) ) $bash = [ $bash ];
	foreach( $bash as $cmd ) {
		$sudo = $cmd[ 0 ] === '/' ? '/usr/bin/sudo ' : '/usr/bin/sudo /usr/bin/';
		$command.= "$sudo$cmd;";
	}
	
	exec( $command, $output, $std );
	if ( $std !== 0 && $std !== 3 ) { // systemctl status: inactive $std = 3
		echo -1;
	} else {
		echo json_encode( $output, JSON_NUMERIC_CHECK );
	}
	if ( isset( $_POST[ 'pushstream' ] ) ) pushstream( 'notify', $_POST[ 'pushstream' ] );
	exit;
} else if ( isset( $_POST[ 'query' ] ) ) {
	$query = $_POST[ 'query' ];
	$type = $_POST[ 'type' ];
	$string = $_POST[ 'string' ] ?? null;
	if ( $query === 'list' ) {
		exec( 'mpc list '.$type.' "'.$string.'" | awk NF', $lists );
		$type = preg_replace( '/ .*/', '', $type ); // remove 2nd type list if any
		$each = ( object )[];  // or: new stdClass()
		foreach( $lists as $list ) {
			$each->$type = $list;
			$each->sort = stripLeading( $list );
			$array[] = $each;
			unset( $each );
		}
		usort( $array, function( $a, $b ) {
			return strnatcmp( $a->sort, $b->sort );
		} );
	} else {
		$sort = $_POST[ 'sort' ] ?? null;
		if ( isset( $_POST[ 'format' ] ) ) {
			$keys = $_POST[ 'format' ];
			foreach( $keys as $key ) {
				$format.= "%$key%^^";
			}
			$format = substr( $format, 0, -2 );
		} else {
			$format = '%album%^^%artist%^^%albumartist%^^%composer%^^%file%^^%genre%^^%time%^^%title%^^%track%';
		}
		exec( "mpc $query -f ".$format." ".$type." '".$string."' 2> /dev/null | awk '!a[$0]++'", $lists );
		$each = ( object )[];
		foreach( $lists as $list ) {
			$list = explode( '^^', $list );
			$each = new stdClass();
			$keysL = count( $keys );
			for ( $i = 0; $i < $keysL; $i++ ) {
				$key = $keys[ $i ];
				$each->$key = $list[ $i ];
			}
			if ( $sort ) $each->sort = stripLeading( $each->$sort );
			$array[] = $each;
			unset( $each );
		}
		if ( $sort ) {
			usort( $array, function( $a, $b ) {
				return strnatcmp( $a->sort, $b->sort );
			} );
		}
	}
	foreach( $array as $list ) {
		$index = $list->sort[ 0 ];
		$indexes[] = $index;
		$list->index = $index;
		unset( $list->sort );
	}
	$indexes = array_values( array_unique( $indexes ) );
	$flag = ( object )[];
	$flag->type = $type;
	$flag->indexes = $indexes;
	$array[] = $flag;
	
	echo json_encode( $array );
	exit;
}

$sudo = '/usr/bin/sudo /usr/bin';
$dirdisplay = '/srv/http/data/display';
$dirtmp = '/srv/http/data/tmp';
$dirwebradios = '/srv/http/data/webradios';
$format = '%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%';

if ( isset( $_POST[ 'bookmarks' ] ) ) {
	$name = $_POST[ 'bookmarks' ];
	$path = $_POST[ 'path' ];
	$pathname = str_replace( '/', '|', $path );
	$file = "/srv/http/data/bookmarks/$pathname";
	$order = getData( 'display/order' );
	if ( $order ) {
		$order = explode( '^^', $order );
		if ( !$name ) {
			$index = array_search( $path, $order );
			if ( $index !== false ) unset( $order[ $index ] );
		} else if ( !$oldname ) {
			$order[] = $path;
		}
		pushstream( 'display', [ 'order' => $order ] );
		$order = implode( '^^', $order );
		file_put_contents( "$dirdisplay/order", $order );
	}
	if ( isset( $_POST[ 'new' ] ) ) {
		if ( isset( $_POST[ 'base64' ] ) ) {
			$base64 = $_POST[ 'base64' ];
			file_put_contents( "$file", $base64 );
			pushstream( 'bookmark', json_encode( [ $path, $base64 ] ) );
			exit;
		} else {
			file_put_contents( "$file", $name );
		}
	} else if ( isset( $_POST[ 'rename' ] ) ) {
		file_put_contents( "$file", $name );
	} else if ( isset( $_POST[ 'delete' ] ) ) {
		unlink( $file );
	}
	pushstream( 'bookmark', json_encode( [ $path, $name ] ) );
	
} else if ( isset( $_POST[ 'color' ] ) ) { // hsl(360,100%,100%)
	$hsl = $_POST[ 'color' ];
	$h = $hsl[ 0 ];
	$s = $hsl[ 1 ];
	$l = $hsl[ 2 ];
	$hsg = "$h,3%,";
	$cmd = $sudo.'/sed -i "';
	$cmd.= '
		s|\(hsl(\).*\()/\*ch\*/\)|\1'."$h,$s%,".( $l + 5 ).'%\2|g
		s|\(hsl(\).*\()/\*c\*/\)|\1'."$h,$s%,$l%".'\2|g
		s|\(hsl(\).*\()/\*ca\*/\)|\1'."$h,$s%,".( $l - 10 ).'%\2|g
		s|\(hsl(\).*\()/\*cgh\*/\)|\1'.$hsg.'40%\2|g
		s|\(hsl(\).*\()/\*cg\*/\)|\1'.$hsg.'30%\2|g
		s|\(hsl(\).*\()/\*cga\*/\)|\1'.$hsg.'20%\2|g
		s|\(hsl(\).*\()/\*cdh\*/\)|\1'.$hsg.'30%\2|g
		s|\(hsl(\).*\()/\*cd\*/\)|\1'.$hsg.'20%\2|g
		s|\(hsl(\).*\()/\*cda\*/\)|\1'.$hsg.'10%\2|g
		s|\(hsl(\).*\()/\*cgl\*/\)|\1'.$hsg.'60%\2|g
	';
	$cmd.= '" $( grep -ril "\/\*c" /srv/http/assets/css )';
	exec( $cmd );
	if ( $h == 200 && $s == 100 && $l == 40 ) {
		@unlink( "$dirdisplay/color" );
	} else {
		file_put_contents( "$dirdisplay/color", "hsl($h,$s%,$l%)" );
	}
	pushstream( 'notify', [ 'reload' => 'all' ] );
	
} else if ( isset( $_POST[ 'counttag' ] ) ) {
	$path = $_POST[ 'counttag' ];
	$cmd = substr( $path, -3 ) === 'cue' ? 'playlist' : 'ls';
	$cmd.= ' "'.$path.'" | awk \'!a[$0]++\' | wc -l';
	$data = [ 
		  'artist'   => exec( 'mpc -f "%artist%" '.$cmd )
		, 'composer' => exec( 'mpc -f "%composer%" '.$cmd )
		, 'genre'    => exec( 'mpc -f "%genre%" '.$cmd )
	];
	echo json_encode( $data, JSON_NUMERIC_CHECK );
	
} else if ( isset( $_POST[ 'backuprestore' ] ) ) {
	$backupfile = '/srv/http/data/tmp/backup.xz';
	if ( $_POST[ 'backuprestore' ] === 'backup' ) {
		exec( "/srv/http/bash/backuprestore.sh backup backupfile" );
		// push backup file
	} else {
//		if ( $_FILES[ 'file' ][ 'type' ] !== 'xz' ) exit( 'File type not *.xz' );
		if ( $_FILES[ 'file' ][ 'error' ] != UPLOAD_ERR_OK ) exit( 'Upload file failed.' );
		
		move_uploaded_file( $_FILES[ 'file' ][ 'tmp_name' ], $backupfile );
//		exec( "/srv/http/bash/backuprestore.sh restore $file" );
//		unlink( $backupfile );
	}

} else if ( isset( $_POST[ 'getbookmarks' ] ) ) {
	$files = array_slice( scandir( '/srv/http/data/bookmarks' ), 2 );
	if ( !count( $files ) ) $data = 0;
	
	foreach( $files as $file ) {
		$content = file_get_contents( "/srv/http/data/bookmarks/$file" );
		$isimage = substr( $content, 0, 10 ) === 'data:image';
		if ( $isimage ) {
			$name = '';
			$coverart = $content;
		} else {
			$name = $content;
			$coverart = '';
		}
		$data[] = [
			  'name'     => $name
			, 'path'     => str_replace( '|', '/', $file )
			, 'coverart' => $coverart
		];
	}
	echo json_encode( $data );
	
} else if ( isset( $_POST[ 'getcount' ] ) ) {
	if ( exec( 'mpc | grep Updating' ) ) {
		$status = [ 'updating_db' => 1 ];
	} else {
		$count = exec( '/srv/http/bash/count.sh' );
		$count = explode( ' ', $count );
		$status = [
			  'artist'       => $count[ 0 ]
			, 'album'        => $count[ 1 ]
			, 'song'         => $count[ 2 ]
			, 'albumartist'  => $count[ 3 ]
			, 'composer'     => $count[ 4 ]
			, 'genre'        => $count[ 5 ]
			, 'nas'          => $count[ 6 ]
			, 'usb'          => $count[ 7 ]
			, 'webradio'     => $count[ 8 ]
			, 'sd'           => $count[ 9 ]
		];
	}
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	
} else if ( isset( $_POST[ 'getcover' ] ) ) {
	echo getCover( $_POST[ 'getcover' ] );
	
} else if ( isset( $_POST[ 'getdisplay' ] ) ) {
	$files = array_slice( scandir( $dirdisplay ), 2 );
	foreach( $files as $file ) {
		if ( $file === 'order' ) {
			$data[ 'order' ] = explode( '^^', getData( 'display/order' ) );
		} else {
			$data[ $file ] = 1;
		}
	}
	if ( exec( "$sudo/grep mixer_type /etc/mpd.conf | cut -d'\"' -f2" ) === 'none' ) $data[ 'volumenone' ] = 1;
	$data[ 'updating_db' ] = exec( 'mpc | grep Updating' ) ? 1 : 0;
	if ( file_exists( '/srv/http/data/addons/update' ) ) $data[ 'update' ] = getData( "addons/update" );
	if ( isset( $_POST[ 'data' ] ) ) {
		echo json_encode( $data, JSON_NUMERIC_CHECK );
	} else {
		pushstream( 'display', $data );
	}
	
} else if ( isset( $_POST[ 'getbootlog' ] ) ) {
	$logfile = '/srv/http/data/system/bootlog';
	if ( !file_exists( $logfile ) ) exec( "$sudo/journalctl -b | sed -n '1,/Startup finished.*kernel/ p' | grep -v 'is already registered' > $logfile" ); // omit bcm8235 driver error
	$lines = file( $logfile );
	$errors = preg_grep( '/Error:.*|Under-voltage/', $lines );
	$errors = count( $errors ) ? "<red>Warnings:</red>\n".implode( $errors )."<hr>\n" : '';
	$finished = preg_replace( '/.*Startup.*in/' , 'Startup:', end( $lines ) )."\n";
	echo $errors.$finished.implode( $lines );
	
} else if ( isset( $_POST[ 'getplaylist' ] ) ) { // list current/saved playlist page
	$name = $_POST[ 'getplaylist' ] ?? null;
	$data = ( object )[];
	if ( $name === 'playlist' ) {
		$data->lsplaylists = lsPlaylists();
		$data->playlist    = playlistInfo();
	} else if ( $name === 'lsplaylists' ) {
		$data = lsPlaylists();
	} else {
		$data = json_decode( file_get_contents( "/srv/http/data/playlists/$name" ) );
	}
	echo json_encode( $data );
	
} else if ( isset( $_POST[ 'getwebradios' ] ) ) {
	$files = array_slice( scandir( $dirwebradios ), 2 );
	if ( !count( $files ) ) {
		echo 0;
		exit;
	}
	
	foreach( $files as $file ) {
		$nameimg = file( "$dirwebradios/$file", FILE_IGNORE_NEW_LINES ); // name, base64thumbnail, base64image
		$name = $nameimg[ 0 ];
		$thumb = $nameimg[ 1 ] ? $nameimg[ 1 ] : '';
		$sort = stripLeading( $name );
/*		$li = ( object )[];
		$li->webradio = $name;
		$li->url      = str_replace( '|', '/', $file );
		$li->thumb    = $thumb;
		$li->sort     = $sort;
		$li->index    = $sort[ 0 ];
		$data[] = $li;*/
		$data[] = [
			  'webradio' => $name
			, 'url'      => str_replace( '|', '/', $file )
			, 'thumb'    => $thumb
			, 'sort'     => $sort
			, 'index'    => $sort[ 0 ]
		];
	}
	$data = sortData( $data );
	echo json_encode( $data );
	
} else if ( isset( $_POST[ 'imagefile' ] ) ) {
	$imagefile = $_POST[ 'imagefile' ];
	if ( isset( $_POST[ 'base64bookmark' ] ) ) {
		$file = "/srv/http/data/bookmarks/$imagefile";
		file_put_contents( $file, $_POST[ 'base64bookmark' ] );
		exit;
	} else if ( isset( $_POST[ 'base64webradio' ] ) ) {
		$file = "$dirwebradios/$imagefile";
		file_put_contents( $file, $_POST[ 'base64webradio' ] ) || exit( '-1' );
		exit;
	}
	
	// coverart or thumbnail
	$coverfile = isset( $_POST[ 'coverfile' ] );
	if ( $coverfile ) exec( "$sudo/mv -f '$imagefile'{,.backup}", $output, $std );
	if ( !isset( $_POST[ 'base64' ] ) ) { // delete
		exec( "$sudo/rm -f '$imagefile'", $output, $std );
		echo $std;
	} else {
		$tmpfile = "$dirtmp/tmp.jpg";
		file_put_contents( $tmpfile, base64_decode( $_POST[ 'base64' ] ) ) || exit( '-1' );
		if ( !$coverfile ) $imagefile = substr( $imagefile, 0, -3 ).'jpg'; // if existing is 'cover.svg'
		exec( "$sudo/mv -f $tmpfile '$imagefile'", $output, $std );
		echo $std;	
	}
	
} else if ( isset( $_POST[ 'loadplaylist' ] ) ) { // load saved playlist to current
	// load normal and individual cue tracks - use only file and track
	// 1. alternate cue <-> normal
	// 2. exec cumulative commands
	// 3. append commands while in the same type
	//   3.1  cue:
	//     change file extension to cue
	//     mpc --range=RANGE load mpd/path/file.cue (N = track# - 1)
	//     $RANGE = 'N0:N1'; - increment consecutive tracks to single command
	//     $RANGE = N;       - each track per command
	//   3.2  normal:
	//     echo -e $FILES | mpd add
	//     $FILES = 'mpd/path/file.ext\n'; - each track per line
	// 4. increment exec if cumulative commands reach limit to avoid errors
	
	if ( $_POST[ 'replace' ] ) exec( 'mpc clear' );
	
	$lines = file_get_contents( '/srv/http/data/playlists/'.$_POST[ 'loadplaylist' ] );
	$lines = json_decode( $lines );
	$list = $range = $fileprev = '';
	$track0prev = $trackprev = $i = $j = 0;
	foreach( $lines as $line ) {
		$file = $line->file;
		if ( property_exists( $line, 'Range' ) ) { // cue
			if ( $list ) { // alternate exec cumulative commands
				exec( 'echo -e "'.rtrim( $list, '\n' ).'" | mpc add' );
				$list = '';
				$i = 0;
			}
			$file = substr_replace( $file , 'cue', strrpos( $file , '.' ) + 1 ); // replace ext
			$track = $line->Track;
			if ( $track === $trackprev + 1 && $file === $fileprev ) {
				$track0 = $track0prev;
				$ranges = explode( ';', $range );
				array_pop( $ranges );
				$range = implode( ';', $ranges );
			} else {
				$track0 = $track - 1;
			}
			$rangetrack = $track0 === $track - 1 ? $track0 : "$track0:$track";
			$range.= ';mpc --range='.$rangetrack.' load "'.$file.'"';
			$track0prev = $track0;
			$trackprev = $track;
			$fileprev = $file;
			$j++;
			if ( $j === 100 ) { // limit exec commands length
				exec( ltrim( $range, ';' ) );
				$range = $fileprev = '';
				$track0prev = $trackprev = 0;
				$j = 0;
			}
		} else {
			if ( $range ) { // alternate exec cumulative commands
				exec( ltrim( $range, ';' ) );
				$range = $fileprev = '';
				$track0prev = $trackprev = $j = 0;
			}
			$list.= $file.'\n';
			$i++;
			if ( $i === 500 ) { // limit list commands length
				exec( 'echo -e "'.rtrim( $list, '\n' ).'" | mpc add' );
				$list = '';
				$i = 0;
			}
		}
	}
	if( $list ) exec( 'echo -e "'.rtrim( $list, '\n' ).'" | mpc add' );
	if ( $range ) exec( ltrim( $range, ';' ) );
	
	if ( $_POST[ 'play' ] ) exec( 'sleep 1; mpc play' );
	
} else if ( isset( $_POST[ 'login' ] ) ) {
	$hash = getData( 'system/password' );
	if ( !password_verify( $_POST[ 'login' ], $hash ) ) die();
	
	if ( isset( $_POST[ 'pwdnew' ] ) ) {
		$hash = password_hash( $_POST[ 'pwdnew' ], PASSWORD_BCRYPT, [ 'cost' => 12 ] );
		echo file_put_contents( '/srv/http/data/system/password', $hash );
	} else {
		echo 1;
		session_start();
		$_SESSION[ 'login' ] = 1;
	}
	
} else if ( isset( $_POST[ 'logout' ] ) ) {
	session_start();
	session_destroy();
	
} else if ( isset( $_POST[ 'mpc' ] ) ) {
	$mpc = $_POST[ 'mpc' ];
	if ( substr( $mpc, 0, 6 ) === 'mpc ls' ) { // parse if cue|m3u,|pls files else proceed
		$ls = chop( $mpc, ' | mpc add' );
		exec( $ls.' | grep ".cue$\|.m3u$\|.m3u8$\|.pls$"', $cuefiles );
		$cuecount = count( $cuefiles );
		if ( $cuecount ) {
			asort( $cuefiles );
			$data = [];
			foreach( $cuefiles as $file ) {
				$plfile = preg_replace( '/([&\[\]])/', '#$1', $file ); // escape literal &, [, ] in %file% (operation characters)
				exec(
					 'mpc -f '
					.'"'.$plfile.'^^%title%^^%time%^^%track%^^%artist%^^%album%^^%genre%^^%composer%^^%file%"'
					.' playlist "'.$file.'"'
					, $result
				);
				array_push( $data, ...list2array( $result ) ); // faster than array_merge
			}
			if ( count( $data ) ) {
				$data[][ 'coverart' ] = getCover( $data[ 0 ][ 'file' ] );
				echo json_encode( $data );
			} else {
				echo 0;
			}
			exit;
		}
	}
	// normal query (not cue)
	exec( $mpc, $result );
	if ( !count( $result ) ) {
		$name = $_POST[ 'name' ] ?? null;
		if ( $name ) {
			exec( 'mpc find -f '.$format.' album "'.$name.'"', $result );
			if ( !count( $result ) ) exit( '0' );
		}
	}
	if ( isset( $_POST[ 'list' ] ) ) {
		$type = $_POST[ 'list' ];
		if ( $type === 'file' ) {
			$data = list2arrayFile( $result );
			if ( $mpccmd !== 'search' ) $data[][ 'coverart' ] = getCover( $data[ 0 ][ 'file' ] );
		} else {
			foreach( $result as $list ) {
				$sort = stripLeading( $list );
				$datasort[] = [ 
					  $type   => $list
					, 'sort'  => $sort
					, 'index' => $sort[ 0 ]
				];
			}
			$data = sortData( $datasort );
		}
		echo json_encode( $data );
	}

} else if ( isset( $_POST[ 'mpcalbum' ] ) ) {
	$type = $_POST[ 'list' ];
	$path = $_POST[ 'path' ];
	exec( $_POST[ 'mpcalbum' ], $lines );
	if ( count( $lines ) === 1 ) {
		exec( 'mpc find -f '.$format.' '.$type .' "'.$path.'"', $lists );
		$data = list2arrayFile( $lists );
		$data[][ 'coverart' ] = getCover( $data[ 0 ][ 'file' ] );
	} else {
		foreach( $lines as $line ) {
			$list = explode( '^^', $line );
			$album = $list[ 0 ];
			$artist = $list[ 1 ];
			$artistalbum = $type === 'genre' ? $artist.'<gr> • </gr>'.$album : $album.'<gr> • </gr>'.$artist;
			$sort = stripLeading( $artistalbum );
			$data[] = [
				  'artistalbum' => $artistalbum
				, 'album'       => $album
				, 'artist'      => $artist
				, 'sort'        => $sort
				, 'index'       => $sort[ 0 ]
			];
		}
		$data = sortData( $data );
	}
	echo json_encode( $data );
	
} else if ( isset( $_POST[ 'savedplaylistedit' ] ) ) {
	$name = $_POST[ 'savedplaylistedit' ];
	$file = '/srv/http/data/playlists/'.$name;
	$contents = file_get_contents( $file );
	$list = json_decode( $contents );
	
	$remove = $_POST[ 'remove' ] ?? null;
	$index = $_POST[ 'index' ] ?? null;
	$indextarget = $_POST[ 'indextarget' ] ?? null;
	if ( $remove !== null ) {
		array_splice( $list, $remove, 1 );
	} else if ( $index !== null ) {
		$trackdata = playlistInfo( $index );
		if ( $indextarget === 'first' ) {
			array_unshift( $list, $trackdata[ 0 ] );
		} else if ( $indextarget === 'last' ) {
			$list[] = $trackdata[ 0 ];
		} else {
			array_splice( $list, $indextarget, 0, $trackdata );
		}
	} else {
		$data = array_splice( $list, $_POST[ 'old' ], 1 );
		array_splice( $list, $_POST[ 'new' ], 0, $data );
	}
	$newlist = json_encode( $list, JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT );
	file_put_contents( $file, $newlist );
	pushstream( 'playlist', [ 'savedplaylist' => $name ] );
	
} else if ( isset( $_POST[ 'saveplaylist' ] ) ) {
	$file = '/srv/http/data/playlists/'.$_POST[ 'saveplaylist' ];
	if ( isset( $_POST[ 'delete' ] ) ) {
		unlink( $file );
	} else {
		if ( !file_exists( $file ) ) {
			$list = json_encode( playlistInfo(), JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT );
			file_put_contents( $file, $list );
			pushstream( 'playlist', lsPlaylists() );
		} else {
			echo -1;
		}
	}
	
} else if ( isset( $_POST[ 'screenoff' ] ) ) {
	exec( "DISPLAY=:0 $sudo/xset dpms force off" );
	
} else if ( isset( $_POST[ 'setdisplay' ] ) ) {
	$data = $_POST[ 'setdisplay' ];
	if ( $data[ 0 ] === 'library' ) {
		$filelist = '{album,artist,albumartist,composer,coverart,genre,nas,sd,usb,webradio,count,label,plclear,playbackswitch,tapaddplay,tapreplaceplay,thumbbyartist}';
	} else {
		$filelist = '{bars,barsauto,buttons,cover,coverlarge,radioelapsed,time,volume}';
	}
	exec( "/usr/bin/rm -f $dirdisplay/$filelist" );
	pushstream( 'display', $data );
	array_shift( $data );
	foreach( $data as $item ) {
		file_put_contents( "$dirdisplay/".$item, 1 );
	}
	
} else if ( isset( $_POST[ 'setorder' ] ) ) {
	$order = $_POST[ 'setorder' ]; 
	file_put_contents( "$dirdisplay/order", $order );
	$order = json_encode( explode( '^^', $order ) );
	pushstream( 'display', [ 'order' => $order ] );
	
} else if ( isset( $_POST[ 'volume' ] ) ) {
	$volume = $_POST[ 'volume' ];
	$volumemute = getData( 'display/volumemute' );
	if ( $volume == 'setmute' ) {
		if ( $volumemute == 0 ) {
			$currentvol = exec( "mpc volume | tr -d ' %' | cut -d':' -f2" );
			$vol = 0;
		} else {
			$currentvol = 0;
			$vol = $volumemute;
		}
	} else {
		$currentvol = 0;
		$vol = $volume;
	}
	exec( "$sudo/mpc volume $vol" );
	file_put_contents( "$dirdisplay/volumemute", $currentvol );
	pushstream( 'volume', [ $vol, $currentvol ] );
	
} else if ( isset( $_POST[ 'webradios' ] ) ) {
	$name = $_POST[ 'webradios' ];
	$urlname = str_replace( '/', '|', $_POST[ 'url' ] );
	$file = "$dirwebradios/$urlname";
	if ( ( isset( $_POST[ 'new' ] ) || isset( $_POST[ 'save' ] ) ) 
		&& file_exists( $file )
	) {
		echo file_get_contents( $file );
		exit;
	}
	
	if ( isset( $_POST[ 'new' ] ) ) {
		file_put_contents( "$dirwebradios/$urlname", $name );
		$count = 1;
	} else if ( isset( $_POST[ 'edit' ] ) ) {
		$content = file( $file, FILE_IGNORE_NEW_LINES );
		$urlnamenew = str_replace( '/', '|', $_POST[ 'newurl' ] );
		if ( count( $content ) > 1 ) $name.= "\n".$content[ 1 ]."\n".$content[ 2 ];
		@unlink( $file );
		file_put_contents( "$dirwebradios/$urlnamenew", $name ); // name, thumbnail, coverart
		$count = 0;
	} else if ( isset( $_POST[ 'delete' ] ) ) {
		unlink( $file );
		$count = -1;
	}
	pushstream( 'webradio', $count );
	
}

function curlGet( $url ) {
	$ch = curl_init( $url );
	curl_setopt( $ch, CURLOPT_CONNECTTIMEOUT_MS, 400 );
	curl_setopt( $ch, CURLOPT_TIMEOUT, 10 );
	curl_setopt( $ch, CURLOPT_HEADER, 0 );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
	$response = curl_exec( $ch );
	curl_close( $ch );
	return $response;
}
function getCover( $file ) {
	return shell_exec( '/srv/http/bash/getcover.sh "/mnt/MPD/'.$file.'"' );
}
function getData( $type_file ) {
	return trim( @file_get_contents( "/srv/http/data/$type_file" ) );
}
function list2array( $lists ) {
// 0-file, 1-title, 2-time, 3-track, 4-artist, 5-album, 6-genre, 7-composer, 8-cuefile
	$artist = $album = $genre = $composer = '';
	foreach( $lists as $list ) {
		$list = explode( '^^', rtrim( $list ) );
		if ( !$artist && $list[ 4 ] !== '' ) $artist = $list[ 4 ];
		if ( !$album && $list[ 5 ] !== '' ) $album = $list[ 5 ];
		if ( !$genre ) {
			if ( $list[ 6 ] !== '' ) $genre = $list[ 6 ];
		} else {
			if ( $list[ 6 ] !== $genre ) $genre = -1;
		}
		if ( !$composer && $list[ 7 ] !== '' ) $composer = $list[ 7 ];
		$file = $list[ 0 ];
		$li = [
			  'file'   => $file
			, 'Title'  => $list[ 1 ]
			, 'Time'   => $list[ 2 ]
			, 'track'  => preg_replace( '/^#*0*/', '', $list[ 3 ] )
			, 'Artist' => $list[ 4 ]
			, 'Album'  => $list[ 5 ]
		];
		if ( isset( $list[ 8 ] ) ) $li[ 'ext' ] = pathinfo( $list[ 8 ], PATHINFO_EXTENSION );
		$data[] = $li;
	}
	if ( substr( $file, 0, 4 ) !== 'http' ) {
		$data[][ 'artist' ] = $artist;
		$data[][ 'album' ] = $album;
		if ( $genre ) $data[][ 'genre' ] = $genre;
		if ( $composer ) $data[][ 'composer' ] = $composer;
	}
	return $data;
}
function list2arrayFile( $lists ) { // directories or files
	$genre = $composer = $albumartist = '';
	foreach( $lists as $list ) {
		$root = in_array( explode( '/', $list )[ 0 ], [ 'USB', 'NAS', 'SD' ] );
		if ( $root ) {
			$ext = pathinfo( $list, PATHINFO_EXTENSION );
			if ( in_array( $ext, [ 'cue', 'm3u', 'm3u8', 'pls' ] ) ) {
				$data[] = [
					  'playlist' => basename( $list )
					, 'filepl'   => $list
				];
			} else {
				$sort = stripLeading( basename( $list ) );
				$data[] = [
					  'directory' => $list
					, 'sort'      => $sort
					, 'index'     => $sort[ 0 ]
				];
			}
		} else {
			$list = explode( '^^', $list );
			$file = $list[ 4 ];
			$data[] = [
				  'Title'  => $list[ 0 ] ?: '<gr>*</gr>'.pathinfo( $file, PATHINFO_FILENAME )
				, 'Time'   => $list[ 1 ]
				, 'Artist' => $list[ 2 ]
				, 'Album'  => $list[ 3 ]
				, 'file'   => $file
			];
			if ( !$genre && $list[ 5 ] !== '' ) $genre = $list[ 5 ];
			if ( !$composer && $list[ 6 ] !== '' ) $composer = $list[ 6 ];
			if ( !$albumartist && $list[ 7 ] !== '' ) $albumartist = $list[ 7 ];
		}
	}
	if ( $root ) $data = sortData( $data );
	$data[][ 'artist' ] = $data[ 0 ][ 'Artist' ] ?? '';
	$data[][ 'album' ] = $data[ 0 ][ 'Album' ] ?? '';
	$data[][ 'albumartist' ] = $albumartist ?: $data[ 0 ][ 'Artist' ] ?? '';
	if ( $genre ) $data[][ 'genre' ] = $genre;
	if ( $composer ) $data[][ 'composer' ] = $composer;
	return $data;
}
function lsPlaylists() {
	$lines = array_slice( scandir( '/srv/http/data/playlists' ), 2 );
	if ( !count( $lines ) ) return 0;
	
	foreach( $lines as $line ) {
		$sort = stripLeading( $line );
		$data[] = [
			  'name'   => $line
			, 'sort'   => $sort
			, 'index'  => $sort[ 0 ]
		];
	}
	$data = sortData( $data );
	return $data;
}
function playlistInfo( $index = '' ) { // current playlist
	exec( // 2nd sleep: varied with length, 1000track/0.1s
		 '{ sleep 0.05; echo playlistinfo '.$index.'; sleep $( awk "BEGIN { printf \"%.1f\n\", $( mpc playlist | wc -l ) / 10000 + 0.1 }" ); }'
		.' | telnet 127.0.0.1 6600'
		.' | sed -n "/^Album\|^AlbumArtist:\|^Artist\|^file\|^Range\|^Time\|^Title\|^Track/ p"'
		, $lines
	);
	if ( !count( $lines ) ) return '';
	
	foreach( $lines as $line ) {
		$data = strtok( $line, "\n" );
		while ( $data !== false ) {
			$pair = explode( ': ', $data );
			switch( $pair[ 0 ] ) {
				case 'Album':  $Album  = $pair[ 1 ]; break;
				case 'Artist': $Artist = $pair[ 1 ]; break;
				case 'file':   $file   = $pair[ 1 ]; break;
				case 'Range':  $Range  = $pair[ 1 ]; break;
				case 'Title':  $Title  = $pair[ 1 ]; break;
				case 'Track':  $Track  = intval( $pair[ 1 ] ); break;
				case 'Time': // last line of each song
					$Time = second2HMS( $pair[ 1 ] );
					if ( substr( $file, 0, 4 ) === 'http' ) {
						$filename = str_replace( '/', '|', $file );
						$Title = file( "/srv/http/data/webradios/$filename", FILE_IGNORE_NEW_LINES )[ 0 ];
					}
					$item = ( object )[];
					if ( isset( $Artist ) ) $item->Artist = $Artist;
					if ( isset( $Title ) )  $item->Title  = $Title ?? pathinfo( $file, PATHINFO_FILENAME );
					if ( isset( $Album ) )  $item->Album  = $Album;
					if ( isset( $file ) )   $item->file   = $file;
					if ( isset( $Time ) )   $item->Time   = $Time;
					if ( isset( $Track ) )  $item->Track  = $Track;
					if ( isset( $Range ) )  $item->Range  = $Range;
					$list[] = $item;
					$Album = $Artist = $AlbumArtist = $file = $Range = $Title = $Track = $Time = '';
					break;
			}
			$data = strtok( "\n" );
		}
	}
	return $list;
}
function pushstream( $channel, $data ) {
	$ch = curl_init( 'http://127.0.0.1/pub?id='.$channel );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, [ 'Content-Type:application/json' ] );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( $data, JSON_NUMERIC_CHECK ) );
	curl_exec( $ch );
	curl_close( $ch );
}
function second2HMS( $second ) {
	if ( $second <= 0 ) return 0;
	
	$second = round( $second );
	$hh = floor( $second / 3600 );
	$mm = floor( ( $second % 3600 ) / 60 );
	$ss = $second % 60;
	
	$hh = $hh ? $hh.':' : '';
	$mm = $hh ? ( $mm > 9 ? $mm.':' : '0'.$mm.':' ) : ( $mm ? $mm.':' : '' );
	$ss = $mm ? ( $ss > 9 ? $ss : '0'.$ss ) : $ss;
	return $hh.$mm.$ss;
}
function sortData( $data ) {
	usort( $data, function( $a, $b ) {
		return strnatcmp( $a[ 'sort' ], $b[ 'sort' ] );
	} );
	$dataL = count( $data );
	for( $i = 0; $i < $dataL; $i++ ) {
		$indexes[] = $data[ $i ][ 'sort' ][ 0 ];
		unset( $data[ $i ][ 'sort' ] );
	}
	$data[][ 'indexes' ] = array_keys( array_flip( $indexes ) ); // faster than array_unique
	return $data;
}
function stripLeading( $string ) {
	$names = strtoupper( strVal( $string ) ); // strVal make all as string for strtoupper
	return preg_replace(
		  [ '/^A\s+|^AN\s+|^THE\s+|[^\w\p{L}\p{N}\p{Pd} ~]/u',
			'/\s+|^_/'
		  ]
		, [ '',  // strip articles | non utf-8 normal alphanumerics | tilde(blank data)
			'-'  // fix: php strnatcmp ignores spaces | sort underscore to before 0
		  ]
		, $names
	);
}
