<?php
$data = json_decode( shell_exec( '/srv/http/settings/system-data.sh' ) );
$hardwarecode = $data->hardwarecode;
$hwcode = substr( $hardwarecode, -3, 2 );
switch( $hwcode ) {
	case '00':
	case '01':
	case '02':
	case '03': $cpu = '700MHz';     break;
	case '04': $cpu = '4 @ 900MHz'; break;
	case '09':
	case '0c': $cpu = '1GHz';       break;
	case '08': $cpu = '4 @ 1.2GHz'; break;
	case '0e':
	case '0d': $cpu = '4 @ 1.4GHz'; $soc.='B0'; break;
	case '11': $cpu = '4 @ 1.5GHz';
}
switch( substr( $hardwarecode, -4, 1 ) ) {
	case '0': $soc = 'BCM2835'; break;
	case '1': $soc = 'BCM2836'; break;
	case '2': $soc = 'BCM2837'; break;
	case '3': $soc = 'BCM2711';
}
switch( substr( $hardwarecode, -6, 1 ) ) {
	case '9': $memory = '512KB'; break;
	case 'a': $memory = '1GB';   break;
	case 'b': $memory = '2GB';   break;
	case 'c': $memory = '4GB';
}
$rpiwireless = in_array( $hwcode, [ '0c', '08', '0e', '0d', '11' ] ); // rpi zero w, rpi3, rpi4
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

include '/srv/http/settings/system-i2smodules.php';
$i2senabled = 0;
$optioni2smodule = '';
foreach( $i2slist as $name => $sysname ) {
	if ( $name === $data->audiooutput && $sysname === $data->audioaplayname ) {
		$i2sselected = ' selected';
		$i2senabled = 1;
	} else {
		$i2sselected = '';
	}
	$optioni2smodule.= "<option value=\"$sysname\"$i2sselected>$name</option>";
}
if ( $data->accesspoint ) echo '<input id="accesspoint" type="hidden">';
$bullet = '<gr> &bull; </gr>';
include 'logosvg.php';
?>
<div id="loader"><svg viewBox="0 0 480.2 144.2"><?=$logo?></svg></div>
<div class="container">
	<heading>System Status</heading>
		<div class="col-l text gr">
			RuneAudio<br>
			Kernel<br>
			Hardware<br>
			SoC<br>
			Root partition<br>
			Time<br>
			Up time<br>
			IP address<br>
			CPU Load
		</div>
		<div class="col-r text">
			<i class="fa fa-addons gr" style="line-height: 20px;"></i> <?=$data->version?><br>
			<?=$data->kernel?><br>
			<?=$data->hardware?><br>
			<?=$soc.$bullet.$cpu.$bullet.$memory?><br>
			<?=$data->rootfs?><br>
			<?=$data->date?><gr> @ </gr><?=$zonestring?><br>
			<?=$data->uptime?> <gr>since <?=$data->since?></gr><br>
			<?=$data->ip?><br>
			<?=$data->cpuload.$bullet.$data->cputemp?>°C
			<span class="<?=( $data->undervoltage ? '' : 'hide' )?>"><br><span id="undervoltage"><?=$data->undervoltage?></span> <a class="red">Under-voltage detected</a></span>
		</div>
	<heading>Environment</heading>
		<div class="col-l">Player name</div>
		<div class="col-r">
			<input type="text" id="hostname" value="<?=$data->hostname?>" readonly style="cursor: pointer">
			<span class="help-block hide">Name broadcasted by RPi access point, AirPlay, Samba and UPnP.</span>
		</div>
		<div class="col-l">Timezone</div>
		<div class="col-r">
			<?=$selecttimezone?>
			<i id="setting-ntp" data-ntp="<?=$data->ntp?>" class="settingedit fa fa-gear"></i>
		</div>
	<heading>Audio</heading>
		<div class="col-l">I&#178;S Module</div>
		<div class="col-r i2s">
			<div id="divi2smodulesw"<?=( $i2senabled ? ' class="hide"' : '' )?>>
				<input id="i2smodulesw" type="checkbox">
				<div class="switchlabel" for="i2smodulesw"></div>
			</div>
			<div id="divi2smodule"<?=( $i2senabled ? '' : ' class="hide"' )?>>
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
			<span class="help-block hide">System kernel parameters tweak: <code>eth0 mtu</code> <code>eth0 txqueuelen</code> <code>swappiness</code> <code>sched_latency_ns</code></span>
		</div>
<?php if ( $rpiwireless || $data->audioaplayname ) { ?>
	<heading>On-board devices</heading>
<?php } ?>
		<div id="divonboardaudio"<?=( $data->audioaplayname ? '' : ' class="hide"' )?>>
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
			<span class="help-block hide"><code>Shairport Sync</code> - Receive audio streaming via AirPlay protocol.</span>
		</div>
<?php } 
	  if ( file_exists( '/usr/bin/chromium' ) ) { ?>
		<div class="col-l gr">Browser on RPi<i class="fa fa-chromium fa-lg wh"></i></div>
		<div class="col-r">
			<input id="localbrowser" type="checkbox" data-cursor="<?=$data->cursor?>" data-overscan="<?=$data->overscan?>" data-rotate="<?=$data->rotate?>" data-screenoff="<?=$data->screenoff?>" data-zoom="<?=$data->zoom?>" <?=$data->localbrowser?>>
			<div class="switchlabel" for="localbrowser"></div>
			<i id="setting-localbrowser" class="setting fa fa-gear <?=( $data->localbrowser === 'checked' ? '' : 'hide' )?>"></i>
			<span class="help-block hide"><code>Chromium</code> - Browser on RPi connected screen. (Overscan change needs reboot.)</span>
		</div>
<?php } 
	  if ( file_exists( '/usr/bin/smbd' ) ) { ?>
		<div class="col-l gr">File sharing<i class="fa fa-network fa-lg wh"></i></div>
		<div class="col-r">
			<input id="samba" type="checkbox" data-usb="<?=$data->readonlyusb?>" data-sd="<?=$data->readonlysd?>" <?=$data->samba?>>
			<div class="switchlabel" for="samba"></div>
			<i id="setting-samba" class="setting fa fa-gear <?=( $data->samba === 'checked' ? '' : 'hide' )?>"></i>
			<span class="help-block hide"><code>Samba</code> - Share files on RuneAudio.</span>
		</div>
<?php } ?>
		<div class="col-l gr">Password login<i class="fa fa-lock fa-lg wh"></i></div>
		<div class="col-r">
			<input id="password" type="checkbox"<?=( password_verify( 'rune', $data->password ) ? ' data-default="1"' : '' )?> <?=$data->login?>>
			<div class="switchlabel" for="password"></div>
			<i id="setting-password" class="setting fa fa-gear <?=( $data->login ? '' : 'hide' )?>"></i>
			<span class="help-block hide">Browser interface login. (Default: <code>rune</code>)</span>
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
			<span class="help-block hide"><code>upmpdcli</code> - Receive audio streaming via UPnP / DLNA.</span>
		</div>
<?php } ?>
<?php if ( file_exists( '/usr/bin/avahi-daemon' ) ) { ?>
		<div class="col-l gr">URL by name<i class="fa fa-external-link fa-lg wh"></i></div>
		<div class="col-r">
			<input id="avahi" type="checkbox"<?=$data->avahi?>>
			<div class="switchlabel" for="avahi"></div>
			<span class="help-block hide"><code>Avahi</code> - Connect URL by player name (e.g., <code>runeaudio.local</code>) from remote browsers.</span>
		</div>
<?php } ?>
	<div style="clear: both"></div>
</div>
