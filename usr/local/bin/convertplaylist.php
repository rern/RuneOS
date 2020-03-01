<?php
// convert saved playlist to json format
$files = array_slice( scandir( '/srv/http/data/playlists' ), 2 );
foreach( $files as $file ) {
	$filepath = "/srv/http/data/playlists/$file";
	$lines = file( $filepath, FILE_IGNORE_NEW_LINES );
	if ( $lines[ 0 ] === '[' ) exit; // already in json format
	
	foreach( $lines as $line ) {
		$line = str_replace( ' • ', '^^', $line );
		$list = explode( '^^', $line );
		if ( count( $list ) > 6 ) {
			$mpdfile  = $list[ 10 ];
			$Range = $list[ 11 ];
		} else {
			$mpdfile  = $list[ 0 ];
			$Range = 0;
		}
		$li = ( object )[];
		$li->Artist = $list[ 4 ] ?? '';
		$li->Title  = $list[ 1 ] ?? '';
		$li->Album  = $list[ 5 ] ?? '';
		$li->file   = $mpdfile;
		$li->Time   = $list[ 2 ];
		$li->Track  = isset( $list[ 3 ] ) ? str_replace( '#', '', $list[ 3 ] ) : '';
		if ( $Range ) $li->Range = $Range;
		$data[] = $li;
	}
	$json = json_encode( $data, JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT );
	file_put_contents( $filepath, $json );
}
