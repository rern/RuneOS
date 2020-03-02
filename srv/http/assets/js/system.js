$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

$( '#timezone, #i2smodule' ).selectric( { maxHeight: 400 } );
$( '.selectric-input' ).prop( 'readonly', 1 ); // fix - suppress screen keyboard

var dirsystem = '/srv/http/data/system';
var filereboot = '/srv/http/data/tmp/reboot';

$( '.container' ).on( 'click', '.settings', function() {
	location.href = 'index-settings.php?p='+ this.id
} );
$( '#hostname' ).click( function() {
	info( {
		  icon      : 'rune'
		, title     : 'Player Name'
		, textlabel : 'Name'
		, textvalue : G.hostname
		, ok        : function() {
			var hostname = $( '#infoTextBox' ).val().replace( /[^a-zA-Z0-9-]+/g, '-' ).replace( /(^-*|-*$)/g, '' );
			if ( hostname === G.hostname ) return
			
			G.hostname = hostname;
			$( '#hostname' ).val( hostname );
			var hostnamelc = hostname.toLowerCase();
			local = 1;
			$.post( 'commands.php', { bash: [
				  'hostnamectl set-hostname "'+ hostnamelc +'"'                                                            // hostname
				, "sed -i 's/\\(.*\\[\\).*\\(\\] \\[.*\\)/\\1"+ hostnamelc +"\\2/' /etc/avahi/services/runeaudio.service"  // avahi
				, "sed -i 's/\\(netbios name = \\).*/\\1"+ hostnamelc +"/' /etc/samba/smb.conf"                            // samba
				, "sed -i '/ExecStart/ s/\\w*$/"+ hostname +"/' /etc/systemd/system/wsdd.service"                          // web service discovery
				, "sed -i 's/^\\(ssid=\\).*/\\1"+ hostname +"/' /etc/hostapd/hostapd.conf"                                 // hostapd
				, "sed -i '/^\\tname =/ s/\".*\"/\""+ hostname +"\"/' /etc/shairport-sync.conf"                            // shairport-sync
				, "sed -i 's/^\\(friendlyname = \).*/\\1"+ hostname +"/' /etc/upmpdcli.conf"                               // upnp
				, 'rm -f /root/.config/chromium/SingletonLock'                                                             // chromium profile reset
				, 'systemctl daemon-reload'
				, 'systemctl try-restart avahi-daemon hostapd mpd nmb smb wsdd shairport-sync shairport-meta upmpdcli'
				, 'systemctl -q is-active bluetooth && bluetoothctl system-alias "'+ hostname +'"'
				, "echo '"+ hostname +"' > "+ dirsystem +"/hostname"
				, curlPage( 'system' )
			] }, resetlocal );
			banner( 'Name', 'Change ...', 'sliders' );
		}
	} );
} );
$( '#setting-ntp' ).click( function() {
	info( {
		  icon      : 'stopwatch'
		, title     : 'NTP Server'
		, textlabel : 'URL'
		, textvalue : G.ntp
		, ok        : function() {
			var ntp = $( '#infoTextBox' ).val();
			if ( ntp === G.ntp ) return
			
			G.ntp = ntp
			local = 1;
			$.post( 'commands.php', { bash: [
				  "sed -i 's/^\\(NTP=\\).*/\\1"+ ntp +"/' /etc/systemd/timesyncd.conf"
				, "echo '"+ ntp +"' > "+ dirsystem +"/ntp"
				, curlPage( 'system' )
			] }, resetlocal );
		}
	} );
} );
$( '#timezone' ).on( 'change', function() {
	G.timezone = $( this ).find( ':selected' ).val();
	$( '#timezone' ).val( G.timezone );
	$.post( 'commands.php', { bash: [ 
		  'timedatectl set-timezone '+ G.timezone
		, "echo '"+ G.timezone +"' > "+ dirsystem +"/timezone"
		, curlPage( 'system' )
	] } );
} );
$( 'body' ).on( 'click touchstart', function( e ) {
	if ( !$( e.target ).closest( '.i2s' ).length && $( '#i2smodule option:selected' ).val() === 'none' ) {
		$( '#divi2smodulesw' ).removeClass( 'hide' );
		$( '#divi2smodule' ).addClass( 'hide' );
	}
} );
$( '#i2smodulesw' ).click( function() {
	// delay to show switch sliding
	setTimeout( function() {
		$( '#i2smodulesw' ).prop( 'checked', 0 );
		$( '#divi2smodulesw' ).addClass( 'hide' );
		$( '#divi2smodule' )
			.removeClass( 'hide' )
			.find( '.selectric' ).click();
	}, 200 );
} );
$( '#i2smodule' ).on( 'change', function() {
	var $selected = $( this ).find( ':selected' );
	var audioaplayname = $selected.val();
	var audiooutput = $selected.text();
	local = 1;
	if ( audioaplayname !== 'none' ) {
		G.audioaplayname = audioaplayname;
		G.audiooutput = audiooutput;
		G.onboardaudio = false;
		$( '#onboardaudio' ).prop( 'checked', 0 );
		$( '#divi2smodulesw' ).addClass( 'hide' );
		$( '#divi2smodule' ).removeClass( 'hide' );
		rebootText( 'Enable', 'I&#178;S Module' );
		$.post( 'commands.php', { bash: [
			  "sed -i"
				+" -e 's/\\(dtparam=audio=\\).*/\\1off/'"
				+" -e '/dtparam=i2s=on/ d'"
				+" -e '/dtoverlay="+ audioaplayname +"/ d'"
			  	+" /boot/config.txt"
			, "sed -i '$ a\\dtparam=i2s=on\\n"
				+"dtoverlay="+ audioaplayname +"'"
				+" /boot/config.txt"
			, "echo '"+ audiooutput +"' > "+ dirsystem +"/audio-output"
			, "echo '"+ audioaplayname +"' > "+ dirsystem +"/audio-aplayname"
			, 'rm -f '+ dirsystem +'/onboard-audio'
			, "sed -i '/I&#178;S Module/ d' "+ filereboot
			, "echo '"+ G.reboot.join( '<br>' ) +"' > "+ filereboot
			, curlPage( 'system' )
		] }, resetlocal );
	} else {
		var audioaplayname = G.audioaplayname;
		G.audioaplayname = 'bcm2835 ALSA-1';
		G.audiooutput = 'RaspberryPi Analog Out';
		G.onboardaudio = true;
		$( '#onboardaudio' ).prop( 'checked', 1 );
		$( '#divi2smodulesw' ).removeClass( 'hide' );
		$( '#divi2smodule' ).addClass( 'hide' );
		rebootText( 'Disable', 'I&#178;S Module' );
		$.post( 'commands.php', { bash: [
			  "sed -i"
				+" -e 's/\\(dtparam=audio=\\).*/\\1on/'"
				+" -e '/dtparam=i2s=on/ d'"
				+" -e '/dtoverlay="+ audioaplayname +"/ d'"
				+" /boot/config.txt"
			, "echo 'RaspberryPi Analog Out' > "+ dirsystem +"/audio-output"
			, "echo 'bcm2835 ALSA-1' > "+ dirsystem +"/audio-aplayname"
			, "echo 1 > "+ dirsystem +"/onboard-audio"
			, "sed -i '/I&#178;S Module/ d' "+ filereboot
			, "echo '"+ G.reboot +"' > "+ filereboot
			, curlPage( 'system' )
		] }, resetlocal );
	}
} );
$( '#soundprofile' ).click( function() {
	var soundprofile = $( this ).prop( 'checked' );
	if ( soundprofile ) {
		if ( G.eth0mtu ) { // custom
			$.post( 'commands.php', { bash: [
				  '/srv/http/bash/system-soundprofile.sh custom '
					+ G.eth0mtu +' '+ G.eth0txq +' '+ G.sysswap +' '+ G.syslatency
				, 'echo custom > '+ dirsystem +'/soundprofile'
			] } );
		} else {
			$( '#setting-soundprofile' ).click();
		}
	} else {
		G.soundprofile = '';
		$( '#setting-soundprofile' ).addClass( 'hide' );
		rebootText( 'Disable', 'sound profile' );
		local = 1;
		$.post( 'commands.php', { bash: [
			  '/srv/http/bash/system-soundprofile.sh default'
			, 'rm -f '+ dirsystem +'/soundprofile'
			, curlPage( 'system' )
		] }, resetlocal );
	}
} );
$( '#setting-soundprofile' ).click( function() {
	var radio= {
		  RuneAudio: 'RuneAudio'
		, ACX: 'ACX'
		, Orion: 'Orion'
		, 'Orion V2': 'OrionV2'
		, Um3ggh1U: 'Um3ggh1U'
	}
	if ( G.audioaplayname === 'snd_rpi_iqaudio_dac' ) radio[ 'IQaudio Pi-DAC' ] = 'OrionV3';
	if ( G.audiooutput === 'BerryNOS' ) radio[ 'BerryNOS' ] = 'OrionV4';
	radio[ 'Custom' ] = 'custom';
	info( {
		  icon    : 'volume'
		, title   : 'Sound Profile'
		, radio   : radio
		, preshow : function() {
			var soundprofile = G.soundprofile || 'RuneAudio';
			$( 'input[name=inforadio]' ).val( [ soundprofile ] )
			$( '#infoRadio input[value=custom]' ).click( function() {
				var textlabel = [ 'vm.swappiness (0-100)', 'kernel.sched_latency_ns (ns)' ];
				var textvalue = [ G.sysswap, G.syslatency ];
				if ( G.ip.slice( 0, 4 ) === 'eth0' ) {
					textlabel.push( 'eth0 mtu (byte)', 'eth0 txqueuelen' );
					textvalue.push( G.eth0mtu, G.eth0txq );
				}
				info( {
					  icon      : 'volume'
					, title     : 'Sound Profile'
					, message   : 'Custom value (Current value shown)'
					, textlabel : textlabel
					, textvalue : textvalue
					, boxwidth  : 110
					, ok        : function() {
						G.soundprofile = 'custom';
						var eth0mtu = parseInt( $( '#infoTextBox' ).val() );
						var eth0txq = parseInt( $( '#infoTextBox1' ).val() );
						var sysswap = parseInt( $( '#infoTextBox2' ).val() );
						var syslatency = parseInt( $( '#infoTextBox3' ).val() );
						if ( eth0mtu !== G.eth0mtu || eth0txq !== G.eth0txq || sysswap !== G.sysswap || syslatency !== G.syslatency ) {
							$.post( 'commands.php', { bash: [
								  '/srv/http/bash/system-soundprofile.sh custom '
									+ eth0mtu +' '+ eth0txq +' '+ sysswap +' '+ syslatency
								, 'echo custom > '+ dirsystem +'/soundprofile'
								, 'echo '+ eth0mtu +' > '+ dirsystem +'/sound-eth0mtu'
								, 'echo '+ eth0txq +' > '+ dirsystem +'/sound-eth0txq'
								, 'echo '+ sysswap +' > '+ dirsystem +'/sound-sysswap'
								, 'echo '+ syslatency +' > '+ dirsystem +'/sound-syslatency'
							] } );
						}
					}
				} );
			} );
		}
		, cancel  : function() {
			if ( !G.soundprofile ) {
				$( '#soundprofile' ).prop( 'checked', 0 );
				$( '#setting-soundprofile' ).addClass( 'hide' );
			}
		}
		, ok      : function() {
			var soundprofile = $( 'input[name=inforadio]:checked' ).val();
			if ( soundprofile !== G.soundprofile ) {
				rebootText( G.soundprofile ? 'Change' : 'Enable', 'sound profile' );
				G.soundprofile = soundprofile;
				local = 1;
				$.post( 'commands.php', { bash: [
					  '/srv/http/bash/system-soundprofile.sh '+ soundprofile
					, 'rm -f '+ dirsystem +'/sound*'
					, 'echo '+ soundprofile +' > '+ dirsystem +'/soundprofile'
					, curlPage( 'system' )
				] }, resetlocal );
			}
		}
	} );
} );
$( '#onboardaudio' ).click( function() {
	var onboardaudio = $( this ).prop( 'checked' );
	if ( !onboardaudio && G.audioaplayname.slice( 0, 7 ) === 'bcm2835' ) {
		info( {
			  icon    : 'volume'
			, title   : 'On-board Audio'
			, message : 'On-board audio is currently in used.'
		} );
		$( '#onboardaudio' ).prop( 'checked', 1 );
		return
	}
	
	G.onboardaudio = onboardaudio;
	rebootText( onboardaudio ? 'Enable' : 'Disable', 'on-board audio' );
	local = 1;
	$.post( 'commands.php', { bash: [
		  "sed -i 's/dtparam=audio=.*/dtparam=audio="+ ( onboardaudio ? 'on' : 'off' ) +"/' /boot/config.txt"
		, ( onboardaudio ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/onboard-audio'
		, "sed -i '/on-board audio/ d' "+ filereboot
		, "echo '"+ G.reboot.join( '<br>' ) +"' > "+ filereboot
		, curlPage( 'system' )
	] }, resetlocal );
} );
$( '#bluetooth' ).click( function() {
	G.bluetooth = $( this ).prop( 'checked' );
	if ( G.bluetooth ) {
		var sed = "sed -i -e '/dtoverlay=disable-bt/ s/^/#/' -e '/dtoverlay=bcmbt/ s/^#*//'";
	} else {
		var sed = "sed -i -e '/dtoverlay=disable-bt/ s/^#*//' -e '/dtoverlay=bcmbt/ s/^/#/'";
	}
	rebootText( G.bluetooth ? 'Enable' : 'Disable', 'on-board Bluetooth' );
	local = 1;
	$.post( 'commands.php', { bash: [
		  sed +" /boot/config.txt"
		, 'systemctl '+ ( G.bluetooth ? 'enable' : 'disable' ) +' --now bluetooth'
		, ( G.bluetooth ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/onboard-bluetooth'
		, "sed -i '/on-board Bluetooth/ d' "+ filereboot
		, "echo '"+ G.reboot.join( '<br>' ) +"' > "+ filereboot
		, curlPage( 'system' )
	] }, resetlocal );
} );
$( '#wlan' ).click( function() {
	G.wlan = $( this ).prop( 'checked' );
	if ( G.wlan ) {
		var sed = "sed -i '/dtoverlay=disable-wifi/ s/^/#/'";
	} else {
		var sed = "sed -i '/dtoverlay=disable-wifi/ s/^#*//'"
	}
	rebootText( G.wlan ? 'Enable' : 'Disable', 'on-board Wi-Fi' );
	local = 1;
	$.post( 'commands.php', { bash: [
		  sed +" /boot/config.txt"
		, 'ifconfig wlan0 '+ ( G.wlan ? 'up' : 'down' )
		, 'systemctl -q '+ ( G.wlan ? 'enable' : 'disable' ) +' --now netctl-auto@wlan0'
		, ( G.wlan ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/onboard-wlan'
		, "sed -i '/on-board Wi-Fi/ d' "+ filereboot
		, "echo '"+ G.reboot.join( '<br>' ) +"' > "+ filereboot
		, curlPage( 'system' )
		, curlPage( 'network' )
	] }, resetlocal );
} );
$( '#airplay' ).click( function() {
	G.airplay = $( this ).prop( 'checked' );
	var bannertxt = G.airplay && !G.avahi ? ' + URL By Name' : '';
	if ( G.airplay ) {
		G.avahi = true;
		$( '#avahi' ).prop( 'checked', 1 );
	}
	local = 1;
	$.post( 'commands.php', { bash: [
		  'systemctl '+ ( G.airplay ? 'enable' : 'disable' ) +' --now shairport-sync'
		, ( G.airplay ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/airplay'
		, curlPage( 'system' )
	] }, resetlocal );
	banner( 'AirPlay'+ bannertxt, G.airplay, 'airplay' );
} );
$( '#localbrowser' ).click( function() {
	G.localbrowser = $( this ).prop( 'checked' );
	$( '#setting-localbrowser' ).toggleClass( 'hide', !G.localbrowser );
	local = 1;
	if ( G.localbrowser ) {
		var cmd = [
			  "sed -i 's/\\(console=\\).*/\\1tty3 plymouth.enable=0 quiet loglevel=0 logo.nologo vt.global_cursor_default=0/' /boot/cmdline.txt"
			, 'systemctl enable --now localbrowser'
			, curlPage( 'system' )
		];
	} else {
		var cmd = [
			  "sed -i 's/\\(console=\\).*/\\1tty1/' /boot/cmdline.txt"
			, 'systemctl disable --now localbrowser'
			, 'rm -f /srv/http/data/system/localbrowser'
			, '/usr/local/bin/ply-image /srv/http/assets/img/splash.png'
			, curlPage( 'system' )
		];
	}
	$.post( 'commands.php', { bash: cmd }, resetlocal( 7000 ) );
	banner( 'Browser on RPi', G.localbrowser, 'chromium' );
} );
var localbrowserinfo = heredoc( function() { /*
	<div id="infoText" class="infocontent">
		<div id="infotextlabel">
			<a class="infolabel">
				Screen off <gr>(min)</gr><br>
				Zoom <gr>(0.5-2.0)</gr>
			</a>
		</div>
		<div id="infotextbox">
			<input type="text" class="infoinput input" id="infoTextBox" spellcheck="false" style="width: 60px; text-align: center">
			<input type="text" class="infoinput input" id="infoTextBox1" spellcheck="false" style="width: 60px; text-align: center">
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
// !!!keep 'space' indent here
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
$( '#setting-localbrowser' ).click( function() {
	info( {
		  icon        : 'chromium'
		, title       : 'Browser on RPi'
		, content     : localbrowserinfo
		, preshow     : function() {
			$( '#infoTextBox1' ).val( G.zoom );
			$( '#infoTextBox' ).val( G.screenoff );
			$( 'input[name=inforadio]' ).val( [ G.rotate ] );
			$( '#infoCheckBox input:eq( 0 )' ).prop( 'checked', G.cursor );
			$( '#infoCheckBox input:eq( 1 )' ).prop( 'checked', G.overscan );
		}
		, buttonlabel : '<i class="fa fa-refresh"></i>Refresh'
		, buttoncolor : '#de810e'
		, button      : function() {
			$.post( 'commands.php', { bash: 'curl -s -X POST "http://127.0.0.1/pub?id=notify" -d \'{ "reload": 1 }\'' } );
		}
		, buttonwidth : 1
		, ok          : function() {
			var cursor    = $( '#infoCheckBox input:eq( 0 )' ).prop( 'checked' ) ? 1 : 0;
			var overscan  = $( '#infoCheckBox input:eq( 1 )' ).prop( 'checked' ) ? 1 : 0;
			var rotate    = $( 'input[name=inforadio]:checked' ).val();
			var screenoff = $( '#infoTextBox' ).val();
			var zoom = parseFloat( $( '#infoTextBox1' ).val() ) || 1;
			G.zoom      = zoom < 2 ? ( zoom < 0.5 ? 0.5 : zoom ) : 2;
			if ( cursor === G.cursor && overscan === G.overscan && rotate === G.rotate 
				&& screenoff === G.screenoff && zoom === G.zoom ) return
			
			G.cursor    = cursor;
			G.overscan  = overscan;
			G.rotate    = rotate;
			G.screenoff = screenoff;
			G.zoom      = zoom;
			var localbrowser = dirsystem +'/localbrowser-';
			var cmd = [
				  ( zoom != 1 ? 'echo '+ zoom +' > ' : 'rm -f ' ) + localbrowser +'zoom'
				, ( cursor ? 'echo 1 > ' : 'rm -f ' ) + localbrowser +'cursor'
				, ( screenoff != 0 ? 'echo '+ ( screenoff * 60 ) +' > ' : 'rm -f ' ) + localbrowser +'screenoff'
				, ( overscan ? 'echo '+ overscan +' > ' : 'rm -f ' ) + localbrowser +'overscan'
				, "sed -i"
					+" -e 's/\\(-use_cursor \\).*/\\1"+ ( cursor == 1 ? 'yes' : 'no' ) +" \\\&/'"
					+" -e 's/\\(factor=\\).*/\\1"+ zoom +"/'"
			 		+" -e 's/\\(xset dpms 0 0 \\).*/\\1"+ ( screenoff * 60 ) +" \\\&/'"
					+" /etc/X11/xinit/xinitrc"
				, "sed -i '/disable_overscan=1/ "+ ( overscan ? 's/^/#/' : 's/^#*//' ) +"' /boot/config.txt"
				, 'ln -sf /srv/http/assets/img/{'+ rotate +',splash}.png'
				, 'rm -f /etc/X11/xorg.conf.d/99-raspi-rotate.conf '+ localbrowser +'rotatefile'
			];
			if ( rotate !== 'NORMAL' ) {
				var matrix = {
					  CW  : '0 1 0 -1 0 1 0 0 1'
					, CCW : '0 -1 1 1 0 0 0 0 1'
					, UD  : '-1 0 1 0 -1 1 0 0 1'
				}
				rotatecontent = rotatecontent.replace( 'ROTATION_SETTING', rotate ).replace( 'MATRIX_SETTING', matrix[ rotate ] );
				cmd.push(
					  "echo '"+ rotatecontent +"' > "+ localbrowser +'rotatefile'
					, 'cp -f '+ localbrowser +'rotatefile /etc/X11/xorg.conf.d/99-raspi-rotate.conf'
				);
			}
			cmd.push( 
				  'systemctl restart localbrowser'
				, curlPage( 'system' )
			);
			local = 1;
			$.post( 'commands.php', { bash: cmd }, function() {
				resetlocal( 7000 );
			} );
			banner( 'Browser on RPi', 'Change ...', 'chromium' );
		}
	} );
} );
$( '#login' ).click( function() {
	G.login = $( this ).prop( 'checked' );
	$( '#setting-login' ).toggleClass( 'hide', !G.login );
	local = 1;
	$.post( 'commands.php', { bash: [
		  ( G.login ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/login'
		, "sed -i '/^bind_to_address/ s/\".*\"/\""+ ( G.login ? '127.0.0.1' : '0.0.0.0' ) +"\"/' /etc/mpd.conf"
		, 'systemctl restart mpd mpdidle'
		, curlPage( 'system' )
	] }, resetlocal );
	banner( 'Password Login', G.login, 'lock' );
	if ( G.login && G.passworddefault ) {
		info( {
			  icon    : 'lock'
			, title   : 'Password'
			, message : 'Default password is <wh>rune</wh>'
		} );
	}
} );
$( '#setting-login' ).click( function() {
	info( {
		  icon          : 'lock'
		, title         : 'Change Password'
		, passwordlabel : [ 'Existing', 'New' ]
		, ok            : function() {
			$.post( 'commands.php', {
				  login  : $( '#infoPasswordBox' ).val()
				, pwdnew : $( '#infoPasswordBox1' ).val() }
			, function( std ) {
				info( {
					  icon    : 'lock'
					, title   : 'Change Password'
					, nox     : 1
					, message : ( std ? 'Password changed' : 'Wrong existing password' )
				} );
			} );
		}
	} );
} );
$( '#samba' ).click( function() {
	G.samba = $( this ).prop( 'checked' );
	$( '#setting-samba' ).toggleClass( 'hide', !G.samba );
	local = 1;
	$.post( 'commands.php', { bash: [
		  'systemctl '+ ( G.samba ? 'enable' : 'disable' ) +' --now nmb smb wsdd'
		, ( G.samba ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/samba'
		, curlPage( 'system' )
	] }, resetlocal );
	banner( 'File Sharing', G.samba, 'network' );
} );
$( '#setting-samba' ).click( function() {
	info( {
		  icon     : 'network'
		, title    : 'Samba File Sharing'
		, message  : '<wh>Write</wh> permission:</gr>'
		, checkbox : { '<gr>/mnt/MPD/</gr>SD': 1, '<gr>/mnt/MPD/</gr>USB': 1 }
		, preshow  : function() {
			$( '#infoCheckBox input:eq( 0 )' ).prop( 'checked', G.writesd );
			$( '#infoCheckBox input:eq( 1 )' ).prop( 'checked', G.writeusb );
		}
		, ok       : function() {
			var writesd = $( '#infoCheckBox input:eq( 0 )' ).prop( 'checked' );
			var writeusb = $( '#infoCheckBox input:eq( 1 )' ).prop( 'checked' );
			if ( writesd === G.writesd && writeusb === G.writeusb ) return
			
			G.writesd = writesd;
			G.writeusb = writeusb;
			var sed = "sed -i -e '/read only = no/ d'";
			if ( writesd ) sed += " -e '/path = .*SD/ a\\\tread only = no'";
			if ( writeusb ) sed += " -e '/path = .*USB/ a\\\tread only = no'";
			local = 1;
			$.post( 'commands.php', { bash: [ 
				  sed +' /etc/samba/smb.conf'
				, 'systemctl try-restart nmb smb'
				, ( writesd ? 'rm -f ' : 'echo 1 > ' ) + dirsystem +'/samba-readonlysd'
				, ( writeusb ? 'rm -f ' : 'echo 1 > ' ) + dirsystem +'/samba-readonlyusb'
				, curlPage( 'system' )
			] }, resetlocal );
			banner( 'File Sharing', 'Change ...', 'network' );
		}
	} );
} );
$( '#upnp' ).click( function() {
	G.upnp = $( this ).prop( 'checked' );
	$( '#setting-upnp' ).toggleClass( 'hide', !G.upnp );
	local = 1;
	$.post( 'commands.php', { bash: [
		  'systemctl '+ ( G.upnp ? 'enable' : 'disable' ) +' --now upmpdcli'
		, ( G.upnp ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/upnp'
		, curlPage( 'system' )
	] }, resetlocal );
	banner( 'UPnP', G.upnp, 'upnp' );
} );
var htmlservice = heredoc( function() { /*
	<div id="SERVICE" class="infocontent infocheckbox infohtml">
		<div class="infotextlabel"></div>
		<div class="infotextbox" style="width: 230px">
			<label style="width: 200px; margin-left: 45px;"><input type="checkbox" class="enable">&ensp;<i class="fa fa-SERVICE fa-lg gr"></i>&ensp;TITLE</label>
		</div>
	</div>
	<div id="SERVICEdata" class="infocontent hide">
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
		<br>&nbsp;
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
	<hr>
	<div id="ownqueuenot" class="infocontent infocheckbox infohtml">
		<label><input type="checkbox">&ensp;Keep existing Playlist</label><br>
	</div>
*/ } );
$( '#setting-upnp' ).click( function() {
	info( {
		  icon     : 'upnp'
		, title    : 'UPnP'
		, content  : htmlgmusic + htmlqobuz + htmlspotify + htmltidal + htmlownqueue
		, preshow  : function() {
			[ 'tidal', 'qobuz', 'gmusic', 'spotify' ].forEach( function( service ) {
				var user = G[ service +'user' ];
				var quality = G[ service +'quality' ];
				if ( quality ) {
					$( 'input[name='+ service +'quality]' ).val( [ quality ] );
				} else {
					$( 'input[name='+ service +'quality]:eq( 0 )' ).click();
				}
				if ( !user ) return
				
				var pass = G[ service +'pass' ];
				var passmask = pass.replace( /./g, '*' );
				$( 'input[name=qobuzquality]:eq( 2 )' ).parent().hide();
				$( '#'+ service +' input[name=checkbox]' ).prop( 'checked', 1 );
				$( '#'+ service +'data' ).removeClass( 'hide' );
				$( '#'+ service +'user' ).val( user );
				$( '#'+ service +'pass' )
					.val( passmask )
					.click( function() {
						var $this = $( this );
						if ( ! $this.val().replace( /\*/g, '' ).length ) $this.val( '' );
					} )
					.blur( function() {
						var $this = $( this );
						if ( ! $this.val() ) $this.val( passmask );
					} );
			} );
			$( '#ownqueuenot input' ).prop( 'checked', G.ownqueuenot );
			$( '.infotextbox' ).on( 'click', '.enable', function() {
				$( this ).parents().eq( 2 ).next().toggleClass( 'hide' );
			} );
		}
		, ok       : function() {
			G.ownqueuenot = $( '#ownqueuenot input' ).prop( 'checked' );
			var sed = "sed -i";
			var echo = [];
			var value = {};
			[ 'tidal', 'qobuz', 'gmusic', 'spotify' ].forEach( function( service ) {
				var serviceuser = service +'user';
				var servicepass = service +'pass';
				var servicequal = service +'quality';
				var user = $( '#'+ serviceuser ).val();
				var pass = $( '#'+ servicepass ).val();
				if ( pass && !pass.replace( /\*/g, '' ).length ) pass = G[ servicepass ];
				var quality = $( 'input[name='+ servicequal +']:checked' ).val();
				value[ service ] = [ user, pass, quality ];
				if ( $( '#'+ service +' input' ).prop( 'checked' ) ) {
					if ( user && pass ) {
						G[ serviceuser ] = user;
						G[ servicepass ] = pass;
						G[ servicequal ] = quality;
						sed += " -e 's/#*\\("+ serviceuser +" = \\).*/\\1"+ user +"/'"
								 +" -e 's/#*\\("+ servicepass +" = \\).*/\\1"+ pass +"/'";
						if ( service === 'qobuz' ) {
							sed += " -e 's/#*\\(qobuzformatid = \\).*/\\1"+ quality +"/'";
						} else if ( service === 'gmusic' || service === 'tidal' ) {
							sed += " -e 's/#*\\("+ servicequal +" = \\).*/\\1"+ quality +"/'";
						}
						echo.push(
							  'echo '+ user +' > '+ dirsystem +'/upnp-'+ service +'user'
							, 'echo '+ pass +' > '+ dirsystem +'/upnp-'+ service +'pass'
							, 'echo '+ quality +' > '+ dirsystem +'/upnp-'+ service +'quality'
						);
					} else {
						info( {
							  icon    : 'upnp'
							, title   : 'UPnP / upnp'
							, message : 'User and Password cannot be blank.'
						} );
					}
				} else {
					G[ serviceuser ] = '';
					G[ servicepass ] = '';
					G[ servicequal ] = '';
					sed += " -e '/^"+ service +".*/ s/^/#/'";
				}
			} );
			if ( G.ownqueuenot ) echo.push( 'echo 1 > '+ dirsystem +'/upnp-ownqueuenot' );
			sed += G.ownqueuenot ? " -e '/^#ownqueue =/ a\\ownqueue = 0'" : " -e '/ownqueue = 0/ d'";
			var cmd = [ sed +' /etc/upmpdcli.conf' ];
			cmd.concat( echo );
			cmd.push(
				  'systemctl try-restart upmpdcli'
				, curlPage( 'system' )
			);
			local = 1;
			$.post( 'commands.php', { bash: cmd }, resetlocal );
			banner( 'UPnP', 'Change ...', 'upnp' );
		}
	} );
} );
$( '#avahi' ).click( function() {
	var avahi = $( this ).prop( 'checked' );
	if ( G.airplay && !avahi ) { // disable avahi > airplay failed
		info( {
			  icon    : 'external-link'
			, title   : 'URL By Name'
			, message : '<wh>AirPlay</wh> must be disable first.'
			, ok      : function() {
				$( '#avahi' ).prop( 'checked', 1 );
			}
		} );
		return
	}
	
	G.avahi = avahi;
	$.post( 'commands.php', { bash: [
		  'systemctl '+ ( avahi ? 'enable' : 'disable' ) +' --now avahi-daemon'
		, ( avahi ? 'echo 1 > ' : 'rm -f ' ) +'/srv/http/data/system/avahi'
		, curlPage( 'system' )
	] }, resetlocal );
	banner( 'URL By Name', avahi, 'external-link' );
} );
$( '#refresh' ).click( function() {
	var $this = $( this );
	var active = $this.find( 'i' ).hasClass( 'blink' );
	$this.find( 'i' ).toggleClass( 'blink', !active );
	if ( active ) {
		clearInterval( intervalcputime );
	} else {
		var bullet = ' <gr>&bull;</gr> ';
		intervalcputime = setInterval( function() {
			$.post( 'commands.php', { getjson: '/srv/http/bash/system-data.sh' }, function( list ) {
				var status = list[ 0 ];
				$.each( status, function( key, val ) {
					G[ key ] = val;
				} );
				$( '#status' ).html( renderStatus );
			}, 'json' );
		}, 10000 );
		notify( 'System Status', 'Refresh every 10 seconds.<br>Click again to stop.', 'sliders', 10000 );
	}
} );
$( '#journalctl' ).click( function() {
	$( '#codejournalctl' ).hasClass( 'hide' ) ? getJournalctl() : $( '#codejournalctl' ).addClass( 'hide' );
} );
$( '#backuprestore' ).click( function() {
	info( {
		  icon        : 'slides'
		, title       : 'Backup/Restore Settings'
		, buttonlabel : 'Backup'
		, buttoncolor : '#0a8c68'
		, button      : function() {
			$.post( 'commands.php', { backuprestore: 'backup' }, function( data ) {
				if ( data === 'ready' ) {
					fetch( '/data/tmp/backup.xz' )
						.then( response => response.blob() )
						.then( blob => {
							var url = window.URL.createObjectURL( blob );
							var a = document.createElement( 'a' );
							a.style.display = 'none';
							a.href = url;
							a.download = 'backup.xz';
							document.body.appendChild( a );
							a.click();
							a.remove();
							window.URL.revokeObjectURL( url );
						} ).catch( () => {
							info( {
								  icon    : 'slides'
								, title   : 'Backup Settings and Database'
								, message : '<wh>Warning!</wh><br>File download failed.'
							} );
						} );
				}
			} );
		}
		, oklabel     : 'Restore'
		, ok          : function() {
			info( {
				  icon        : 'slides'
				, title       : 'Restore Settings'
				, message     : 'Select backup file'
				, fileoklabel : 'Restore'
				, filetype    : '.xz'
				, ok          : function() {
					var file = $( '#infoFileBox' )[ 0 ].files[ 0 ];
					if ( file.name.split( '.' ).pop() !== 'xz' ) {
						info( {
							  icon    : 'slides'
							, title   : 'Restore Settings'
							, message : 'File type not <wh>*.xz</wh>'
						} );
						return
					}
					
					var formData = new FormData();
					formData.append( 'backuprestore', 'restore' );
					formData.append( 'file', file );
					$.ajax( {
						  url         : 'commands.php'
						, type        : 'POST'
						, data        : formData
						, processData : false  // tell jQuery not to process the data
						, contentType : false  // tell jQuery not to set contentType
						, success     : function( data ) {
						   if ( data == -1 ) {
								info( {
									  icon        : 'slides'
									, title       : 'Restore Settings and Database'
									, message     : 'File upload failed.'
								} );
						   }
						}
					} );
				}
			} );
		}
	} );
} );
function getJournalctl() {
	if ( $( '#codejournalctl' ).text() ) {
		$( '#codejournalctl' ).removeClass( 'hide' );
		return
	}
	
	var logfile = dirsystem +'/bootlog';
	$.post( 'commands.php', { getbootlog: 1 }, function( data ) {
		var htmldata = data.replace( /(Error:.*|Under-voltage detected.*)/g, function( match, $1 ) {
			return '<red>'+ $1 +'</red>'
		} );
		$( '#codejournalctl' )
			.html( htmldata )
			.removeClass( 'hide' );
		$( '#journalctlicon' )
			.removeClass( 'fa-refresh blink' )
			.addClass( 'fa-code' );
	} );
	$( '#journalctlicon' )
		.removeClass( 'fa-code' )
		.addClass( 'fa-refresh blink' );
}
function rebootText( enable, device ) {
	G.reboot = G.reboot.filter( function( el ) {
		return el.indexOf( device ) === -1
	} );
	G.reboot.push( enable +' '+ device );
}
function renderStatus() {
	return G.cpuload.replace( / /g, '&emsp;' ) + ' <gr>&bull;</gr> ' + G.cputemp +'°C<br>'
		+ G.time.replace( ' ', ' <gr>&bull;</gr> ' ) + '&ensp;<grw>' + G.timezone.replace( /\//g, ' &middot; ' ) +'</grw><br>'
		+ G.uptime +'&ensp;<gr>since '+ G.uptimesince +'</gr>'
}

refreshData = function() {
	$.post( 'commands.php', { getjson: '/srv/http/bash/system-data.sh' }, function( list ) {
		G = list[ 0 ];
		G.sources = list[ 1 ];
		G.sources.pop(); // remove 'reboot' from sources-data.sh
		G.reboot = G.reboot ? G.reboot.split( '<br>' ) : [];
		
		var systemlabel =
			 'RuneAudio<br>'
			+'Hardware<br>'
			+'SoC<br>'
			+'Root Partition<br>'
			+'Kernel<br>'
			+'<span id="mpd" class="settings">MPD<i class="fa fa-gear"></i></span><br>'
			+'<span id="network" class="settings">Network<i class="fa fa-gear"></i></span>';
		var statuslabel =
			 'CPU Load<br>'
			+'Time<br>'
			+'Up Time';
		var bullet = ' <gr>&bull;</gr> ';
		if ( G.ip ) {
			var ip = G.ip.split( ',' );
			var iplist = '';
			ip.forEach( function( el ) {
				var val = el.split( ' ' );
				iplist += '<i class="fa fa-'+ ( val[ 0 ] === 'eth0' ? 'lan' : 'wifi-3' ) +' gr"></i>&ensp;';
				iplist += val[ 2 ] +'&emsp;<gr>'+ val[ 1 ] +'</gr><br>';
				systemlabel += '<br>';
			} )
		}
		if ( G.sources.length ) {
			systemlabel += '<span id="sources" class="settings">Sources<i class="fa fa-gear"></i></span>';
			var sourcelist = '';
			$.each( G.sources, function( i, val ) {
				sourcelist += '<i class="fa fa-'+ val.icon +' gr"></i>&ensp;'+ val.mountpoint.replace( '/mnt/MPD/USB/', '' );
				sourcelist += ( val.size ? bullet + val.size : '' ) +'<br>';
				systemlabel += '<br>';
			} );
		}
		$( '#systemlabel' ).html( systemlabel );
		$( '#system' ).html(
			  '<i class="fa fa-addons gr" style="line-height: 20px;"></i> '+ G.version +'<br>'
			+ G.hardware +'<br>'
			+ G.soc + bullet + G.soccpu + bullet + G.socmem +'<br>'
			+ G.rootfs +'<br>'
			+ G.kernel +'<br>'
			+ G.mpd +'<br>'
			+ iplist
			+ sourcelist
		);
		$( '#statuslabel' ).html( statuslabel );
		$( '#status' ).html( renderStatus );
		$( '#hostname' ).val( G.hostname )
		$( '#timezone' )
			.val( G.timezone )
			.selectric( 'refresh' );
		$( '#i2smodule' ).val( 'none' );
		$( '#i2smodule option' ).filter( function() {
			var $this = $( this );
			return $this.text() === G.audiooutput && $this.val() === G.audioaplayname;
		} ).prop( 'selected', true );
		$( '#i2smodule' ).selectric( 'refresh' );
		var i2senabled = $( '#i2smodule' ).val() === 'none' ? false : true;
		$( '#divi2smodulesw' ).toggleClass( 'hide', i2senabled );
		$( '#divi2smodule' ).toggleClass( 'hide', !i2senabled );
		$( '#soundprofile' ).prop( 'checked', G.soundprofile !== '' );
		$( '#eth0help' ).toggleClass( 'hide', G.ip.slice( 0, 4 ) !== 'eth0' );
		$( '#setting-soundprofile' ).toggleClass( 'hide', G.soundprofile === '' );
		$( '#onboardaudio' ).prop( 'checked', G.onboardaudio );
		$( '#bluetooth' ).prop( 'checked', G.bluetooth );
		$( '#wlan' ).prop( 'checked', G.wlan );
		$( '#airplay' ).prop( 'checked', G.airplay );
		$( '#localbrowser' ).prop( 'checked', G.localbrowser );
		$( '#setting-localbrowser' ).toggleClass( 'hide', !G.localbrowser );
		$( '#samba' ).prop( 'checked', G.samba );
		$( '#setting-samba' ).toggleClass( 'hide', !G.samba );
		$( '#login' ).prop( 'checked', G.login );
		$( '#setting-login' ).toggleClass( 'hide', !G.login );
		$( '#upnp' ).prop( 'checked', G.upnp );
		$( '#setting-upnp' ).toggleClass( 'hide', !G.upnp );
		$( '#avahi' ).prop( 'checked', G.avahi );
		showContent();
	}, 'json' );
}
refreshData();

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
