<?php
// temp - minor updates

///////////////////////////////////////////////////////////////
$addons = [

'rare' => [
	'title'       => 'RuneAudio+R e2',
	'version'     => '20191122',
	'revision'    => 'Improve NAS mount'
					.'<br>Improve system status'
					.'<br>...'
					.'<br>Fix - Addons bugs'
					.'<br>Fix - SD card bug'
					.'<br>Improve - saved settings',
	'maintainer'  => 'r e r n',
	'description' => 'Updates for RuneAudio <i class="fa fa-addons"></i> e2.',
	'buttonlabel' => 'Update',
	'nouninstall' => 1,
	'thumbnail'   => '/assets/img/addons/thumbenha.gif',
	'sourcecode'  => 'https://github.com/rern/RuneAudio-Re2',
	'installurl'  => 'https://github.com/rern/RuneAudio-Re2/raw/master/install.sh',
],
'rest' => [
	'title'       => 'RuneAudio+R e2 - Restore settings',
	'maintainer'  => 'r e r n',
	'description' => 'Restore database and settings from backup.',
	'buttonlabel' => 'Restore',
	'thumbnail'   => '/assets/img/addons/thumbrest.png',
	'sourcecode'  => 'https://github.com/rern/RuneOS/raw/master/usr/local/bin/runerestore.sh',
	'installurl'  => 'https://github.com/rern/RuneOS/raw/master/usr/local/bin/runerestore.sh',
	'option'      => [
		'wait'      => 'Copy existing database and settings:'
					  .'<br>directory <code>data</code> > <code>/srv/http</code>'
					  .'<br>before continue.'
	],
],
'cove' => [
	'title'       => 'Browse By CoverArt Thumbnails',
	'installurl'  => 'https://github.com/rern/RuneAudio/raw/master/coverarts/scan.sh',
	'hide'        => 1,
],
'expa' => [
	'title'       => 'Expand Partition',
	'maintainer'  => 'r e r n',
	'description' => 'Expand SD card ROOT partition to full capacity.',
	'thumbnail'   => '/assets/img/addons/thumbexpa.png',
	'buttonlabel' => 'Expand',
	'sourcecode'  => 'https://github.com/rern/RuneAudio/tree/master/expand_partition',
	'installurl'  => 'https://github.com/rern/RuneAudio/raw/master/expand_partition/expand.sh',
	'hide'        => !$MiBunpart,
],
'rank' => [
	'title'       => 'Rank Mirror Package Servers',
	'maintainer'  => 'r e r n',
	'description' => 'Fix package download errors caused by unreachable servers.'
					.'<br>Rank mirror package servers by download speed and latency.',
	'thumbnail'   => '/assets/img/addons/thumbrank.png',
	'buttonlabel' => '<i class="fa fa-bars"></i>Rank',
	'sourcecode'  => 'https://github.com/rern/RuneAudio/tree/master/rankmirrors',
	'installurl'  => 'https://github.com/rern/RuneAudio/raw/master/rankmirrors/rankmirrors.sh',
	'option'      => [
		'radio'     => [
			'message' => 'Download test for each server(seconds):',
			'list'    => [
				'3'  => 3,
				'4'  => 4,
				'5'  => 5,
				'6'  => 6,
				'7'  => 7,
				'8'  => 8,
				'9'  => 9,
			],
			'checked' => 3,
		],
	],
],
'radi' => [
	'title'       => 'RuneAudio+R e1 - Import Webradio',
	'maintainer'  => 'r e r n',
	'description' => 'Import default format, <code>*.pls</code> or <code>*.m3u</code>, webradio files.',
	'buttonlabel' => '<i class="fa fa-input"></i>Import',
	'thumbnail'   => '/img/addons/thumbwebr.png',
	'sourcecode'  => 'https://github.com/rern/RuneAudio-Re1/blob/master/importwebradio.sh',
	'installurl'  => 'https://github.com/rern/RuneAudio-Re1/raw/master/importwebradio.sh',
	'option'      => [
		'wait'      => 'Copy directory with webradio files:'
					  .'<br><code>Webradio/*</code> > <code>/mnt/MPD</code>'
					  .'<br>before continue.'
	],
],
'gpio' => [
	'title'       => 'RuneUI GPIO',
	'version'     => '20191113',
	'needspace'   => 5,
	'revision'    => 'Support RuneAudio+R e2'
					.'<br>...'
					.'<br>Link setting location to common directory'
					.'<br>...'
					.'<br>Improve notifications - show devices name',
	'maintainer'  => 'r e r n',
	'description' => 'GPIO-connected relay module control for power on / off audio equipments.',
	'thumbnail'   => '/assets/img/addons/thumbgpio.gif',
	'sourcecode'  => 'https://github.com/rern/RuneUI_GPIO',
	'installurl'  => 'https://github.com/rern/RuneUI_GPIO/raw/master/install.sh',
],
'aria' => [
	'title'       => 'Aria2',
	'version'     => '20170901',
	'needspace'   => 15,
	'revision'    => 'Initial release',
	'maintainer'  => 'r e r n',
	'description' => 'Download utility that supports HTTP(S], FTP, BitTorrent, and Metalink.'
					.'<br>Pre-configured and ready to use.',
	'thumbnail'   => '/assets/img/addons/thumbaria.png',
	'sourcecode'  => 'https://github.com/rern/RuneAudio/tree/master/aria2',
	'installurl'  => 'https://github.com/rern/RuneAudio/raw/master/aria2/install.sh',
],
'tran' => [
	'title'       => 'Transmission',
	'version'     => '20190911',
	'needspace'   => 9,
	'revision'    => 'Support RuneAudio+R e1'
					.'<br>...'
					.'<br>Fix bugs by reverting back to custom compiled package.'
					.'<br>...'
					.'<br>Update alternateive WebUI source',
	'maintainer'  => 'r e r n',
	'description' => 'Fast, easy, and free BitTorrent client. Pre-configured and ready to use.',
	'thumbnail'   => '/assets/img/addons/thumbtran.png',
	'sourcecode'  => 'https://github.com/rern/RuneAudio/tree/master/transmission',
	'installurl'  => 'https://github.com/rern/RuneAudio/raw/master/transmission/install.sh',
	'option'      => [
		'password'  => [
			'message' => 'Password for user <w>root</w> (blank = no password):',
			'label'   => 'Password',
		],
	],
],

];
