<?php
$sudo = '/usr/bin/sudo /usr/bin/';
$statusonly = isset( $_POST[ 'statusonly' ] );
$activeplayer = 'MPD';

// grep cannot be used here
$mpdtelnet = ' | telnet 127.0.0.1 6600 2> /dev/null | sed "/^Trying\|^Connected\|^Escape\|^OK\|^Connection\|^Date\|^Last-Modified\|^mixrampdb\|^nextsong\|^nextsongid/ d"';
$lines = shell_exec( '{ sleep 0.05; echo clearerror; echo status; echo currentsong; sleep 0.05; }'.$mpdtelnet );
// fix: initially add song without play - currentsong = (blank)
if ( strpos( $lines, 'file:' ) === false ) $lines = shell_exec( '{ sleep 0.05; echo status; echo playlistinfo 0; sleep 0.05; }'.$mpdtelnet );

$line = strtok( $lines, "\n" );
while ( $line !== false ) {
	$pair = explode( ': ', $line, 2 );
	$key = $pair[ 0 ];
	$val = $pair[ 1 ];
	if ( $key === 'audio' ) {
		$audio = explode( ':', $val );
		$status[ 'bitdepth' ] = $audio[ 1 ];
		$status[ 'samplerate' ] = $audio[ 0 ];
	} else if ( $key === 'bitrate' ) {
		$status[ $key ] = $val * 1000;
	} else if ( $key === 'elapsed' ) {
		$status[ $key ] = round( $val );
	} else {
		$status[ $key ] = trim( $val );
	}
	$line = strtok( "\n" );
}
if ( !isset( $status[ 'song' ] ) ) $status[ 'song' ] = 0;
$status[ 'updating_db' ] = isset( $status[ 'updating_db' ] ) ? 1 : 0;

if ( !$statusonly ) {
	$mpdactive = exec( "$sudo/systemctl is-active mpd" );
	$airplayactive = exec( "$sudo/systemctl is-active shairport-sync" );
	if ( $mpdactive === 'inactive' && $airplayactive === 'active' ) $activeplayer = 'AirPlay';
	$status[ 'activeplayer' ] = $activeplayer;
	if ( $activeplayer === 'AirPlay' ) {
		$status[ 'Artist'] = getData( 'tmp/airplayArtist' );
		$status[ 'Title'] = getData( 'tmp/airplayTitle' );
		$status[ 'Album'] = getData( 'tmp/airplayAlbum' );
		$status[ 'sampling'] = '16 bit • 44.1 kHz 1.41 Mbit/s';
		$status[ 'ext'] = 'AirPlay';
		$file = '/srv/http/data/tmp/airplaycoverart';
		if ( file_exists( $file ) ) $status[ 'coverart' ] = file_get_contents( $file );
		echo json_encode( $status, JSON_NUMERIC_CHECK );
		exit();
	}
	$status[ 'volumemute' ] = getData( 'display/volumemute' );
}
$status[ 'librandom' ] = exec( "$sudo/systemctl is-active libraryrandom" ) === 'active' ? 1 : 0;

if ( !isset( $status[ 'playlistlength' ] ) || !$status[ 'playlistlength' ] ) {
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	exit();
}

$statusfile = $status[ 'file' ];
$file = "/mnt/MPD/$statusfile";
$pathinfo = pathinfo( $file );
$ext = substr( $statusfile, 0, 4 ) !== 'http' ? strtoupper( $pathinfo[ 'extension' ] ) : 'radio';
$radio = $ext === 'radio';
$status[ 'ext' ] = $ext;
if ( !$radio ) {
	// missing id3tags
	if ( empty( $status[ 'Artist' ] ) ) $status[ 'Artist' ] = end( explode( '/', $pathinfo[ 'dirname' ] ) );
	if ( empty( $status[ 'Title' ] ) ) $status[ 'Title' ] = $pathinfo[ 'filename' ];
	if ( empty( $status[ 'Album' ] ) ) $status[ 'Album' ] = '';
} else {
	// before webradios play: no 'Name:' - use station name from file instead
	if ( isset( $status[ 'Name' ] ) ) {
		$status[ 'Artist' ] = $status[ 'Name' ];
	} else {
		$urlname = str_replace( '/', '|', $statusfile );
		$webradiofile = "/srv/http/data/webradios/$urlname";
		$status[ 'Artist' ] = file( $webradiofile )[ 0 ];
	}
	$status[ 'Title' ] = ( $status[ 'state' ] === 'stop' ) ? '' : $status[ 'Title' ];
	$status[ 'Album' ] = $statusfile;
	$status[ 'time' ] = '';
}

$previousartist = isset( $_POST[ 'artist' ] ) ? $_POST[ 'artist' ] : '';
$previousalbum = isset( $_POST[ 'album' ] ) ? $_POST[ 'album' ] : '';
if ( $statusonly
	|| !$status[ 'playlistlength' ]
	|| ( $status[ 'Artist' ] === $previousartist && $status[ 'Album' ] === $previousalbum )
	&& !$radio
) {
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	exit();
}

// coverart
if ( !$radio && $activeplayer === 'MPD' ) {
	$status[ 'coverart' ] = shell_exec( '/srv/http/getcover.sh "'.$file.'"' );
} else if ( $radio ) {
	$status[ 'coverart' ] = 0;
	$filename = str_replace( '/', '|', $statusfile );
	$file = "/srv/http/data/webradios/$filename";
	if ( file_exists( $file ) ) {
		$content = explode( "\n", trim( file_get_contents( $file ) ) );
		$status[ 'coverart' ] = $content[ 2 ];
	}
}

$name = $status[ 'Artist' ]; // webradioname
if ( $status[ 'state' ] === 'play' ) {
	if ( $radio ) {
		$bitdepth = '';
	} else if ( $ext === 'DSF' || $ext === 'DFF' ) {
		$bitdepth = 'dsd';
	} else {
		$bitdepth = $status[ 'bitdepth' ];
	}
	$sampling = samplingline( $bitdepth, $status[ 'samplerate' ], $status[ 'bitrate' ], $ext );
	$status[ 'sampling' ] = $sampling;
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	// save only webradio: update sampling database on each play
	if ( $radio ) file_put_contents( "/srv/http/data/sampling/$name", $sampling );
	exec( "$sudo/systemctl ".( $radio ? 'start' : 'stop' ).' radiowatchdog' );
	exit();
}
exec( "$sudo/systemctl stop radiowatchdog" );

// state: stop / pause >>>>>>>>>>
// webradio
if ( $radio ) {
	$sampling = getData( "sampling/$name" );
	$status[ 'sampling' ] = $sampling ? $sampling : '&nbsp;';
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	exit();
}

// while stop no mpd info
if ( $ext === 'DSF' || $ext === 'DFF' ) {
	// DSF: byte# 56+4 ? DSF: byte# 60+4
	$byte = ( $ext === 'DSF' ) ? 56 : 60;
	$hex = exec( '/usr/bin/hexdump -x -s'.$byte.' -n4 "'.$file.'" | head -1 | tr -s " "' );
	$hex = explode( ' ', $hex );
	$dsd= $hex[ 1 ] / 1100 * 64; # hex byte#57-58 - @1100:dsd64
	$bitrate = round( $dsd * 44100 / 1000000, 2 );
	$sampling = 'DSD'.$dsd.' • '.$bitrate.' Mbit/s';
} else {
	$data = shell_exec( '/usr/bin/ffprobe -v quiet -select_streams a:0 -show_entries stream=bits_per_raw_sample,sample_rate -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "'.$file.'"' );
	$data = explode( "\n", $data );
	$bitdepth = $data[ 1 ];
	$samplerate = $data[ 0 ];
	$bitrate = $data[ 2 ];
	$sampling = $bitrate ? samplingline( $bitdepth, $samplerate, $bitrate, $ext ) : '';
}
$status[ 'sampling' ] = $sampling;
/*$elapsed = exec( "mpc | grep '^\[playing\|^\[paused' | cut -d/ -f2 | awk '{print \$NF}'" );
sscanf( $elapsed, "%d:%d:%d", $h, $m, $s );
$status[ 'elapsed' ] = ( $h ? $h * 3600 : 0 ) + $m * 60 + $s;*/

echo json_encode( $status, JSON_NUMERIC_CHECK );

function samplingline( $bitdepth, $samplerate, $bitrate, $ext ) {
	if ( $bitdepth === 'N/A' ) {
		$bitdepth = ( $ext === 'WAV' || $ext === 'AIFF' ) ? ( $bitrate / $samplerate / 2 ).' bit ' : '';
	} else {
		if ( $bitdepth === 'dsd' ) {
			$dsd = round( $bitrate / 44100 );
			$bitrate = round( $bitrate / 1000000, 2 );
			return 'DSD'.$dsd.' • '.$bitrate.' Mbit/s';
		} else if ( $ext === 'MP3' || $ext === 'AAC' ) { // lossy has no bitdepth
			$bitdepth = '';
		} else {
			$bitdepth = $bitdepth ? $bitdepth.' bit ' : '';
		}
	}
	if ( !$bitrate ) $bitrate = 2 * $bitdepth * $samplerate;
	if ( $bitrate < 1000000 ) {
		$bitrate = round( $bitrate / 1000 ).' kbit/s';
	} else {
		$bitrate = round( $bitrate / 1000000, 2 ).' Mbit/s';
	}
	$samplerate = round( $samplerate / 1000, 1 ).' kHz ';
	return $bitdepth.$samplerate.$bitrate;
}
function getData( $type_file ) {
	return trim( @file_get_contents( "/srv/http/data/$type_file" ) );
}
