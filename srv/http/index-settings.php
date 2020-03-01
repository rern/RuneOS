<?php
$time = time();
$localhost = in_array( $_SERVER[ 'REMOTE_ADDR' ], ['127.0.0.1', '::1'] );
include 'logosvg.php';
?>
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
		<?php if ( $localhost ) { ?> 
	<link rel="stylesheet" href="/assets/css/simple-keyboard.min.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/keyboard.<?=$time?>.css">
		<?php } ?>
	<link rel="stylesheet" href="/assets/css/selectric.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/info.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/settings.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/banner.<?=$time?>.css">
	<link rel="icon" type="image/png" href="/img/favicon-192x192.<?=$time?>.png" sizes="192x192">
</head>
<body>
<?php
$page = $_GET[ 'p' ];
$sudo = '/usr/bin/sudo /usr/bin';
$icon = [
	  'credits' => 'rune'
	, 'mpd'     => 'mpd'
	, 'network' => 'network'
	, 'sources' => 'folder-cascade'
	, 'system'  => 'sliders'
];
?>
<div class="head hide">
	<i class="page-icon fa fa-<?=$icon[ $page ]?>"></i><span class='title'><?=( strtoupper( $page ) )?></span>
	<i id="close" class="fa fa-times"></i><i id="help" class="fa fa-question-circle"></i>
</div>
<div class="container hide">
<?php
include "settings/$page.php";
?>
</div>
	<?php if ( $localhost ) { ?>
<input class="input hide">
<div id="keyboard" class="hide"><div class="simple-keyboard"></div></div>
	<?php } ?>
<div id="loader"><svg viewBox="0 0 480.2 144.2"><?=$logo?></svg></div>
<script src="/assets/js/plugin/jquery-2.2.4.min.<?=$time?>.js"></script>
<script src="/assets/js/plugin/pushstream.min.<?=$time?>.js"></script>
<script src="/assets/js/info.<?=$time?>.js"></script>
<script src="/assets/js/banner.<?=$time?>.js"></script>
<script src="/assets/js/settings.<?=$time?>.js"></script>
	<?php if ( $page !== 'credits' ) { ?>
<script src="/assets/js/<?=$page?>.<?=$time?>.js"></script>
	<?php	if ( $page === 'mpd' || $page === 'system' ) { ?>
<script src="/assets/js/plugin/jquery.selectric.min.<?=$time?>.js"></script>
	<?php	} else if ( $page === 'network' ) { ?>
<script src="/assets/js/plugin/jquery.qrcode.min.<?=$time?>.js"></script>
	<?php	}
		  } ?>
	<?php if ( $localhost ) { ?>
<script src="/assets/js/plugin/simple-keyboard.min.<?=$time?>.js"></script>
<script src="/assets/js/keyboard.<?=$time?>.js"></script>
	<?php } ?>
	
</body>
</html>
