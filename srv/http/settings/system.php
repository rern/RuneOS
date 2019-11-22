<?php
$data = json_decode( shell_exec( '/srv/http/settings/system-data.sh' ) );
$hardwarecode = $data->hardwarecode;
switch( substr( $hardwarecode, -3, 2 ) ) {
	case '00':
	case '01':
	case '02':
	case '03': $cpu = '700 MHz';     break;
	case '04': $cpu = '4 @ 900 MHz'; break;
	case '09':
	case '0c': $cpu = '4 @ 1 GHz';   break;
	case '08': $cpu = '4 @ 1.2 GHz'; break;
	case '0e':
	case '0d': $cpu = '4 @ 1.4 GHz'; break;
	case '11': $cpu = '4 @ 1.5 GHz';
}
switch( substr( $hardwarecode, -6, 1 ) ) {
	case '9': $memory = '512 KB'; break;
	case 'a': $memory = '1 GB';   break;
	case 'b': $memory = '2 GB';   break;
	case 'c': $memory = '4 GB';
}
$rpiwireless = in_array( $hardwarecode, [ '0c', '08', '0e', '0d', '11' ] ); // rpi zero w, rpi3, rpi4
$undervoltage = $data->undervoltage ? '<span id="undervoltage"><br>'.$data->undervoltage.' <a class="red">Under-voltage detected</a></span>' : '';
date_default_timezone_set( $data->timezone );
$timezonelist = timezone_identifiers_list();
$selecttimezone = '<select id="timezone">';
foreach( $timezonelist as $key => $zone ) {
	$selected = $zone === $data->timezone ? ' selected' : '';
	$datetime = new DateTime( 'now', new DateTimeZone( $zone ) );
	$offset = $datetime->format( 'P' );
	$zonename = preg_replace( [ '/_/', '/\//' ], [ ' ', ' <gr>&middot;</gr> ' ], $zone );
	if ( $selected ) $zonestring = $data->timezone === 'UTC' ? 'UTC' : explode( ' <gr>&middot;</gr> ', $zonename, 2 )[ 1 ];
	$selecttimezone.= '<option value="'.$zone.'"'.$selected.'>'.$zonename.'&ensp;'.$offset."</option>\n";
}
$selecttimezone.= '</select>';

// set value
//   - append '/boot/config.txt' with 'dtoverlay' file names in '/boot/overlays/*'
//   - set value to /srv/http/data/system/audiooutput
//   - disable on-board audio in '/boot/config.txt'
//   - reboot
//   - '/srv/http/settings/mpd-conf.sh' - parse sysnames with 'aplay -l' and populate to '/etc/mpd.conf'
//
//   - MPD setting page - get names from '/srv/http/settings/i2s/*' or 'mpc outputs'
//   - set selected to audiooutput value
include '/srv/http/settings/system-i2smodules.php';
$optioni2smodule = '';
foreach( $i2slist as $name => $sysname ) {
	$selected = ( $name === $data->audiooutput && $sysname === $data->i2ssysname ) ? ' selected' : '';
	$optioni2smodule.= "<option value=\"$sysname\"$selected>$name</option>";
}
if ( $data->accesspoint ) echo '<input id="accesspoint" type="hidden">';
?>
<div class="container">
	<heading>System Status</heading>
		<div class="col-l text gr">
			RuneAudio<br>
			IP address<br>
			Kernel<br>
			Hardware<br>
			CPU<br>
			RAM<br>
			Time<br>
			Up time<br>
			Since<br>
			CPU Load<br>
			CPU Temperature
		</div>
		<div class="col-r text">
			<i class="fa fa-addons gr"></i> <?=$data->version?><br>
			<?=$data->ip?><br>
			<?=$data->kernel?><br>
			<?=$data->hardware?><br>
			<?=$cpu?><br>
			<?=$memory?><br>
			<span id="date"><?=$data->date?></span><gr>&emsp;@ </gr><?=$zonestring?><br>
			<span id="uptime"><?=$data->uptime?></span><br>
			<?=$data->since?><br>
			<span id="cpuload"><?=$data->cpuload?></span>%<br>
			<span id="cputemp"><?=( round( $data->cputemp / 1000 ) )?></span>°C
			<span class="<?=( $data->undervoltage ? '' : 'hide' )?>"><br><span id="undervoltage"><?=$data->undervoltage?></span> <a class="red">Under-voltage detected</a></span>
		</div>
	<heading>Environment</heading>
		<div class="col-l">Player name</div>
		<div class="col-r">
			<input type="text" id="hostname" value="<?=$data->hostname?>" readonly style="cursor: pointer">
			<span class="help-block hide">Set the player hostname. This will change the address used to reach RuneAudio.
				<br>RuneAudio web interface, Local access point, AirPlay, Samba and UPnP/upnp will broadcast this name when enabled.
				<br>(No spaces or special charecters allowed in the name.)</span>
		</div>
		<div class="col-l">Timezone</div>
		<div class="col-r">
			<?=$selecttimezone?>
			<i id="setting-ntp" data-ntp="<?=$data->ntp?>" class="settingedit fa fa-gear"></i>
		</div>
	<heading>Audio</heading>
		<div class="col-l">I&#178;S Module</div>
		<div class="col-r i2s">
			<div id="divi2smodulesw"<?=( $data->i2ssysname ? ' class="hide"' : '' )?>>
				<input id="i2smodulesw" type="checkbox">
				<div class="switchlabel" for="i2smodulesw"></div>
			</div>
			<div id="divi2smodule"<?=( $data->i2ssysname ? '' : ' class="hide"' )?>>
				<select id="i2smodule" data-style="btn-default btn-lg">
					<?=$optioni2smodule?>
				</select>
			</div>
			<span class="help-block hide">I&#178;S modules are not plug-and-play capable. Select a driver for installed device.</span>
		</div>
		<div class="col-l">Sound Profile</div>
		<div class="col-r">
			<input id="soundprofile" type="checkbox" value="<?=$data->soundprofile?>"<?=( $data->soundprofile === 'default' ? '' : ' checked' )?>>
			<div class="switchlabel" for="soundprofile"></div>
			<i id="setting-soundprofile" class="setting fa fa-gear<?=( $data->soundprofile === 'default' ? ' hide' : '' )?>"></i>
			<span class="help-block hide">System kernel parameters tweak: eth0 mtu, eth0 txqueuelen, swappiness and sched_latency_ns.</span>
		</div>
<?php if ( $rpiwireless || $data->i2ssysname ) { ?>
	<heading>On-board devices</heading>
<?php } ?>
		<div id="divonboardaudio"<?=( $data->i2ssysname ? '' : ' class="hide"' )?>>
			<div class="col-l">Audio</div>
			<div class="col-r">
				<input id="onboardaudio" type="checkbox" <?=$data->onboardaudio?>>
				<div class="switchlabel" for="onboardaudio"></div>
				<span class="help-block hide">3.5mm phone and HDMI outputs.</span>
			</div>
		</div>
<?php if ( $rpiwireless ) {
		if ( file_exists( '/usr/bin/bluetoothctl' ) ) {
?>
		<div class="col-l">Bluetooth</div>
		<div class="col-r">
			<input id="bluetooth" type="checkbox" <?=$data->bluetooth?>>
			<div class="switchlabel" for="bluetooth"></div>
			<span class="help-block hide">Pairing has to be made via command line:
				<br><code>bluetoothctl</code> <code>scan on</code> <code>pair MACADDRESS</code>
				<br>Should be disabled if not used.</span>
		</div>
<?php	} ?>
		<div class="col-l">Wi-Fi</div>
		<div class="col-r">
			<input id="wlan" type="checkbox" <?=$data->wlan?>>
			<div class="switchlabel" for="wlan"></div>
			<span class="help-block hide">Should be disabled if not used.</span>
		</div>
<?php } ?>
	<heading>Features</heading>
<?php if ( file_exists( '/usr/bin/shairport-sync' ) ) { ?>
		<div class="col-l gr">AirPlay<i class="fa fa-airplay fa-lg wh"></i></div>
		<div class="col-r">
			<input id="airplay" type="checkbox" <?=$data->airplay?>>
			<div class="switchlabel" for="airplay"></div>
			<span class="help-block hide"><wh>Shairport Sync</wh> - Receive audio streaming via AirPlay protocol.</span>
		</div>
<?php } 
	  if ( file_exists( '/usr/bin/chromium' ) ) { ?>
		<div class="col-l gr">Browser on RPi<i class="fa fa-chromium fa-lg wh"></i></div>
		<div class="col-r">
			<input id="localbrowser" type="checkbox" data-cursor="<?=$data->cursor?>" data-overscan="<?=$data->overscan?>" data-rotate="<?=$data->rotate?>" data-screenoff="<?=$data->screenoff?>" data-zoom="<?=$data->zoom?>" <?=$data->localbrowser?>>
			<div class="switchlabel" for="localbrowser"></div>
			<i id="setting-localbrowser" class="setting fa fa-gear <?=( $data->localbrowser === 'checked' ? '' : 'hide' )?>"></i>
			<span class="help-block hide"><wh>Chromium</wh> - Browser on RPi connected screen. Overscan change needs a reboot.</span>
		</div>
<?php } 
	  if ( file_exists( '/usr/bin/smbd' ) ) { ?>
		<div class="col-l gr">File sharing<i class="fa fa-network fa-lg wh"></i></div>
		<div class="col-r">
			<input id="samba" type="checkbox" data-usb="<?=$data->readonlyusb?>" data-sd="<?=$data->readonlysd?>" <?=$data->samba?>>
			<div class="switchlabel" for="samba"></div>
			<i id="setting-samba" class="setting fa fa-gear <?=( $data->samba === 'checked' ? '' : 'hide' )?>"></i>
			<span class="help-block hide"><wh>Samba</wh> - Share your files in USB drives and SD card on your network.</span>
		</div>
<?php } ?>
		<div class="col-l gr">Password login<i class="fa fa-lock fa-lg wh"></i></div>
		<div class="col-r">
			<input id="password" type="checkbox"<?=( password_verify( 'rune', $data->password ) ? ' data-default="1"' : '' )?> <?=$data->login?>>
			<div class="switchlabel" for="password"></div>
			<i id="setting-password" class="setting fa fa-gear <?=( $data->login ? '' : 'hide' )?>"></i>
			<span class="help-block hide">Protect the UI with a password. (Default is "rune")</span>
		</div>
<?php if ( file_exists( '/usr/bin/upmpdcli' ) ) { ?>
		<div class="col-l gr">UPnP<i class="fa fa-upnp fa-lg wh"></i></div>
		<div class="col-r">
			<input id="upnp" type="checkbox"
				data-gmusicuser="<?=$data->gmusicuser?>"
				data-gmusicpass="<?=$data->gmusicpass?>"
				data-gmusicquality="<?=$data->gmusicquality?>"
				data-spotifyuser="<?=$data->spotifyuser?>"
				data-spotifypass="<?=$data->spotifypass?>"
				data-qobuzquality="<?=$data->qobuzquality?>"
				data-qobuzuser="<?=$data->qobuzuser?>"
				data-qobuzpass="<?=$data->qobuzpass?>"
				data-tidaluser="<?=$data->tidaluser?>"
				data-tidalpass="<?=$data->tidalpass?>"
				data-tidalquality="<?=$data->tidalquality?>"
				data-ownqueuenot="<?=$data->ownqueuenot?>"
			<?=$data->upnp?>>
			<div class="switchlabel" for="upnp"></div>
			<i id="setting-upnp" class="setting fa fa-gear <?=( $data->upnp === 'checked' ? '' : 'hide' )?>"></i>
			<span class="help-block hide"><wh>upmpdcli</wh> - Receive audio streaming via UPnP / DLNA.</span>
		</div>
<?php } ?>
<?php if ( file_exists( '/usr/bin/avahi-daemon' ) ) { ?>
		<div class="col-l gr">URL by name<i class="fa fa-external-link fa-lg wh"></i></div>
		<div class="col-r">
			<input id="avahi" type="checkbox"<?=$data->avahi?>>
			<div class="switchlabel" for="avahi"></div>
			<span class="help-block hide"><wh>Avahi</wh> - Connect URL by name(e.g., runeaudio.local) from remote browsers.
				<br>Should be disabled if not used.</span>
		</div>
<?php } ?>
	<div style="clear: both"></div>
</div>
