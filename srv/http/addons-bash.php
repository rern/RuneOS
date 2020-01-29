<?php
ignore_user_abort( TRUE ); // for 'connection_status()' to work
$time = time();
$alias = $_POST[ 'alias' ];
$type = $_POST[ 'type' ];
$opt = $_POST[ 'opt' ];
$heading = $alias !== 'cove' ? 'Addons Progress' : 'Update Thumbnails';
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Rune Addons</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="msapplication-tap-highlight" content="no" />
	<link rel="icon" href="/assets/img/addons/addons.<?=$time?>.png">
	<style>
		@font-face {
			font-family: enhance;
			src        : url( '/assets/fonts/enhance.<?=$time?>.woff' ) format( 'woff' ),
			             url( '/assets/fonts/enhance.<?=$time?>.ttf' ) format( 'truetype' );
			font-weight: normal;
			font-style : normal;
		}
	</style>
	<link rel="stylesheet" href="/assets/css/info.<?=$time?>.css">
	<link rel="stylesheet" href="/assets/css/addons.<?=$time?>.css">
		<?php if ( $alias === 'rrre' ) { ?>
	<link rel="stylesheet" href="/assets/css/banner.<?=$time?>.css">
		<?php } ?>
</head>
<body>

<?php include 'addons-list.php';?>
<script src="/assets/js/plugin/jquery-2.2.4.min.<?=$time?>.js"></script>
<script src="/assets/js/plugin/jquery.documentsize.min.<?=$time?>.js"></script>
<script src="/assets/js/info.<?=$time?>.js"></script>
<script>
$( 'head' ).append( '<style>#hidescrollv, pre { max-height: '+ ( $.documentHeight() - 200 ) +'px }</style>' );
// js for '<pre>' must be here before start stdout
// php 'flush' loop waits for all outputs before going to next lines
// but must 'setTimeout()' for '<pre>' to load to fix 'undefined'
setTimeout( function() {
	pre = document.getElementsByTagName( 'pre' )[ 0 ];
	var h0 = pre.scrollHeight;
	var h1;
	intscroll = setInterval( function() {
		h1 = pre.scrollHeight;
		if ( h1 > h0 ) {
			pre.scrollTop = pre.scrollHeight;
			h0 = h1;
		}
	}, 1000 );
}, 1000 );
</script>
<?php
$addon = $addons[ $alias ];
$installurl = $addon[ 'installurl' ];
$reinit = 0;

$optarray = explode( ' ', $opt );
if ( end( $optarray ) === '-b' ) $installurl = str_replace( 'raw/master', 'raw/'.prev( $optarray ), $installurl );

$installfile = basename( $installurl );
$title = preg_replace( '/\**$/', '', $addon[ 'title' ] );
if ( $alias === 'rrre' ) {
	include 'logosvg.php';
?>
<script src="/assets/js/banner.<?=$time?>.js"></script>
<div id="splash" class="hide"><svg viewBox="0 0 480.2 144.2"><?=$logo?></svg></div>
<?php
}
?>

<div class="container">
	<h1>
		<i class="fa fa-addons gr"></i>&ensp;<span><?=$heading?></span>
		<i class="close-root fa fa-times disabled"></i>
	</h1>
	<p class="bl"></p>
	<p id="wait">
		<w><?=$title?></w><br>
		<i class="fa fa-gear fa-spin"></i>Please wait until finished...
	</p>

	<div id="hidescrollv">
	<pre>
<!-- ...................................................................................... -->
<?php
$getinstall = <<<cmd
	wget -qN --no-check-certificate $installurl 
	if [[ $? != 0 ]]; then 
		echo -e '\e[38;5;7m\e[48;5;1m ! \e[0m Install file download failed.'
		echo 'Please try again.'
		exit
	fi
	chmod 755 $installfile
	
cmd;
$uninstall = <<<cmd
	/usr/bin/sudo /usr/local/bin/uninstall_$alias.sh
cmd;

if ( $type === 'Uninstall' ) {
	$command = $uninstall;
	$commandtxt = "uninstall_$alias.sh";
} else if ( $type === 'Update' ) {
	if ( !isset( $addon[ 'nouninstall' ] ) ) {
		$command = $getinstall;
		$command.= <<<cmd
			$uninstall u
			/usr/bin/sudo ./$installfile u $opt
cmd;
		$commandtxt = <<<cmd
			wget -qN --no-check-certificate $installurl
			chmod 755 $installfile
			
			uninstall_$alias.sh u
			
			./$installfile u $opt
cmd;
	} else {
		$command = $getinstall;
		$command.= <<<cmd
			/usr/bin/sudo ./$installfile u $opt
cmd;
		$commandtxt = <<<cmd
			wget -qN --no-check-certificate $installurl
			chmod 755 $installfile
			
			./$installfile u $opt
cmd;
	}
} else {
	$command = $getinstall;
	$command.= <<<cmd
		/usr/bin/sudo ./$installfile $opt
cmd;
	// hide password from command verbose
	$options = isset( $addon[ 'option' ] ) ? $addon[ 'option' ] : '';
	if ( $options && array_key_exists( 'password', $options ) ) {
		$pwdindex = array_search( 'password', array_keys( $options ) );
		$opts = explode( ' ', $opt );
		$opts[ $pwdindex ] = '***';
		$opt = implode( ' ', $opts );
	}
	$commandtxt = <<<cmd
		wget -qN --no-check-certificate $installurl
		chmod 755 $installfile
		./$installfile $opt
cmd;
}
$commandtxt = preg_replace( '/\t*/', '', $commandtxt );

// convert bash stdout to html
$replace = [
	'/.\[38;5;8m.\[48;5;8m/' => '<a class="cbgr">',     // bar - gray
	'/.\[38;5;7m.\[48;5;7m/' => '<a class="cbw">',      // bar - white
	'/.\[38;5;6m.\[48;5;6m/' => '<a class="cbc">',      // bar - cyan
	'/.\[38;5;5m.\[48;5;5m/' => '<a class="cbm">',      // bar - magenta
	'/.\[38;5;4m.\[48;5;4m/' => '<a class="cbb">',      // bar - blue
	'/.\[38;5;3m.\[48;5;3m/' => '<a class="cby">',      // bar - yellow
	'/.\[38;5;2m.\[48;5;2m/' => '<a class="cbg">',      // bar - green
	'/.\[38;5;1m.\[48;5;1m/' => '<a class="cbr">',      // bar - red
	'/.\[38;5;8m.\[48;5;0m/' => '<a class="cgr">',      // tcolor - gray
	'/.\[38;5;6m.\[48;5;0m/' => '<a class="cc">',       // tcolor - cyan
	'/.\[38;5;5m.\[48;5;0m/' => '<a class="cm">',       // tcolor - magenta
	'/.\[38;5;4m.\[48;5;0m/' => '<a class="cb">',       // tcolor - blue
	'/.\[38;5;3m.\[48;5;0m/' => '<a class="cy">',       // tcolor - yellow
	'/.\[38;5;2m.\[48;5;0m/' => '<a class="cg">',       // tcolor - green
	'/.\[38;5;1m.\[48;5;0m/' => '<a class="cr">',       // tcolor - red
	'/.\[38;5;0m.\[48;5;3m/' => '<a class="ckby">',     // info, yesno
	'/.\[38;5;7m.\[48;5;1m/' => '<a class="cwbr">',     // warn
	'/=(=+)=/'               => '<hr>',                 // double line
	'/-(-+)-/'               => '<hr class="hrlight">', // line
	'/.\[38;5;6m/'           => '<a class="cc">',       // lcolor
	'/.\[0m/'                => '</a>',                 // reset color
];
$skip = ['warning:', 'permissions differ', 'filesystem:', 'uninstall:', 'y/n' ];
$skippacman = [ 'downloading core.db', 'downloading extra.db', 'downloading alarm.db', 'downloading aur.db' ];
$fillbuffer = '<p class="flushdot">'.str_repeat( '.', 4096 ).'</p>';
ob_implicit_flush();       // start flush: bypass buffer - output to screen
ob_end_flush();            // force flush: current buffer (run after flush started)

echo $fillbuffer;          // fill buffer to force start output
echo $commandtxt.'<br>';
if ( $type === 'Uninstall' ) sleep(1);

$popencmd = popen( "$command 2>&1", 'r' );              // start bash
while ( !feof( $popencmd ) ) {                          // each line
	$std = fread( $popencmd, 4096 );                    // read

	$std = preg_replace(                                // convert to html
		array_keys( $replace ),
		array_values( $replace ),
		$std
	);
	foreach( $skip as $find ) {                         // skip line
		if ( stripos( $std, $find ) !== false ) continue 2;
	}
	foreach( $skippacman as $findp ) {                  // skip pacman line after output once
		if ( stripos( $std, $findp ) !== false ) $skip[] = $findp; // add skip string to $skip array
	}
	echo $std;                                          // stdout to screen
	echo $fillbuffer;                                   // fill buffer to force output line by line
	
	// abort on stop loading or exit terminal page
	if ( connection_status() !== 0 || connection_aborted() === 1 ) {
		$sudo = '/usr/bin/sudo /usr/bin';
		exec( "$sudo/killall $installfile wget pacman &" );
		exec( "$sudo/rm /var/lib/pacman/db.lck /srv/http/*.zip /usr/local/bin/uninstall_$alias.sh &" );
		exec( "$sudo/rm /srv/http/data/addons/$alias &" );
		pclose( $popencmd );
		die();
	}
}
sleep( 1 );
pclose( $popencmd );
?>
<!-- ...................................................................................... -->
	</pre>
	</div>
</div>

<script>
clearInterval( intscroll );
pre.scrollTop = pre.scrollHeight;
$( '#wait' ).remove();
$( '#hidescrollv' ).css( 'max-height', ( $( '#hidescrollv' ).height() + 30 ) +'px' );
info( {
	  icon    : 'info-circle'
	, title   : '<?=$title?>'
	, message : 'Please see result information on screen.'
} );
$( '.close-root' )
	.removeClass( 'disabled' )
	.click( function() {
		var alias = '<?=$alias?>';
		if ( alias === 'rest' ) {
			var cmdpower = [
				  'umount -l /mnt/MPD/NAS/* &> /dev/null'
				, 'sleep 3'
				, '/root/gpiooff.py 2> /devnull'
				, 'systemctl stop localbrowser 2> /devnull'
				, '/usr/local/bin/ply-image /usr/share/bootsplash/start.png'
			];
			info( {
				  icon        : 'reset'
				, title       : 'R+R e2 - Restore settings'
				, message     : 'Select mode:'
				, buttonlabel : '<i class="fa fa-reboot"></i>Reboot'
				, buttoncolor : '#de810e'
				, button      : function() {
					cmdpower.push( 'shutdown -r now' );
					$.post( 'commands.php', { bash: cmdpower } );
					location.href = '/';
				}
				, oklabel     : '<i class="fa fa-power"></i>Off'
				, okcolor     : '#bb2828'
				, ok          : function() {
					cmdpower.push( 'shutdown -h now' );
					$.post( 'commands.php', { bash: cmdpower } );
					location.href = '/';
				}
				, buttonwidth : 1
			} );
		} else if ( alias === 'cove' ) {
			location.href = '/';
		} else {
			location.href = '/addons.php';
		}
	} );
</script>

</body>
</html>
<!-- ...................................................................................... -->
<?php
opcache_reset();
?>
