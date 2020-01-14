<?php if ( file_exists( '/tmp/reboot' ) ) { ?>
<script src="assets/js/vendor/jquery-2.2.4.min.js"></script>
<script src="assets/js/info.<?=$time?>.js"></script>
<script>
	info( {
		  icon    : 'warning'
		, title   : 'USB Drive'
		, nox     : 1
		, message : 'No <wh>USB drive</wh> found!<br><br>Please insert one and reboot.'
		, oklabel : '<i class="fa fa-reboot"></i>Reboot'
		, okcolor : '#de810e'
		, ok      : function() {
			$.post( 'commands.php', { bash: 'shutdown -r now' } );
		}
	} );
</script>
<?php exit();
}

include 'logosvg.php';

if ( $login && !$_SESSION[ 'login' ] ) {
?>
<style>
#pwd {
	text-align: center;
	width: 230px;
	height: 40px;
	margin-bottom: 10px;
	padding: 10px;
	font-family: "Lato";
	font-size: 15px;
	color: #e0e7ee;
	background-color: #000000 !important;
	border-radius: 4px;
	border: 1px solid hsl(200,3%,30%)/*cg*/ !important;
}
#login {
	display: block;
	margin: 0 auto;
	width: 60px;
	line-height: 34px;
	background: -webkit-radial-gradient(50% -50%, 160% 200%, hsla(0,0%,100%,.3) 50%, hsla(0,0%,100%,0) 55%);
	background: radial-gradient(160% 100% at 50% 0% ,hsla(0,0%,100%,.3) 50%,hsla(0,0%,100%,0) 55%);
	background-color: hsl(200,100%,40%)/*c*/;
}
</style>
<div style="text-align: center">
	<svg viewBox="0 0 480.2 144.2" style="margin: 100px auto 20px; width: 200px;"><?=$logo ?></svg><br>
	<input type="password" id="pwd">
	<a id="login" class="btn btn-primary">Login</a>
</div>
<script src="assets/js/vendor/jquery-2.2.4.min.js"></script>
<script src="assets/js/info.<?=$time?>.js"></script>
<script>
$( '#pwd' ).focus();
$( '#login' ).click( function() {
	$.post( 'commands.php', { login: $( '#pwd' ).val() }, function( data ) {
		data ? location.reload() : info( 'Wrong password' );
	} );
} );
$( '#pwd' ).keypress( function( e ) {
	if ( e.which == 13 ) $( '#login' ).click();
});
</script>

</body>
</html>
<?php
	exit();
}
$color = file_exists( '/srv/http/data/display/color' );
$submenucolor = ( !$color || $color === 'hsl(200,100%,40%)' ) ? '' : '<i class="fa fa-brush-undo submenu"></i>';
if ( in_array( $_SERVER[ 'REMOTE_ADDR' ], [ '127.0.0.1', '::1' ] ) ) {
	$submenupower = '<i class="fa fa-screenoff submenu"></i>';
} else {
	$submenupower = '';
}
$aria = file_exists( '/srv/http/aria2' );
if ( $aria ) {
	$ariaenable = exec( '/usr/bin/systemctl is-enabled aria2' ) === 'enabled';
	$ariaactive = exec( '/usr/bin/systemctl is-active aria2' ) === 'active' ? ' class="on"' : '';
}
$tran = file_exists( '/etc/systemd/system/transmission.service.d' );
if ( $tran ) {
	$tranenable = exec( '/usr/bin/systemctl is-enabled transmission' ) === 'enabled';
	$tranactive = exec( '/usr/bin/systemctl is-active transmission' ) === 'active'  ? ' class="on"' : '';
}
// counts
$count = exec( '/srv/http/count.sh' );
$count = explode( ' ', $count );
$counts = [
	  'artist'      => $count[ 0 ]
	, 'album'       => $count[ 1 ]
	, 'song'        => $count[ 2 ]
	, 'albumartist' => $count[ 3 ]
	, 'composer'    => $count[ 4 ]
	, 'genre'       => $count[ 5 ]
	, 'network'     => $count[ 6 ]
	, 'usbdrive'    => $count[ 7 ]
	, 'webradio'    => $count[ 8 ]
];
// library home blocks
$blocks = [ // 'id' => [ 'path', 'icon', 'name' ];
	  'coverart'    => [ 'Coverart',     'coverart',     'CoverArt' ]
	, 'sd'          => [ 'SD', 'microsd',      'SD' ]
	, 'usb'         => [ 'USB',          'usbdrive',     'USB' ]
	, 'nas'         => [ 'NAS',          'network',      'Network' ]
	, 'webradio'    => [ 'Webradio',     'webradio',     'Webradio' ]
	, 'album'       => [ 'Album',        'album',        'Album' ]
	, 'artist'      => [ 'Artist',       'artist',       'Artist' ]
	, 'albumartist' => [ 'AlbumArtist',  'albumartist',  'AlbumArtist' ]
	, 'composer'    => [ 'Composer',     'composer',     'Composer' ]
	, 'genre'       => [ 'Genre',        'genre',        'Genre' ]
];
$blockhtml = '';
foreach( $blocks as $id => $value ) {
	$browsemode = in_array( $id, [ 'album', 'artist', 'albumartist', 'composer', 'genre', 'coverart' ] ) ? ' data-browsemode="'.$id.'"' : '';
	$count = isset( $counts[ $value[ 1 ] ] ) && $counts[ $value[ 1 ] ] ? '<grl>'.number_format( $counts[ $value[ 1 ] ] ).'</grl>' : '';
	$blockhtml.= '
		<div class="divblock">
			<div id="home-'.$id.'" class="home-block"'.$browsemode.'>
				<a class="lipath">'.$value[ 0 ].'</a>
				<i class="fa fa-'.$value[ 1 ].'"></i>
				'.$count.'
				<a class="label">'.$value[ 2 ].'</a>
			</div>
		</div>
	';
}
// bookmarks
$dir = '/srv/http/data/bookmarks';
$files = file_exists( $dir ) ? array_slice( scandir( $dir ), 2 ) : []; // remove ., ..
if ( count( $files ) ) {
	foreach( $files as $file ) {
		$content = file_get_contents( "$dir/$file" );
		if ( substr( $content, 0, 10 ) === 'data:image' ) {
			$iconhtml = '<img class="bkcoverart" src="'.$content.'">';
		} else {
			$iconhtml = '<i class="fa fa-bookmark"></i>'
					   .'<div class="divbklabel"><span class="bklabel label">'.$content.'</span></div>';
		}
		$blockhtml.= '
			<div class="divblock bookmark">
				<div class="home-block home-bookmark">
					<a class="lipath">'.str_replace( '|', '/', $file ).'</a>
					'.$iconhtml.'
				</div>
			</div>
		';
	}
}
// browse by coverart
$coverartshtml = '';
$files = array_slice( scandir( '/srv/http/data/coverarts' ), 2 );
if ( count( $files ) ) {
	$thumbbyartist = file_exists( '/srv/http/data/display/thumbbyartist' );
	foreach( $files as $file ) {
		$name = substr( $file, 0, -4 );
		$ext = substr( $file, -3 );
		$filename = "$name.$time.$ext";
		// restore /, #, ? replaced by scan.sh
		$name = preg_replace( [ '/\|/', '/{/', '/}/' ], [ '/', '#', '?' ], $name );
		$names = explode( '^^', $name );
		$album = $names[ 0 ];
		$artist = $names[ 1 ];
		$sortalbum = stripLeading( $album );
		$sortartist = stripLeading( $artist );
		$path = isset( $names[ 2 ] ) ? $names[ 2 ] : '';
		if ( $thumbbyartist ) {
			$lists[] = [ $sortartist, $sortalbum, $artist, $album, $filename, $path ];
			$index[] = mb_substr( $sortartist, 0, 1, 'UTF-8' );
		} else {
			$lists[] = [ $sortalbum, $sortartist, $album, $artist, $filename, $path ];
			$index[] = mb_substr( $sortalbum, 0, 1, 'UTF-8' );
		}
	}
	usort( $lists, function( $a, $b ) {
		return strnatcmp( $a[ 0 ], $b[ 0 ] ) ?: strnatcmp( $a[ 1 ], $b[ 1 ] );
	} );
	$index = array_keys( array_flip( $index ) );
	foreach( $lists as $list ) {
		$lipath = $list[ 5 ] ? '<a class="lipath">'.$list[ 5 ].'</a>' : '';
		$coverfile = preg_replace( [ '/%/', '/"/', '/#/' ], [ '%25', '%22', '%23' ], $list[ 4 ] );
		// leading + trailing quotes in the same line avoid spaces between divs
		$coverartshtml.= '<div class="coverart">
							'.$lipath.'
							<a class="lisort">'.$list[ 0 ].'</a>
							<div><img class="lazy" data-src="/data/coverarts/'.$coverfile.'"></div>
							<span class="coverart1">'.$list[ 2 ].'</span>
							<gr class="coverart2">'.( $list[ 3 ] ?: '&nbsp;' ).'</gr>
						</div>';
	}
	$coverartshtml.= '<a id="indexcover" data-index=\''.json_encode( $index ).'\'></a><p></p>';
}
$indexarray = range( 'A', 'Z' );
$li = '<li>#</li>';
foreach( $indexarray as $i => $char ) {
	if ( $i % 2 === 0 ) {
		$li.= '<li class="index-'.$char.'">'.$char."</li>\n";
	} else {
		$li.= '<li class="index-'.$char.' half">'.$char."</li>\n";
	}
}
$index = $li.str_repeat( "<li>&nbsp;</li>\n", 5 );
function stripLeading( $string ) {
	$names = strtoupper( strVal( $string ) );
	return preg_replace(
		  [
			'/^A\s+|^AN\s+|^THE\s+|[^\w\p{L}\p{N}\p{Pd} ~]/u',
			'/\s+|^_/'
		]
		, [
			'',  // strip articles | non utf-8 normal alphanumerics | tilde(blank data)
			'-'  // fix: php strnatcmp ignores spaces | sort underscore to before 0
		]
		, $names
	);
}
// context menus
function menuli( $command, $icon, $label, $type = '' ) {
	$iconclass = [ 'folder-refresh', 'tag', 'minus-circle', 'lastfm' ];
	$class = in_array( $icon, $iconclass ) ? ' class="'.$icon.'"' : '';
	$submenu = in_array( $label, [ 'Add', 'Random', 'Replace' ] ) ? '<i class="fa fa-play-plus submenu"></i>' : '';
	return '<a data-cmd="'.$command.'"'.$class.'><i class="fa fa-'.$icon.'"></i>'.$label.$submenu.'</a>';
}
function menudiv( $id, $html ) {
	return '<div id="context-menu-'.$id.'" class="menu contextmenu hide">'.$html.'</div>';
}
function menucommon( $add, $replace ) {
	$htmlcommon = '<span class="menushadow"></span>';
	$htmlcommon.= '<a data-cmd="'.$add.'"><i class="fa fa-plus-o"></i>Add<i class="fa fa-play-plus submenu" data-cmd="'.$add.'play"></i></a>';
	$htmlcommon.= '<a data-cmd="'.$replace.'" class="replace"><i class="fa fa-replace"></i>Replace<i class="fa fa-play-replace submenu" data-cmd="'.$replace.'play"></i></a>';
	return $htmlcommon;
}

$kid3 = file_exists( '/usr/bin/kid3-cli' );

$menu = '<div>';
$htmlcommon = menucommon( 'add', 'replace' );
$htmlsimilar = '<a data-cmd="similar" class="similar"><i class="fa fa-lastfm"></i>Add similar<i class="fa fa-play-plus submenu" data-cmd="similar"></i></a>';

$html = '<span class="menushadow"></span>';
$html.= menuli( 'play',       'play',         'Play' );
$html.= menuli( 'pause',      'pause',        'Pause' );
$html.= menuli( 'stop',       'stop',         'Stop' );
$html.= menuli( 'savedpladd', 'plus',         'Add to a playlist' );
$html.= menuli( 'remove',     'minus-circle', 'Remove' );
$menu.= menudiv( 'plaction', $html );

$menudiv = '';
$html = $htmlcommon;
$html.= menuli( 'bookmark',  'star',           'Bookmark' );
$html.= menuli( 'exclude',   'folder-forbid',  'Exclude directory' );
$html.= menuli( 'update',    'folder-refresh', 'Update database' );
$html.= menuli( 'thumbnail', 'coverart',       'Update thumbnails' );
if ( $kid3 ) $html.= menuli( 'tag',       'tag',            'Tags' );
$menu.= menudiv( 'folder', $html );

$menudiv = '';
$html = menucommon( 'add', 'replace' );
$html.= $htmlsimilar;
if ( $kid3 ) $html.= menuli( 'tag',     'tag',    'Tags' );
$menu.= menudiv( 'file', $html );

$menudiv = '';
$html = $htmlcommon;
$menu.= menudiv( 'filepl', $html );

$menudiv = '';
$html = $htmlcommon;
$html.= $htmlsimilar;
$html.= menuli( 'savedplremove', 'minus-circle', 'Remove' );
if ( $kid3 ) $html.= menuli( 'tag',           'tag',          'Tags' );
$menu.= menudiv( 'filesavedpl', $html );

$menudiv = '';
$html = menucommon( 'add', 'replace' );
$menu.= menudiv( 'radio', $html );

$menudiv = '';
$html = menucommon( 'wradd', 'wrreplace' );
$html.= menuli( 'wrrename',   'edit-circle',  'Rename' );
$html.= menuli( 'wrcoverart', 'coverart',     'Change coverart' );
$html.= menuli( 'wrdelete',   'minus-circle', 'Delete' );
$menu.= menudiv( 'webradio', $html );

$menudiv = '';
$html = '<span class="menushadow"></span>';
$html.= menucommon( 'pladd', 'plreplace' );
$html.= menuli( 'plrename', 'edit-circle',  'Rename' );
$html.= menuli( 'pldelete', 'minus-circle', 'Delete' );
$menu.= menudiv( 'playlist', $html );

$menudiv = '';
$html = menucommon( 'albumadd', 'albumreplace' );
$menu.= menudiv( 'album', $html );

$menudiv = '';
$html = menucommon( 'artistadd', 'artistreplace' );
$menu.= menudiv( 'artist', $html );

$menudiv = '';
$html = menucommon( 'composeradd', 'composerreplace' );
$menu.= menudiv( 'composer', $html );

$menudiv = '';
$html = menucommon( 'genreadd', 'genrereplace' );
$menu.= menudiv( 'genre', $html );
?>
<div id="menu-top" class="hide">
	<i id="menu-settings" class="fa fa-gear"></i><span id="badge" class="hide"></span>
	<div id="playback-controls">
		<button id="previous" class="btn btn-default btn-cmd"><i class="fa fa-step-backward"></i></button>
		<button id="stop" class="btn btn-default btn-cmd"><i class="fa fa-stop"></i></button>
		<button id="play" class="btn btn-default btn-cmd"><i class="fa fa-play"></i></button>
		<button id="pause" class="btn btn-default btn-cmd"><i class="fa fa-pause"></i></button>
		<button id="next" class="btn btn-default btn-cmd"><i class="fa fa-step-forward"></i></button>
	</div>
	<a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank">
		<svg class="logo" viewBox="0 0 480.2 144.2"><?=$logo ?></svg>
	</a>
</div>
<div id="settings" class="menu hide">
	<span class="menushadow"></span>
	<a href="index-settings.php?p=mpd" class="settings"><i class="fa fa-mpd"></i>MPD
</a>
	<a id="sources" class="settings"><i class="fa fa-folder-cascade"></i>Sources<i class="fa fa-folder-refresh submenu"></i></a>
	<a href="index-settings.php?p=network" class="settings"><i class="fa fa-network"></i>Network</a>
	<a id="system" class="settings"><i class="fa fa-sliders"></i>System<i id="credits" class="fa fa-rune submenu"></i></a>
		<?php if ( $login ) { ?>
	<a id="logout"><i class="fa fa-lock"></i>Logout</a>
		<?php } ?>
	<a id="power"><i class="fa fa-power"></i>Power<?=$submenupower ?></a>
		<?php if ( $gpio ) { ?>
	<a id="gpio"><i class="fa fa-gpio"></i>GPIO<i class="fa fa-gear submenu settings"></i></a>
		<?php }
			  if ( $aria ) { ?>
	<a id="aria2" class="settings" data-enabled="<?=$ariaenable?>" data-active="<?=$ariaactive?>">
		<img src="/assets/img/addons/thumbaria.<?=$time?>.png"<?=$ariaactive?>>Aria2
		<i class="fa fa-gear submenu imgicon"></i>
	</a>
		<?php }
			  if ( $tran ) { ?>
	<a id="transmission" class="settings" data-enabled="<?=$tranenable?>" data-active="<?=$tranactive?>">
		<img src="/assets/img/addons/thumbtran.<?=$time?>.png"<?=$tranactive?>>Transmission
		<i class="fa fa-gear submenu imgicon"></i>
	</a>
		<?php } ?>
	<a id="displaylibrary"><i class="fa fa-library"></i>Library Tools</a>
	<a id="displayplayback"><i class="fa fa-play-circle"></i>Playback Tools</a>
	<a id="displaycolor"><i class="fa fa-brush"></i>Color<?=$submenucolor ?></a>
	<a id="addons" class="settings"><i class="fa fa-addons"></i>Addons</a>
</div>
<div id="swipebar" class="transparent">
	<i id="swipeL" class="fa fa-left fa-2x"></i>
	<i class="fa fa-reload fa-2x"></i><i class="fa fa-swipe fa-2x"></i><i class="fa fa-gear fa-2x"></i>
	<i id="swipeR" class="fa fa-right fa-2x"></i>
</div>
<div id="swipeR" class="transparent"><i class="fa fa-gear fa-2x"></i></div>
<div id="menu-bottom" class="hide">
	<ul>
		<li id="tab-library"><a><i class="fa fa-library"></i></a></li>
		<li id="tab-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>
		<li id="tab-playlist"><a><i class="fa fa-list-ul"></i></a></li>
	</ul>
</div>

<div id="page-playback" class="page">
	<div class="emptyadd hide"><i class="fa fa-plus-circle"></i></div>
	<div id="info">
		<div id="divartist">
			<span id="artist"></span>
		</div>
		<div id="divsong">
			<span id="song"></i></span>
		</div>
		<div id="divalbum">
			<span id="album"></span>
		</div>
		<div id="sampling">
			<div id="divpos">
				<span id="songposition"></span>
				<span id="timepos"></span>
				<span class="positionicon">
				<span id="posmode">
					<i id="posaddons" class="fa fa-addons hide"></i>
					<i id="posupdate" class="fa fa-library blink hide"></i>
					<i id="posrandom" class="fa fa-random hide"></i>
					<i id="posrepeat"></i>
					<i id="posconsume" class="fa fa-flash hide"></i>
					<i id="poslibrandom" class="fa fa-dice hide"></i>
					<i id="posplayer"></i>
					<i id="posgpio" class="fa fa-gpio hide"></i>
				</span>
				<span>
			</div>
			<span id="format-bitrate"></span>
		</div>
	</div>
	<div class="row" id="playback-row">
		<div id="time-knob" class="playback-block">
			<div id="time"></div>
			<div id="imode">
				<i id="iaddons" class="fa fa-addons hide"></i>
				<i id="iupdate" class="fa fa-library blink hide"></i>
				<i id="irandom" class="fa fa-random hide"></i>
				<i id="irepeat" class="hide"></i>
				<i id="iconsume" class="fa fa-flash hide"></i>
				<i id="ilibrandom" class="fa fa-dice hide"></i>
				<i id="iplayer" class="hide"></i>
				<i id="igpio" class="fa fa-gpio hide"></i>
			</div>
			<img id="controls-time" class="controls hide" src="/img/controls-time.<?=$time?>.svg">
			<span id="elapsed" class="controls1"></span>
			<span id="total" class="controls1"></span>
			<div id="timeTL" class="timemap"></div>
			<div id="timeT" class="timemap"></div>
			<div id="timeTR" class="timemap"></div>
			<div id="timeL" class="timemap"></div>
			<div id="timeM" class="timemap"></div>
			<div id="timeR" class="timemap"></div>
			<div id="timeBL" class="timemap"></div>
			<div id="timeB" class="timemap"></div>
			<div id="timeBR" class="timemap"></div>
		</div>
		<div id="play-group">
			<div class="btn-group hide">
				<button id="repeat" class="btn btn-default btn-cmd btn-toggle" type="button"><i class="fa fa-repeat"></i></button>
				<button id="random" class="btn btn-default btn-cmd btn-toggle" type="button"><i class="fa fa-random"></i></button>
				<button id="single" class="btn btn-default btn-cmd btn-toggle" type="button"><i class="fa fa-single"></i></button>
			</div>
		</div>
		<div id="coverart" class="playback-block">
			<div id="divcover">
			<img id="cover-art" class="hide">
			<div id="coverartoverlay" class="hide"></div>
			<img id="controls-cover" class="controls hide" src="/img/controls.<?=$time?>.svg">
			<div id="coverTL" class="covermap r1 c1 ws hs"></div>
			<div id="coverT" class="covermap r1 c2 wl hs"></div>
			<div id="coverTR" class="covermap r1 c3 ws hs"></div>
			<div id="coverL" class="covermap r2 c1 ws hl"></div>
			<div id="coverM" class="covermap r2 c2 wl hl"></div>
			<div id="coverR" class="covermap r2 c3 ws hl"></div>
			<div id="coverBL" class="covermap r3 c1 ws hs"></div>
			<div id="coverB" class="covermap r3 c2 wl hs"></div>
			<div id="coverBR" class="covermap r3 c3 ws hs"></div>
			</div>
		</div>
		<div id="share-group">
			<div class="btn-group hide">
				<button id="share" class="btn btn-default" type="button"><i class="fa fa-share"></i></button>
				<button id="bio-open" class="btn btn-default" type="button"><i class="fa fa-bio"></i></button>
			</div>
		</div>
		<div id="volume-knob" class="playback-block">
			<div id="volume"></div>
			<div id="volT" class="volmap"></div>
			<div id="volL" class="volmap"></div>
			<div id="volM" class="volmap"></div>
			<div id="volR" class="volmap"></div>
			<div id="volB" class="volmap"></div>
			<img id="controls-vol" class="controls hide" src="/img/controls-vol.<?=$time?>.svg">
		</div>
		<div id="vol-group">
			<div class="btn-group hide">
				<button id="voldn" class="btn btn-default" type="button"><i class="fa fa-minus"></i></button>
				<button id="volmute" class="btn btn-default" type="button"><i class="fa fa-volume"></i></button>
				<button id="volup" class="btn btn-default" type="button"><i class="fa fa-plus"></i></button>
			</div>
		</div>
	</div>
</div>

<div id="page-library" class="page hide">
	<div class="btnlist btnlist-top">
		<i id="db-searchbtn" class="fa fa-search"></i>
		<div id="db-search" class="hide">
			<div class="input-group">
				<input id="db-search-keyword" class="form-control" type="text">
				<span class="input-group-btn">
					<button id="dbsearchbtn" class="btn btn-default"><i class="fa fa-search"></i></button>
				</span>
			</div>
		</div>
		<button id="db-search-close" class="btn hide" type="button"></button>
		<div id="db-currentpath">
			<a class="lipath"></a>
			<i id="db-back" class="fa fa-arrow-left"></i>
			<div id="db-home"><i class="fa fa-library"></i></div><span></span>
			<i id="db-webradio-new" class="fa fa-plus-circle hide"></i>
		</div>
	</div>
	<div id="home-blocks" class="row" data-count="<?=$counts[ 'song' ]?>">
		<div id="divhomeblocks"><?=$blockhtml?></div>
		<div style="clear: both"></div>
	</div>
	<div id="db-list">
		<ul id="db-entries" class="database"></ul>
		<ul id="db-index" class="index hide"><?=$index?></ul>
		<div id="divcoverarts" class="hide"><?=$coverartshtml?></div>
	</div>
</div>

<div id="page-playlist" class="page hide">
	<div class="emptyadd hide"><i class="fa fa-plus-circle"></i></div>
	<div class="btnlist btnlist-top">
		<div id="pl-home"><i class="fa fa-list-ul sx"></i></div>
		<i id="pl-back" class="fa fa-arrow-left hide"></i>
		<span id="pl-currentpath" class="hide"></span>
		<span id="pl-count" class="playlist hide"></span>
		<i id="pl-searchbtn" class="fa fa-search"></i>
		<form id="pl-search" class="hide" method="post" onSubmit="return false;">
			<div class="input-group">
				<input id="pl-filter" class="form-control" type="text">
				<span class="input-group-btn">
					<button id="plsearchbtn" class="btn btn-default" type="button"><i class="fa fa-search"></i></button>
				</span>
			</div>
		</form>
		<div id="pl-manage" class="playlist">
			<i id="plopen" class="fa fa-folder-open"></i>
			<i id="plsave" class="fa fa-save"></i>
			<i id="plconsume" class="fa fa-flash"></i>
			<i id="pllibrandom" class="fa fa-dice"></i>
			<i id="plcrop" class="fa fa-crop"></i>
			<i id="plclear" class="fa fa-minus-circle"></i>
		</div>
		<button id="pl-search-close" class="btn hide" type="button"></button>
	</div>
	<div id="pl-list">
		<ul id="pl-entries" class="playlist"></ul>
		<ul id="pl-editor" class="hide"></ul>
		<ul id="pl-index" class="index hide"><?=$index?></ul>
	</div>
</div>

<?=$menu?>

<div id="divcolorpicker" class="hide">
	<i id="colorcancel" class="fa fa-times fa-2x"></i>
	<a id="colorok" class="btn btn-primary">Set</a>
</div>
<div id="bio" class="hide">
	<div class="container">
		<h1>BIO</h1><a id="closebio"><i class="fa fa-times close-root"></i></a>
		<p class="hrbl"></p>
		<div id="biocontent"></div>
	</div>
</div>
<div id="lyricscontainer" class="hide">
	<div id="lyricstitle">
		<span id="lyricssong"></span>
		<div id="lyricstitlebtn">
			<i id="lyricsclose" class="fa fa-times"></i>
		</div>
	</div>
	<div>
		<span id="lyricsartist"></span><i id="lyricsedit" class="fa fa-edit-circle"></i>
		<div id="lyricseditbtngroup">
			<i id="lyricsback" class="fa fa-arrow-left"></i>
			<i id="lyricsundo" class="fa fa-undo"></i>
			<i id="lyricssave" class="fa fa-save"></i>
			<i id="lyricsdelete" class="fa fa-minus-circle"></i>
		</div>
	</div>
	<div id="lyricstextoverlay">
		<div id="lyricstext" class="lyricstext"></div>
	</div>
	<div id="lyricstextareaoverlay" class="hide">
		<textarea id="lyricstextarea" class="lyricstext"></textarea>
	</div>
	<div id="lyricsfade"></div>
</div>
<div id="splash"><svg viewBox="0 0 480.2 144.2"><?=$logo?></svg></div>
<div id="loader" class="hide"><svg viewBox="0 0 480.2 144.2"><?=$logo?></svg></div>
