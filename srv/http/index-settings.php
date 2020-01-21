<?php $time = time();?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>RuneAudio Settings</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="msapplication-tap-highlight" content="no">
	<style>
		@font-face {
			font-family: enhance;
			src        : url( '/assets/fonts/enhance.<?=$time?>.woff' ) format( 'woff' ),
			             url( '/assets/fonts/enhance.<?=$time?>.ttf' ) format( 'truetype' );
			font-weight: normal;
			font-style : normal;
		}
	</style>
	<link rel="stylesheet" href="/assets/css/selectric.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/info.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/settings.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/banner.<?=$time?>.css">
	<link rel="icon" type="image/png" href="/img/favicon-192x192.<?=$time?>.png" sizes="192x192">
</head>
<body>

<?php
$sudo = '/usr/bin/sudo /usr/bin';
function headhtml( $icon, $title ) {
	echo '
		<div class="head">
			<i class="page-icon fa fa-'.$icon.'"></i><span class="title">'.$title.'</span><a href="/"><i id="close" class="fa fa-times"></i></a><i id="help" class="fa fa-question-circle"></i>
		</div>
	';
}
$p = $_GET[ 'p' ];
$icon = [
	  'credits' => 'rune'
	, 'mpd'     => 'mpd'
	, 'network' => 'network'
	, 'sources' => 'folder-cascade'
	, 'system'  => 'sliders'
];
headhtml( $icon [ $p ], strtoupper( $p ) );
include "settings/$p.php";
?>
<script src="/assets/js/plugin/jquery-2.2.4.min.<?=$time?>.js"></script>
<script src="/assets/js/plugin/pushstream.min.<?=$time?>.js"></script>
<script src="/assets/js/info.<?=$time?>.js"></script>
	<?php if ( $p !== 'credits' ) { ?>
<script src="/assets/js/<?=$p?>.<?=$time?>.js"></script>
	<?php	if ( $p === 'mpd' ) { ?>
<script src="/assets/js/plugin/jquery.selectric.min.<?=$time?>.js"></script>
	<?php	} else if ( $p === 'system' ) { ?>
<script src="/assets/js/plugin/jquery.selectric.min.<?=$time?>.js"></script>
<script src="/assets/js/banner.<?=$time?>.js"></script>
	<?php	} else if ( $p === 'network' ) { ?>
<script src="/assets/js/plugin/jquery.qrcode.min.<?=$time?>.js"></script>
<script src="/assets/js/banner.<?=$time?>.js"></script>
	<?php	}
		  } ?>
<script>
$( '.page-icon' ).click( function() {
	location.reload();
} );
$( '#help' ).click( function() {
	$( this ).toggleClass( 'blue' );
	$( '.help-block' ).toggleClass( 'hide' );
} );
local = 0;
pushstream = new PushStream( { modes: 'websocket' } );
pushstream.addChannel( 'page' );
pushstream.connect();
pushstream.onmessage = function( data ) {
	if ( !local && location.search === '?p='+ data[0].p ) location.reload();
}
function pstream( page ) {
	return 'curl -s -X POST "http://127.0.0.1/pub?id=page" -d \'{ "p": "'+ page +'" }\'';
}
function resetlocal() {
	setTimeout( function() { local = 0 }, 1000 );
}
</script>

</body>
</html>
