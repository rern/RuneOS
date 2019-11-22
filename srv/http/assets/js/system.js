$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

$( '#timezone, #i2smodule' ).selectric();

var dirsystem = '/srv/http/data/system';
var filereboot = '/srv/http/data/tmp/reboot';

$( '#hostname' ).click( function() {
	info( {
		  icon      : 'rune'
		, title     : 'Player Name'
		, textlabel : 'Name'
		, textvalue : $( '#hostname' ).val()
		, ok        : function() {
			var hostname = $( '#infoTextBox' ).val().replace( /[^a-zA-Z0-9]+/g, '_' );
			var hostnamelc = hostname.toLowerCase();
			$( '#hostname' ).val( hostname );
			local = 1;
			var cmd = [
				  'hostname "'+ hostnamelc +'"'
				, 'echo '+ hostname +' | tee /etc/hostname '+ dirsystem +'/hostname'
				, 'sed -i "s/zeroconf_name.*/zeroconf_name           \\"'+ hostname +'\\"/" /etc/mpd.conf'
				, 'sed -i "s/\\(.*\\[\\).*\\(\\] \\[.*\\)/\\1'+ hostnamelc +'\\2/" /etc/avahi/services/runeaudio.service'
				, 'sed -i "s/\\(.*localdomain \\).*/\\1'+ hostnamelc +'.local '+ hostnamelc +'/" /etc/hosts'
				, 'systemctl -q is-active bluetooth && bluetoothctl system-alias "'+ hostname +'"'
			];
			var service = 'systemctl try-restart avahi-daemon mpd';
			if ( $( '#accesspoint' ).length ) {
				cmd.push( 'sed -i "s/^ssid=.*/ssid='+ hostname +'/" /etc/hostapd/hostapd.conf' );
				service += ' hostapd';
			}
			if ( $( '#airplay' ).length ) {
				cmd.push( 'sed -i "s/name =.*/name = \\"'+ hostname +'\\"/" /etc/shairport-sync.conf' );
				service += ' shairport-sync shairport-meta';
			}
			if ( $( '#samba' ).length ) {
				cmd.push( 'sed -i "s/netbios name = .*/netbios name = '+ hostname +'/" /etc/samba/smb.conf' );
				service += ' nmb smb';
			}
			if ( $( '#localbrowser' ).length ) cmd.push( 'rm /srv/http/.config/chromium/SingletonLock' );
			if ( $( '#upnp' ).length ) {
				cmd.push( 'sed -i "s/^friendlyname.*/friendlyname = '+ hostname +'/" /etc/upmpdcli.conf' );
				service += ' upmpdcli';
			}
			cmd.push(
				  'systemctl try-restart '+ service
				, pstream( 'system' )
			);
			$.post( 'commands.php', { bash: cmd }, resetlocal );
		}
	} );
} );
$( '#setting-ntp' ).click( function() {
	info( {
		  icon      : 'stopwatch'
		, title     : 'NTP Server'
		, textlabel : 'URL'
		, textvalue : $( '#setting-ntp' ).data( 'ntp' )
		, ok        : function() {
			var ntp = $( '#infoTextBox' ).val();
			$( '#setting-ntp' ).data( 'ntp', ntp )
			local = 1;
			$.post( 'commands.php', { bash: [
				  "sed -i 's/^NTP=.*/NTP="+ ntp +"/' /etc/systemd/timesyncd.conf"
				, 'echo '+ ntp +' > '+ dirsystem +'/ntp'
				, pstream( 'system' )
			] }, resetlocal );
		}
	} );
} );
$( '#timezone' ).on( 'selectric-change', function() {
	var timezone = $( this ).find( ':selected' ).val();
	$.post( 'commands.php', { bash: [ 
		  'timedatectl set-timezone '+ timezone
		, 'echo '+ timezone +' > '+ dirsystem +'/timezone'
		, pstream( 'system' )
	] } );
	// no local = 1; > self reload
} );
$( 'body' ).on( 'click touchstart', function( e ) {
	if ( !$( e.target ).closest( '.i2s' ).length
		&& $( '#i2smodule option:selected' ).val() === 'none'
	) {
		$( '#divi2smodulesw' ).removeClass( 'hide' );
		$( '#divi2smodule' ).addClass( 'hide' );
	}
} );
$( '#i2smodulesw' ).click( function() {
	// delay to show switch sliding
	setTimeout( function() {
		$( '#divi2smodulesw' ).addClass( 'hide' );
		$( '#divi2smodule' ).removeClass( 'hide' );
		$( '#i2smodulesw' ).prop( 'checked', 0 );
	}, 200 );
} );
$( '#i2smodule' ).on( 'selectric-change', function() {
	var $selected = $( this ).find( ':selected' );
	var sysname = $selected.val();
	var name = $selected.text();
	if ( sysname !== 'none' ) {
		local = 1;
		$.post( 'commands.php', { bash: [
			  'sed -i'
					+" -e '/^dtoverlay/ d'"
					+" -e '/^#dtparam=i2s=on/ s/^#//'"
					+" -e 's/dtparam=audio=.*/dtparam=audio=off/'"
					+" -e '$ a\dtoverlay="+ sysname +"'"
					+' /boot/config.txt'
			, "echo 'Enable "+ name +"' > "+ filereboot
			, "echo '"+ name +"' > "+ dirsystem +'/audiooutput'
			, 'echo '+ sysname +' > '+ dirsystem +'/sysname'
			, 'rm -f '+ dirsystem +'/onboard-audio'
			, pstream( 'system' )
		] }, resetlocal );
		$( '#onboardaudio' ).prop( 'checked', 0 );
		$( '#divonboardaudio' ).removeClass( 'hide' );
	} else {
		local = 1;
		$.post( 'commands.php', { bash: [
			  'sed -i'
				+" -e '/^dtoverlay/ d'"
				+" -e '/^dtparam=i2s=on/ s/^/#/'"
				+" -e 's/dtparam=audio=.*/dtparam=audio=on/'"
				+' /boot/config.txt'
			, "echo 'Disable I&#178;S Module' > "+ filereboot
			, 'echo bcm2835 ALSA_1 > '+ dirsystem +'/audiooutput'
			, 'rm -f '+ dirsystem +'/sysname'
			, 'echo 1 > '+ dirsystem +'/onboard-audio'
			, pstream( 'system' )
		] }, resetlocal );
		$( this ).addClass( 'hide' );
		$( '#divi2smodule, #divonboardaudio' ).addClass( 'hide' );
		$( '#divi2smodulesw' ).removeClass( 'hide' );
	}
} );
$( '#soundprofile' ).change( function() {
	if ( $( this ).prop( 'checked' ) ) {
		var profile = 'RuneAudio';
		$( '#setting-soundprofile' ).removeClass( 'hide' );
	} else {
		var profile = 'default';
		$( '#setting-soundprofile' ).addClass( 'hide' );
	}
	$( this ).val( profile );
	local = 1;
	$.post( 'commands.php', { bash: [
		  '/srv/http/settings/system-soundprofile.sh '+ profile
		, 'echo '+ profile +' > '+ dirsystem +'/soundprofile'
		, pstream( 'system' )
	] }, resetlocal );
} );
$( '#setting-soundprofile' ).click( function() {
	info( {
		  icon    : 'mpd'
		, title   : 'Sound Profile'
		, radio   : { RuneAudio: 'RuneAudio', ACX: 'ACX', Orion: 'Orion', OrionV2: 'OrionV2', OrionV3: 'OrionV3', Um3ggh1U: 'Um3ggh1U' }
		, checked : $( '#soundprofile' ).val()
		, ok      : function() {
			var profile = $( '#infoRadio input[ type=radio ]:checked' ).val();
			$( '#soundprofile' ).val( profile );
			local = 1;
			$.post( 'commands.php', { bash: [
				  '/srv/http/settings/system-soundprofile.sh '+ profile
				, 'echo '+ profile +' > '+ dirsystem +'/soundprofile'
				, pstream( 'system' )
			] }, resetlocal );
		}
	} );
} );
$( '#onboardaudio' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i 's/dtparam=audio=.*/dtparam=audio=on/' /boot/config.txt"
			, 'echo 1 > '+ dirsystem +'/onboard-audio'
			, 'echo "Enable on-board audio" > '+ filereboot
			, pstream( 'system' )
		] }, resetlocal );
	} else {
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i 's/dtparam=audio=.*/dtparam=audio=off/' /boot/config.txt"
			, 'rm -f '+ dirsystem +'/onboard-audio'
			, 'echo "Disable on-board audio" > '+ filereboot
			, pstream( 'system' )
		] }, resetlocal );
	}
} );
$( '#bluetooth' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i -e '/^dtoverlay=disable-bt/ s/^/#/' -e '/^#dtoverlay=bcmbt/ s/^#//' /boot/config.txt"
			, 'systemctl enable bluetooth'
			, 'echo 1 > '+ dirsystem +'/onboard-bluetooth'
			, 'echo Enable on-board Bluetooth > '+ filereboot
			, pstream( 'system' )
		] }, resetlocal );
	} else {
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i -e '/^#dtoverlay=disable-bt/ s/^#//' -e '/^dtoverlay=bcmbt/ s/^/#/' /boot/config.txt"
			, 'systemctl disable --now bluetooth'
			, 'rm -f '+ dirsystem +'/onboard-bluetooth'
			, 'echo Disable on-board Bluetooth > '+ filereboot
			, pstream( 'system' )
		] }, resetlocal );
	}
} );
$( '#wlan' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i '/^dtoverlay=disable-wifi/ s/^/#/' /boot/config.txt"
			, 'systemctl enable netctl-auto@wlan0'
			, 'echo 1 > '+ dirsystem +'/onboard-wlan'
			, 'echo Enable on-board Wi-Fi > '+ filereboot
			, pstream( 'network' )
			, pstream( 'system' )
		] }, resetlocal );
	} else {
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i '/^#dtoverlay=disable-wifi/ s/^#//' /boot/config.txt"
			, 'systemctl disable --now netctl-auto@wlan0'
			, 'ifconfig wlan0 down'
			, 'echo disabled > '+ dirsystem +'/onboard-wlan'
			, 'echo Disable on-board Wi-Fi > '+ filereboot
			, 'rm -f '+ dirsystem +'/{accesspoint,accesspointsetting}'
			, pstream( 'network' )
			, pstream( 'system' )
		] }, resetlocal );
		$( '#accesspoint' ).prop( 'checked', 0 );
	}
} );
$( '#airplay' ).click( function() {
	var O = getCheck( $( this ) );
	local = 1;
	$.post( 'commands.php', { bash: [
		  'systemctl '+ O.enabledisable +' --now shairport-sync shairport-meta'
		, ( O.onezero ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/airplay'
		, pstream( 'system' )
	] }, resetlocal );
} );
$( '#localbrowser' ).click( function() {
	var O = getCheck( $( this ) );
	local = 1;
	if ( O.onezero ) {
		var cmd = [
			  "sed -i 's/\\(console=\\).*/\\1tty3 plymouth.enable=0 quiet loglevel=0 logo.nologo vt.global_cursor_default=0/' /boot/cmdline.txt"
			, 'systemctl enable --now localbrowser'
		];
	} else {
		var cmd = [
			  "sed -i 's/\\(console=\\).*/\\1tty1/' /boot/cmdline.txt"
			, 'systemctl disable --now localbrowser'
		];
	}
	cmd.push( pstream( 'system' ) );
	$.post( 'commands.php', { bash: cmd }, resetlocal );
	$( '#setting-localbrowser' ).toggleClass( 'hide', !O.onezero );
} );
$( '#setting-localbrowser' ).click( function() {
	var html = heredoc( function() { /*
		<div id="infoText" class="infocontent">
			<div id="infotextlabel">
				<a class="infolabel">
					Screen off <gr>(min)</gr><br>
					Zoom <gr>(0.5-2.0)</gr>
				</a>
			</div>
			<div id="infotextbox">
				<input type="text" class="infoinput" id="infoTextBox" spellcheck="false" style="width: 60px; text-align: center">
				<input type="text" class="infoinput" id="infoTextBox1" spellcheck="false" style="width: 60px; text-align: center">
			</div>
		</div>
		<hr>
		Screen rotation<br>
		<div id="infoRadio" class="infocontent infohtml" style="text-align: center">
			&ensp;0°<br>
			<label><input type="radio" name="inforadio" value="NORMAL"></label><br>
			&nbsp;<label>90°&ensp;<i class="fa fa-undo"></i>&ensp;<input type="radio" name="inforadio" value="CCW"></label>&emsp;&emsp;&ensp;
			<label><input type="radio" name="inforadio" value="CW"> <i class="fa fa-redo"></i>&ensp;90°&nbsp;</label><br>
			<label><input type="radio" name="inforadio" value="UD"></label><br>
			&nbsp;180°
		</div>
		<hr>
		<div id="infoCheckBox" class="infocontent infohtml">
			<label><input type="checkbox">&ensp;Mouse pointer</label><br>
			<label><input type="checkbox">&ensp;Overscan <gr>(Reboot needed)</gr></label>
		</div>
	*/ } );
	info( {
		  icon        : 'chromium'
		, title       : 'Browser on RPi'
		, content     : html
		, preshow     : function() {
			$( '#infoTextBox1' ).val( $( '#localbrowser' ).data( 'zoom' ) );
			$( '#infoTextBox' ).val( $( '#localbrowser' ).data( 'screenoff' ) );
			$( '#infoRadio input[value='+ $( '#localbrowser' ).data( 'rotate' ) +']' ).prop( 'checked', true )
			$( '#infoCheckBox input:eq( 0 )' ).prop( 'checked', $( '#localbrowser' ).data( 'cursor' ) );
			$( '#infoCheckBox input:eq( 1 )' ).prop( 'checked', $( '#localbrowser' ).data( 'overscan' ) );
		}
		, buttonlabel : '<i class="fa fa-refresh"></i>Refresh'
		, buttoncolor : '#de810e'
		, button      : function() {
			$.post( 'commands.php', { bash: 'curl -s -X POST "http://127.0.0.1/pub?id=reload" -d 1' } );
		}
		, buttonwidth : 1
		, ok          : function() {
			var screenoff = $( '#infoTextBox' ).val();
			var zoom = parseFloat( $( '#infoTextBox1' ).val() ) || 1;
			zoom = zoom < 2 ? ( zoom < 0.5 ? 0.5 : zoom ) : 2;
			var cursor = $( '#infoCheckBox input:eq( 0 )' ).prop( 'checked' ) ? 1 : 0;
			var rotate = $( '#infoRadio input[ type=radio ]:checked' ).val();
			var overscan = $( '#infoCheckBox input:eq( 1 )' ).prop( 'checked' ) ? 1 : 0;
			$( '#localbrowser' )
				.data( 'zoom', zoom )
				.data( 'screenoff', screenoff )
				.data( 'cursor', cursor )
				.data( 'rotate', rotate )
				.data( 'overscan', overscan );
			var localbrowser = dirsystem +'/localbrowser-';
			var cmd = [];
			cmd.push( ( zoom != 1 ? 'echo '+ zoom +' > ' : 'rm ' ) + localbrowser +'zoom' );
			cmd.push( ( cursor ? 'echo 1 > ' : 'rm ' ) + localbrowser +'cursor' );
			cmd.push( ( screenoff != 0 ? 'echo '+ ( screenoff * 60 ) +' > ' : 'rm ' ) + localbrowser +'screenoff' );
			cmd.push( ( rotate !== 'NORMAL' ? 'echo '+ rotate +' > ' : 'rm ' ) + localbrowser +'rotate' );
			cmd.push( ( overscan ? 'echo '+ overscan +' > ' : 'rm ' ) + localbrowser +'overscan' );
			
			cmd.push(
				  'sed -i -e "s/-use_cursor.*/-use_cursor '+ ( cursor == 1 ? 'yes \\&' : 'no \\&' ) +'/'
						+'" -e "s/factor=.*/factor='+ zoom +'/'
				, 		+'" -e "s/xset dpms .*/xset dpms 0 0 '+ ( screenoff * 60 ) +' \\\&/" /etc/X11/xinit/xinitrc'
				, 'ln -sf /srv/http/assets/img/'+ rotate +'.png /usr/share/bootsplash/start.png'
			);
			
			if ( rotate === 'NORMAL' ) {
				cmd.push( 'rm /etc/X11/xorg.conf.d/99-raspi-rotate.conf' );
			} else {
				var matrix = {
					  CW     : '0 1 0 -1 0 1 0 0 1'
					, CCW    : '0 -1 1 1 0 0 0 0 1'
					, UD     : '-1 0 1 0 -1 1 0 0 1'
				}
				var rotatecontent = heredoc( function() { /*
Section "Device"
	Identifier "RpiFB"
	Driver "fbdev"
	Option "rotate" "ROTATION_SETTING"
EndSection

Section "InputClass"
	Identifier "Touchscreen"
	Driver "libinput"
	MatchIsTouchscreen "on"
	MatchDevicePath "/dev/input/event*"
	Option "calibrationmatrix" "MATRIX_SETTING"
EndSection

Section "Monitor"
	Identifier "generic"
EndSection

Section "Screen"
	Identifier "screen1"
	Device "RpiFB"
	Monitor "generic"
EndSection

Section "ServerLayout"
	Identifier "slayo1"
	Screen "screen1"
EndSection
*/ } );
				rotatecontent = rotatecontent.replace( 'ROTATION_SETTING', rotate ).replace( 'MATRIX_SETTING', matrix[ rotate ] );
				cmd.push( "echo '"+ rotatecontent +"' > /etc/X11/xorg.conf.d/99-raspi-rotate.conf" );
			}
			cmd.push( 'ln -sf /srv/http/assets/img/'+ rotate +'.png /usr/share/bootsplash/start.png' );
			
			if ( overscan ) {
				cmd.push( "sed -i '/^disable_overscan=1/ s/^/#/' /boot/config.txt" );
			} else {
				cmd.push( "sed -i '/^#disable_overscan=1/ s/^#//' /boot/config.txt" );
			}
			
			cmd.push( 
				  'systemctl try-restart localbrowser'
				, pstream( 'system' )
			);
			local = 1;
			localbrowser = dirsystem +'/localbrowser-';
			$.post( 'commands.php', { bash: cmd }, function() {
				resetlocal();
				bannerHide();
			} );
			notify( 'Browser on RPi', 'Restarting ...', 'chromium', -1 );
		}
	} );
} );
$( '#password' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		local = 1;
		$.post( 'commands.php', { bash: [
			  'echo 1 > '+ dirsystem +'/login'
			, "sed -i 's/bind_to_address.*/bind_to_address         \"127.0.0.1\"/' /etc/mpd.conf"
			, pstream( 'system' )
		] }, resetlocal );
		$( '#setting-password' ).removeClass( 'hide' );
		if ( $( this ).data( 'default' ) ) {
			info( {
				  icon    : 'lock'
				, title   : 'Password'
				, message : 'Default password is <wh>rune</wh>'
			} );
		}
	} else {
		local = 1;
		$.post( 'commands.php', { bash: [
			  'rm -f '+ dirsystem +'/login'
			, "sed -i 's/bind_to_address.*/bind_to_address         \"0.0.0.0\"/' /etc/mpd.conf"
			, pstream( 'system' )
		] }, resetlocal );
		$( '#setting-password' ).addClass( 'hide' );
	}
} );
$( '#setting-password' ).click( function() {
	info( {
		  icon          : 'lock'
		, title         : 'Change Password'
		, passwordlabel : [ 'Existing', 'New' ]
		, ok            : function() {
			$.post( 'commands.php', { login: $( '#infoPasswordBox' ).val(), pwdnew: $( '#infoPasswordBox1' ).val() }, function( data ) {
				info( {
					  icon    : 'lock'
					, title   : 'Change Password'
					, nox     : 1
					, message : ( data ? 'Password changed' : 'Wrong existing password' )
				} );
			} );
		}
	} );
} );
$( '#samba' ).click( function() {
	var O = getCheck( $( this ) );
	local = 1;
	$.post( 'commands.php', { bash: [
		  'systemctl '+ O.enabledisable +' --now nmb smb'
		, ( O.onezero ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/samba'
		, pstream( 'system' )
	] }, resetlocal );
	$( '#setting-samba' ).toggleClass( 'hide', !O.onezero );
} );
$( '#setting-samba' ).click( function() {
	info( {
		  icon     : 'network'
		, title    : 'Samba File Sharing'
		, message  : '<wh>Write</wh> permission:'
		, checkbox : { '/mnt/MPD/SD': 1, '/mnt/MPD/USB': 1 }
		, preshow  : function() {
			if ( $( '#samba' ).data( 'sd' ) ) $( '#infoCheckBox input:eq( 0 )' ).prop( 'checked', 1 );
			if ( $( '#samba' ).data( 'usb' ) ) $( '#infoCheckBox input:eq( 1 )' ).prop( 'checked', 1 );
		}
		, ok       : function() {
			var cmd = "sed -i -e '/read only = no/ d'";
			if ( $( '#infoCheckBox input:eq( 0 )' ).prop( 'checked' ) ) {
				cmd += " -e '/path = .*SD/ a\\\\tread only = no'";
				var sd = 1;
				$( '#samba' ).data( 'sd', 1 );
			} else {
				var sd = 0;
				$( '#samba' ).data( 'sd', 0 );
			}
			if ( $( '#infoCheckBox input:eq( 1 )' ).prop( 'checked' ) ) {
				cmd += " -e '/path = .*USB/ a\\\\tread only = no'";
				var usb = 1;
				$( '#samba' ).data( 'usb', 1 );
			} else {
				var usb = 0;
				$( '#samba' ).data( 'usb', 0 );
			}
			local = 1;
			cmd = [
				  cmd +' /etc/samba/smb.conf'
				, 'systemctl try-restart nmb smb'
				, 'rm -f '+ dirsystem +'/samba-*'
			];
			if ( sd ) cmd.push( 'echo '+ sd +' > '+ dirsystem +'/samba-writesd' );
			if ( usb ) cmd.push( 'echo '+ usb +' > '+ dirsystem +'/samba-writeusb' );
			cmd.push( pstream( 'system' ) );
			$.post( 'commands.php', { bash: cmd }, resetlocal );
		}
	} );
} );
$( '#upnp' ).click( function() {
	var O = getCheck( $( this ) );
	local = 1;
	$.post( 'commands.php', { bash: [
		  'systemctl '+ O.enabledisable +' --now upmpdcli'
		, ( O.onezero ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/upnp'
		, pstream( 'system' )
	] }, resetlocal );
	$( '#setting-upnp' ).toggleClass( 'hide', !O.onezero );
} );
var htmlservice = heredoc( function() { /*
	<div id="SERVICE" class="infocontent infocheckbox infohtml">
		<div class="infotextlabel"></div>
		<div class="infotextbox" style="width: 230px">
			<label data-service="SERVICE" style="width: 200px; margin-left: 45px;"><input type="checkbox">&ensp;<i class="fa fa-SERVICE fa-lg gr"></i>&ensp;TITLE</label>
		</div>
	</div>
	<div id="SERVICEdata" class="infocontent">
		<div class="infotextlabel">
			<a class="infolabel">
				User<br>
				Password<br>
				Quality</gr>
			</a>
		</div>
		<div class="infotextbox" style="width: 230px">
			<input type="text" class="infoinput" id="SERVICEuser" spellcheck="false">
			<input type="password" class="infoinput infopasswordbox" id="SERVICEpass" spellcheck="false"><i class="eye fa fa-eye fa-lg"></i><br>
			<label><input type="radio" class="inforadio" name="SERVICEquality" value="lossless"> Lossless</label>&ensp;
			<label><input type="radio" class="inforadio" name="SERVICEquality" value="high"> High</label>&ensp;
			<label><input type="radio" class="inforadio" name="SERVICEquality" value="low"> Low</label>
		</div>
		<hr>
	</div>
*/ } );
var htmlgmusic = htmlservice
						.replace( /SERVICE/g, 'gmusic' )
						.replace( /TITLE/, 'Google Music' )
						.replace( /lossless/, 'hi' )
						.replace( /high/, 'med' );
var htmlqobuz = htmlservice
						.replace( /SERVICE/g, 'qobuz' )
						.replace( /TITLE/, 'Qobuz' )
						.replace( /.*Low.*/, '&emsp;&emsp;&emsp;&emsp;&emsp;' )
						.replace( /lossless/, '7' )
						.replace( /high/, '5' );
var htmlspotify = htmlservice
						.replace( /SERVICE/g, 'spotify' )
						.replace( /TITLE/, 'Spotify' )
						.replace( /.*Quality.*|.*Lossless.*|.*High.*|.*Low.*/g, '' )
						.replace( /lossless/, '7' )
						.replace( /high/, '5' );
var htmltidal = htmlservice
						.replace( /SERVICE/g, 'tidal' )
						.replace( /TITLE/, 'Tidal' );
var htmlownqueue = heredoc( function() { /*
	<div id="ownqueuenot" class="infocontent infocheckbox infohtml">
		<br>
		<label>Keep existing Playlist&ensp;<input type="checkbox"></label><br>
	</div>
*/ } );
function preshow( service ) {
	var user = $( '#upnp' ).data( service +'user' );
	var pass = $( '#upnp' ).data( service +'pass' );
	var quality = $( '#upnp' ).data( service +'quality' );
	if ( user ) {
		$( '#'+ service +' input[type=checkbox]' ).prop( 'checked', 1 );
		$( '#'+ service +'data input[type=text]' ).val( user );
		$( '#'+ service +'data input[type=password]' ).val( pass );
		$( 'input[name='+ service +'quality][value='+ quality +']' ).prop( 'checked', 1 );
	} else {
		$( '#'+ service +' input' ).prop( 'checked', 0 );
		$( '#'+ service +'data' ).hide();
	}
	$( '#ownqueuenot input' ).prop( 'checked', $( '#upnp' ).data( 'ownqueuenot' ) );
}
$( '#setting-upnp' ).click( function() {
	info( {
		  icon     : 'upnp'
		, title    : 'UPnP / upnp'
		, content  : htmlgmusic + htmlqobuz + htmlspotify + htmltidal + htmlownqueue
		, preshow  : function() {
			[ 'tidal', 'qobuz', 'gmusic', 'spotify' ].forEach( function( service ) {
				preshow( service );
			} );
			$( '#ownqueuenot input' ).prop( 'checked', $( '#upnp' ).data( 'ownqueuenot' ) );
		}
		, ok       : function() {
			local = 1;
			
			var cmd = "sed -i";
			var value = {};
			[ 'tidal', 'qobuz', 'gmusic', 'spotify' ].forEach( function( service ) {
				var user = $( '#'+ service +'user' ).val();
				var pass = $( '#'+ service +'pass' ).val();
				var quality = $( 'input[name='+ service +'quality]:checked' ).val();
				value[ service ] = [ user, pass, quality ];
				if ( $( '#'+ service +' input' ).prop( 'checked' ) ) {
					if ( user && pass ) {
						$( '#upnp' )
									.data( service +'user', user )
									.data( service +'pass', pass )
									.data( service +'quality', quality );
						cmd += " -e 's/#*\\("+ service +"user = \\).*/\\1"+ user +"/'"
								 +" -e 's/#*\\("+ service +"pass = \\).*/\\1"+ pass +"/'";
						if ( service === 'qobuz' ) {
							cmd += " -e 's/#*\\(qobuzformatid = \\).*/\\1"+ quality +"/'";
						} else if ( service === 'gmusic' || service === 'tidal' ) {
							cmd += " -e 's/#*\\("+ service +"quality = \\).*/\\1"+ quality +"/'";
						}
					} else {
						info( {
							  icon     : 'upnp'
							, title    : 'UPnP / upnp'
							, message  : 'User and Password cannot be blank.'
						} );
					}
				} else {
						$( '#upnp' )
									.data( service +'user', null )
									.data( service +'pass', null )
									.data( service +'quality', null );
					cmd += " -e '/^"+ service +".*/ s/^/#/'";
				}
			} );
			cmd += $( '#ownqueuenot input' ).prop( 'checked' ) ? " -e '/^#ownqueue =/ a\\ownqueue = 0'" : " -e '/ownqueue = 0/ d'";
			cmd = [
				  cmd +' /etc/upmpdcli.conf'
				, 'systemctl try-restart upmpdcli'
				, 'rm -f '+ dirsystem +'/upnp-*'
			]
			if ( value.gmusic[ 0 ] ) cmd.push(
				  'echo '+ value.gmusic[ 0 ] +' > '+ dirsystem +'/upnp-gmusicuser'
				, 'echo '+ value.gmusic[ 1 ] +' > '+ dirsystem +'/upnp-gmusicpass'
				, 'echo '+ value.gmusic[ 2 ] +' > '+ dirsystem +'/upnp-gmusicquality'
			);
			if ( value.qobuz[ 0 ] ) cmd.push(
				  'echo '+ value.qobuz[ 0 ] +' > '+ dirsystem +'/upnp-qobuzuser'
				, 'echo '+ value.qobuz[ 1 ] +' > '+ dirsystem +'/upnp-qobuzpass'
				, 'echo '+ value.qobuz[ 2 ] +' > '+ dirsystem +'/upnp-qobuzquality'
			);
			if ( value.spotify[ 0 ] ) cmd.push(
				  'echo '+ value.spotify[ 0 ] +' > '+ dirsystem +'/upnp-spotifyuser'
				, 'echo '+ value.spotify[ 1 ] +' > '+ dirsystem +'/upnp-spotifypass'
			);
			if ( value.tidal[ 0 ] ) cmd.push(
				  'echo '+ value.tidal[ 0 ] +' > '+ dirsystem +'/upnp-tidaluser'
				, 'echo '+ value.tidal[ 1 ] +' > '+ dirsystem +'/upnp-tidalpass'
				, 'echo '+ value.tidal[ 2 ] +' > '+ dirsystem +'/upnp-tidalquality'
			);
			cmd.push( pstream( 'system' ) );
			$.post( 'commands.php', { bash: cmd }, resetlocal );
		}
	} );
} );
$( '#avahi' ).click( function() {
	var O = getCheck( $( this ) );
	local = 1;
	$.post( 'commands.php', { bash: [
		  'systemctl '+ O.enabledisable +' --now avahi-daemon'
		, ( O.onezero ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/avahi'
		, pstream( 'system' )
	] }, resetlocal );
} );

$( '#infoContent' ).on( 'click', '.infocheckbox', function() {
	$( '#'+ this.id +'data' ).toggle();
	if ( !$( 'input[name='+ this.id +'quality]:checked' ).length ) $( 'input[name='+ this.id +'quality]:eq( 0 )' ).prop( 'checked', true );
	
} );
var debounce;
$( '#infoContent' ).on( 'click', '.infocheckbox label', function() {
	var $this = $( this );
	clearTimeout( debounce );
	debounce = setTimeout( function() {
		$( '#'+ $this.data( 'service' ) +'data' ).toggle( $this.find( 'input' ).prop( 'checked' ) ) 
	}, 50 );
} );
setInterval( function() {
	$.post( 'commands.php', { bash:[
		  "date +'%F<gr> &bull; </gr>%R'"
		, "uptime -p | cut -d' ' -f2- | tr -d ','"
		, 'cat /sys/class/thermal/thermal_zone0/temp'
	] }, function( data ) {
		$( '#date' ).html( data[ 0 ] );
		$( '#uptime' ).text( data[ 1 ] );
		$( '#cputemp' ).text( Math.round( data[ 2 ] / 1000 ) );
	}, 'json' );
}, 10000 );

function getCheck( $this ) {
	var O = {};
	if ( $this.prop( 'checked' ) ) {
		O.startstop = 'start';
		O.enabledisable = 'enable';
		O.onezero = 1;
	} else {
		O.startstop = 'stop';
		O.enabledisable = 'disable';
		O.onezero = 0;
	}
	return O
}

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
