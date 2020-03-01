$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

$( '#audiooutput, #mixertype' ).selectric();
$( '.selectric-input' ).prop( 'readonly', 1 ); // fix - suppress screen keyboard
if ( $( '.selectric-hide-select option' ).length === 1 ) {
	$( '.selectric .button' ).css( 'opacity', 0 );
	$( '#audiooutput' ).prop( 'disabled', 1 );
}
var dirsystem = '/srv/http/data/system';
var restartmpd = G.mpd ? 'systemctl restart mpd mpdidle' : '';
var setmpdconf = '/srv/http/bash/mpd-conf.sh';
var warning = '<wh><i class="fa fa-warning fa-lg"></i>&ensp;Lower amplifier volume.</wh>'
			 +'<br>(If current level in MPD is not 100%.)'
			 +'<br><br>Signal level will be set to full amplitude to 0dB'
			 +'<br>Too high volume can damage speakers and ears';
$( '#audiooutput' ).on( 'selectric-change', function() {
	var $selected = $( this ).find( ':selected' );
	G.audiooutput = $selected.text();
	G.audioaplayname = $selected.val();
	var card = $selected.data( 'hwmixer' );
	var hwmixer = $selected.data( 'hwmixer' );
	var routecmd = $selected.data( 'routecmd' );
	var cmd = routecmd ? [ routecmd ] : [];
	// set only if not usbdac
	if ( G.audioaplayname !== G.usbdac ) cmd.push(
		  'echo '+ G.audiooutput +' > '+ dirsystem +'/audio-output'
		, 'echo '+ G.audioaplayname +' > '+ dirsystem +'/audio-aplayname'
	);
	if ( hwmixer ) {
		cmd.push( "sed -i '/mixer_control_name = / s/\".*\"/\""+ hwmixer +"\"/; s|^//*||' /etc/shairport-sync.conf" );
	} else {
		cmd.push( "sed -i '/mixer_control_name = / s|^|//|' /etc/shairport-sync.conf" );
	}
	cmd.push(
		  "sed -i '/output_device = / s/\".*\"/\"hw:"+ card +"\"/' /etc/shairport-sync.conf"
		, 'systemctl try-restart shairport-sync shairport-meta'
		, curlPage( 'mpd' )
	);
	local = 1;
	$.post( 'commands.php', { bash: cmd }, resetlocal );
	banner( 'Audio Output Device', 'Change ...', 'mpd' );
	$( '.hwmixer' ).toggleClass( 'hide', $selected.data( 'mixercount' ) < 2 );
	if ( !$( '#codestatus' ).hasClass( 'hide' ) ) getStatus();
	if ( !$( '#codempdconf' ).hasClass( 'hide' ) ) getMpdconf();
} );
$( '#setting-audiooutput' ).click( function() {
	var $selectedoutput = $( '#audiooutput option:selected' );
	var card = $selectedoutput.data( 'card' );
	var hwmixer = $selectedoutput.data( 'hwmixer' );
	var select = $selectedoutput.data( 'mixermanual' ) ? { 'Auto select': 'auto' } : {};
	$.each( G.mixerdevices, function( i, val ) {
		select[ val ] = val;
	} );
	info( {
		  icon    : 'volume'
		, title   : 'Hardware Mixer'
		, message : 'Manually select hardware mixer:'
				   +'<br>(Only if current one not working)'
		, selectlabel : 'Device'
		, select  : select
		, checked : hwmixer
		, preshow : function() {
			$( '#infoOk' ).addClass( 'disabled' );
			$( '#infoSelectBox' )
				.selectric()
				.on( 'selectric-change', function() {
					$( '#infoOk' ).toggleClass( 'disabled', $( this ).val() === hwmixer );
				} );
		}
		, ok      : function() {
			var mixermanual = $( '#infoSelect' ).val();
			if ( mixermanual === 'auto' ) {
				var cmd = [ 
					  "sed -i '/mixer_control/ s/\".*\"/\""+ hwmixer +"\"/' /etc/mpd.conf"
					, 'rm -f /srv/http/data/system/mpd-hwmixer-'+ card
				];
			} else {
				var cmd = [
					  "sed -i '/mixer_control/ s/\".*\"/\""+ mixermanual +"\"/' /etc/mpd.conf"
					, "sed -i '/mixer_control_name = / s/\".*\"/\""+ mixermanual +"\"/; s|^//*||' /etc/shairport-sync.conf"
					, 'echo '+ mixermanual +' > /srv/http/data/system/mpd-hwmixer-'+ card
				];
			}
			cmd.push( 'systemctl try-restart mpd mpdidle shairport-sync' );
			local = 1;
			$.post( 'commands.php', { bash: cmd }, function() {
				if ( !$( '#codestatus' ).hasClass( 'hide' ) ) getStatus();
				if ( !$( '#codempdconf' ).hasClass( 'hide' ) ) getMpdconf();
				resetlocal();
			} );
			banner( 'Hardware Mixer', 'Change ...', 'mpd' );
		}
	} );
} );
$( '#mixertype' ).on( 'selectric-change', function() {
	var mixertype = $( '#mixertype' ).val();
	if ( mixertype === 'none' ) {
		info( {
			  icon    : 'volume'
			, title   : 'Volume Level'
			, message : warning
			, ok      : function() {
				setMixerType( mixertype );
			}
		} );
	} else {
		setMixerType( mixertype );
	}
	G.mixertype = mixertype;
} );
$( '#dop' ).click( function() {
	G.dop = $( this ).prop( 'checked' );
	local = 1;
	$.post( 'commands.php', { bash: [
		  ( G.dop ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/mpd-dop'
		, setmpdconf
		, curlPage( 'mpd' )
	] }, resetlocal );
	banner( 'DSP over PCM', G.dop, 'mpd' );
} );
$( 'body' ).on( 'click touchstart', function( e ) {
	// fired twice, input + label
	if ( e.target.id !== 'novolume' && $( e.target ).prop( 'for' ) !== 'novolume' ) checkNoVolume();
} );
$( '#novolume' ).click( function() {
	var checked = $( this ).prop( 'checked' );
	if ( checked ) {
		info( {
			  icon    : 'volume'
			, title   : 'Volume Level Control'
			, message : warning
			, ok      : function() {
				G.crossfade === 0;
				G.normalization === 'no';
				G.mixertype === 'none';
				G.replaygain === 'off';
				local = 1;
				$.post( 'commands.php', { bash: [
					  "sed -i"
						+" -e '/^mixer_type/ s/\".*\"/\"none\"/'"
						+" -e '/^replaygain/ s/\".*\"/\"off\"/'"
						+" -e '/^volume_normalization/ s/\".*\"/\"no\"/' /etc/mpd.conf"
					, 'echo none > '+ dirsystem +'/mpd-mixertype'
					, 'rm -f '+ dirsystem +'/{mpd-replaygain,mpd-normalization}'
					, 'mpc crossfade 0'
					, setmpdconf
					, curlPage( 'mpd' )
					, curlPage( G.mixertype === 'none' ? 0 : 1, 'volume' )
				] }, resetlocal );
				banner( 'No Volume', 'Enable ...', 'mpd' );
				$( '#crossfade, #normalization, #replaygain' ).prop( 'checked', 0 );
			}
		} );
	} else {
		info( {
			  icon    : 'volume'
			, title   : 'Volume Level Control'
			, message : 'Enable any volume features - disable <wh>No volume</wh>.'
		} );
	}
} );
$( '#crossfade' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		$( '#setting-crossfade' ).click();
	} else {
		local = 1;
		$.post( 'commands.php', { bash: [
			  'mpc crossfade 0'
			, 'rm -f '+ dirsystem +'/mpd-crossfade'
			, curlPage( 'mpd' )
		] }, resetlocal );
		banner( 'Crossfade', G.crossfade > 0, 'mpd' );
		checkNoVolume();
	}
} );
$( '#setting-crossfade' ).click( function() {
	info( {
		  icon    : 'mpd'
		, title   : 'Crossfade'
		, message : 'Seconds:'
		, radio   : { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }
		, preshow : function() {
			$( 'input[name=inforadio]' ).val( [ G.crossfade || 2 ] )
		}
		, cancel    : function() {
			if ( !G.crossfade ) {
				$( '#crossfade' ).prop( 'checked', 0 );
				$( '#setting-crossfade' ).addClass( 'hide' );
			}
		}
		, ok      : function() {
			crossfade = $( 'input[name=inforadio]:checked' ).val();
			if ( crossfade !== G.crossfade ) {
				G.crossfade = crossfade;
				local = 1;
				$.post( 'commands.php', { bash: [
					  "mpc crossfade "+ crossfade +" &> /dev/null || /usr/bin/sudo /usr/bin/"+
						"sed -i 's/\\(crossfade: \\)/\\1"+ crossfade +"/' /var/lib/mpd/mpdstate"
					, 'echo '+ crossfade +' > '+ dirsystem +'/mpd-crossfade'
					, curlPage( 'mpd' )
				] }, resetlocal );
				banner( 'Crossfade', 'Change ...', 'mpd' );
				$( '#setting-crossfade' ).removeClass( 'hide' );
			}
		}
	} );
} );
$( '#normalization' ).click( function() {
	G.normalization = $( this ).prop( 'checked' );
	local = 1;
	$.post( 'commands.php', { bash: [
		  "sed -i '/^volume_normalization/ s/\".*\"/\""+ ( G.normalization ? 'yes' : 'no' ) +"\"/' /etc/mpd.conf"
		, ( G.normalization ? 'echo yes > ' : 'rm -f ' ) + dirsystem +'/mpd-normalization'
		, restartmpd
		, curlPage( 'mpd' )
	] }, resetlocal );
	banner( 'Normalization', G.normalization, 'mpd' );
	checkNoVolume();
} );
$( '#replaygain' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		$( '#setting-replaygain' ).click();
	} else {
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i '/^replaygain/ s/\".*\"/\"off\"/' /etc/mpd.conf"
			, 'rm -f '+ dirsystem +'/mpd-replaygain'
			, restartmpd
			, curlPage( 'mpd' )
		] }, resetlocal );
		banner( 'Replay Gain', G.replaygain !== 'off', 'mpd' );
		checkNoVolume();
	}
} );
$( '#setting-replaygain' ).click( function() {
	info( {
		  icon      : 'mpd'
		, title     : 'Replay Gain'
		, radio     : { Auto: 'auto', Album: 'album', Track: 'track' }
		, preshow : function() {
			var checked = G.replaygain === 'off' ? 'auto' : G.replaygain;
			$( 'input[name=inforadio]' ).val( [ checked ] )
		}
		, cancel    : function() {
			if ( G.replaygain === 'off' ) {
				$( '#replaygain' ).prop( 'checked', 0 );
				$( '#setting-replaygain' ).addClass( 'hide' );
			}
		}
		, ok        : function() {
			replaygain = $( 'input[name=inforadio]:checked' ).val();
			if ( replaygain !== G.replaygain ) {
				G.replaygain = replaygain;
				local = 1;
				$.post( 'commands.php', { bash: [
					  "sed -i '/^replaygain/ s/\".*\"/\""+ replaygain +"\"/' /etc/mpd.conf"
					, 'echo '+ replaygain +' > '+ dirsystem +'/mpd-replaygain'
					, restartmpd
					, curlPage( 'mpd' )
				] }, resetlocal );
				banner( 'Replay Gain', 'Change ...', 'mpd' );
				$( '#setting-replaygain' ).removeClass( 'hide' );
			}
		}
	} );
} );
$( '#autoupdate' ).click( function() {
	G.autoupdate = $( this ).prop( 'checked' );
	local = 1;
	$.post( 'commands.php', { bash: [
		  "sed -i '/^auto_update/ s/\".*\"/\""+ ( G.autoupdate ? 'yes' : 'no' ) +"\"/' /etc/mpd.conf"
		, ( G.autoupdate ? 'echo yes > ' : 'rm -f ' ) + dirsystem +'/mpd-autoupdate'
		, restartmpd
		, curlPage( 'mpd' )
	] }, resetlocal );
	banner( 'Auto Update', G.autoupdate, 'mpd' );
} );
$( '#buffer' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		$( '#setting-buffer' ).click();
	} else {
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i '/^audio_buffer/ d' /etc/mpd.conf"
			, 'rm -f ' + dirsystem +'/mpd-buffer'
			, restartmpd
			, curlPage( 'mpd' )
		] }, resetlocal );
		banner( 'Custom Buffer', 'Disable ...', 'mpd' );
		$( '#setting-buffer' ).addClass( 'hide' );
	}
} );
$( '#setting-buffer' ).click( function() {
	info( {
		  icon      : 'mpd'
		, title     : 'Buffer'
		, message   : '&emsp;&emsp;&emsp;(default: 4096)'
		, textlabel : 'Buffer size <gr>(kB)</gr>'
		, textvalue : G.buffer || 4096
		, cancel    : function() {
			if ( !G.buffer ) {
				$( '#buffer' ).prop( 'checked', 0 );
				$( '#setting-buffer' ).addClass( 'hide' );
			}
		}
		, ok        : function() {
			var buffer = $( '#infoTextBox' ).val().replace( /\D/g, '' );
			if ( buffer < 4097 ) {
				info( {
					  icon    : 'mpd'
					, title   : 'Buffer'
					, message : '<i class="fa fa-warning fa-lg"></i> Warning<br>'
							   +'<br>Custom buffer must be greater than <wh>4096KB</wh>.'
				} );
				if ( !G.buffer ) $( '#buffer' ).prop( 'checked', 0 );
			} else if ( buffer !== G.buffer ) {
				G.buffer = buffer;
				local = 1;
				$.post( 'commands.php', { bash: [
					  "sed -i"
						+" -e '/^audio_buffer/ d'"
						+" -e '/^auto_update/ i\audio_buffer_size     \""+ buffer +"\"' /etc/mpd.conf"
					, 'echo '+ buffer +' > '+ dirsystem +'/mpd-buffer'
					, restartmpd
					, curlPage( 'mpd' )
				] }, resetlocal );
				banner( 'Custom Buffer', 'Change ...', 'mpd' );
			}
		}
	} );
} );
$( '#ffmpeg' ).click( function() {
	G.ffmpeg = $( this ).prop( 'checked' );
	local = 1;
	$.post( 'commands.php', { bash: [
		  "sed -i '/ffmpeg/ {n; s/\".*\"/\""+ ( G.ffmpeg ? 'yes' : 'no' ) +"\"/}' /etc/mpd.conf"
		, ( G.ffmpeg ? 'echo yes > ' : 'rm -f ' ) + dirsystem +'/mpd-ffmpeg'
		, restartmpd
		, curlPage( 'mpd' )
	] }, resetlocal );
	banner( 'FFmpeg Decoder', G.ffmpeg, 'mpd' );
} );
$( '#autoplay' ).click( function() {
	G.autoplay = $( this ).prop( 'checked' );
	local = 1;
	$.post( 'commands.php', { bash: [
		 ( G.autoplay ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/autoplay'
		, curlPage( 'mpd' )
	] }, resetlocal );
	banner( 'Play On Startup', G.autoplay, 'mpd' );
} );
$( '#aplay' ).click( function() {
	$( '#codeaplay' ).hasClass( 'hide' ) ? getAplay() : $( '#codeaplay' ).addClass( 'hide' );
} );
$( '#status' ).click( function( e ) {
	var $this = $( e.target );
	if ( $this.hasClass( 'fa-code' ) ) {
		$( '#codestatus' ).hasClass( 'hide' ) ? getStatus() : $( '#codestatus' ).addClass( 'hide' );
	} else {
		local = 1;
		info( {
			  icon    : 'mpd'
			, title   : 'MPD'
			, message : 'Restart MPD?'
			, ok      : function() {
				$this.removeClass( 'fa-reboot' ).addClass( 'fa-refresh blink' );
				$.post( 'commands.php', { bash: '/srv/http/bash/mpd-conf.sh' }, function() {
					$this.removeClass( 'fa-refresh blink' ).addClass( 'fa-gear' );
					refreshData();
					resetlocal();
				} );
				banner( 'MPD', 'Restart ...', 'mpd' );
			}
		} );
	}
} );
$( '#mpdconf' ).click( function() {
	$( '#codempdconf' ).hasClass( 'hide' ) ? getMpdconf() : $( '#codempdconf' ).addClass( 'hide' );
} );
function checkNoVolume() {
	if ( G.mixertype === 'none'
		&& G.crossfade === 0
		&& G.normalization === false
		&& G.replaygain === 'off'
	) {
		G.novolume = true;
	} else {
		G.novolume = false;
	}
	$( '#novolume' ).prop( 'checked', G.novolume );
}
function getAplay() {
	var card = $( '#audiooutput option:selected' ).data( 'card' );
	$.post( 'commands.php', { bash: 'aplay -l; echo; /usr/bin/sudo /usr/bin/amixer' }, function( status ) {
		$( '#codeaplay' )
			.html( status.join( '<br>' ) )
			.removeClass( 'hide' );
	}, 'json' );
}
function getMpdconf() {
	$.post( 'commands.php', { bash: 'cat /etc/mpd.conf' }, function( status ) {
		$( '#codempdconf' )
			.html( status.join( '<br>' ) )
			.removeClass( 'hide' );
//		$( 'html, body' ).scrollTop( $( '#mpdconf' ).offset().top - 60 );
	}, 'json' );
}
function getStatus() {
	$.post( 'commands.php', { bash: 'systemctl status mpd mpdidle'
								   +' | sed "s|\\(active (running)\\)|<grn>\1</grn>|;'
								   +'s|\\(inactive (dead)\\)|<red>\1</ed>|"'
		}, function( status ) {
		$( '#codestatus' )
			.html( data.join( '<br>' ) )
			.removeClass( 'hide' );
//		$( 'html, body' ).scrollTop( $( '#status' ).offset().top - 60 );
	}, 'json' );
}
function setMixerType( mixertype ) {
	var cmd = [];
	if ( mixertype === 'none' ) {
		var volumenone = 1;
		$.each( G.devices, function() {
			cmd.push( 'amixer -c '+ this.card +' sset '+ this.hwmixer +' 0dB' );
		} );
		cmd = Array.from( new Set( cmd ) ); // filter duplicates
	} else {
		var volumenone = 0;
	}
	cmd.push(
		  "sed -i '/^mixer_type/ s/\".*\"/\""+ mixertype +"\"/' /etc/mpd.conf"
		, 'echo '+ mixertype +' > '+ dirsystem +'/mpd-mixertype'
		, setmpdconf
		, curlPage( 'mpd' )
		, curlPage( volumenone, 'volumenone' )
	);
	G.mixertype = mixertype;
	local = 1;
	$.post( 'commands.php', { bash: cmd }, function() {
		if ( !$( '#codestatus' ).hasClass( 'hide' ) ) getStatus();
		if ( !$( '#codempdconf' ).hasClass( 'hide' ) ) getMpdconf();
		resetlocal();
	} );
	banner( 'Volume Level Control', 'Change ...', 'mpd' );
	checkNoVolume();
}

refreshData = function() {
	$.post( 'commands.php', { getjson: '/srv/http/bash/mpd-data.sh' }, function( list ) {
		G = list;
		var htmldevices = '';
		$.each( G.devices, function() {
			htmldevices += '<option '
				+'value="'+ this.aplayname +'" '
				+'data-card="'+ this.card +'" '
			if ( this.mixercount ) {
				htmldevices += 'data-hwmixer="'+ this.hwmixer +'" '
							  +'data-mixercount="'+ this.mixercount +'" '
			}
			if ( this.routecmd ) htmldevices += 'data-routecmd="'+ this.routecmd +'" ';
			if ( this.mixermanual ) htmldevices += 'data-mixermanual="'+ this.mixermanual +'" ';
			htmldevices += '">'+ this.name +'</option>';
		} );
		$( '#audiooutput' ).html( htmldevices );
		if ( G.usbdac ) {
			$( '#audiooutput' ).val( G.usbdac );
		} else {
			$( '#audiooutput option' ).filter( function() {
				var $this = $( this );
				return $this.text() === G.audiooutput && $this.val() === G.audioaplayname;
			} ).prop( 'selected', true );
		}
		$( '.hwmixer' ).toggleClass( 'hide', $( '#audiooutput option:selected' ).data( 'mixercount' ) < 2 );
		$( '#mixertype' ).val( G.mixertype );
		$( '#audiooutput, #mixertype' ).selectric( 'refresh' );
		$( '#dop' ).prop( 'checked', G.dop );
		checkNoVolume();
		$( '#crossfade' ).prop( 'checked', G.crossfade > 0 );
		$( '#setting-crossfade' ).toggleClass( 'hide', G.crossfade === 0 );
		$( '#normalization' ).prop( 'checked', G.normalization );
		$( '#replaygain' ).prop( 'checked', G.replaygain !== 'off' );
		$( '#setting-replaygain' ).toggleClass( 'hide', G.replaygain === 'off' );
		$( '#autoupdate' ).prop( 'checked', G.autoupdate );
		$( '#buffer' ).prop( 'checked', G.buffer > 4096 );
		$( '#setting-buffer' ).toggleClass( 'hide', G.buffer === '' );
		$( '#ffmpeg' ).prop( 'checked', G.ffmpeg );
		$( '#autoplay' ).prop( 'checked', G.autoplay );
		if ( !$( '#codeaplay' ).hasClass( 'hide' ) ) getAplay();
		if ( !$( '#codestatus' ).hasClass( 'hide' ) ) getStatus();
		if ( !$( '#codempdconf' ).hasClass( 'hide' ) ) getMpdconf();
		showContent();
	}, 'json' );
}
refreshData();

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
