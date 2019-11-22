$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

$( '#audiooutput' ).selectric( { maxWidth: 230 } );

var dirsystem = '/srv/http/data/system';
var restartmpd = 'systemctl restart mpd mpdidle';
var setmpdconf = '/srv/http/settings/mpd-conf.sh';
var warning = '<wh><i class="fa fa-warning fa-lg"></i>&ensp;Lower amplifier volume.</wh>'
			 +'<br>(If current level in MPD is not 100%.)'
			 +'<br><br>Signal level will be set to full amplitude to 0dB'
			 +'<br>Too high volume can damage speakers and ears';
function setMixerType( mixer, reloadpage ) {
	var cmd = [
		  "sed -i 's/mixer_type.*/mixer_type              \""+ mixer +"\"/' /etc/mpd.conf"
		, 'echo '+ mixer +' > '+ dirsystem +'/mpd-mixertype'
		, setmpdconf
		, pstream( 'mpd' )
	];
	if ( reloadpage ) cmd.push( 'curl -s -X POST "http://127.0.0.1/pub?id=reload" -d 1' );
	local = 1;
	$.post( 'commands.php', { bash: cmd }, resetlocal );
	$( '#audiooutput' ).data( 'mixertype', mixer );
	if ( mixer === 'none' ) {
		if ( !$( '#crossfade, #normalization, #replaygain' ).prop( 'checked' ) ) {
			$( '#novolume' ).data( 'novolume', 1 ).prop( 'checked', 1 );
			$( '#volume' ).addClass( 'hide' );
		}
	} else {
		$( '#novolume' ).data( 'novolume', 0 ).prop( 'checked', 0 );
		$( '#volume' ).removeClass( 'hide' );
	}
}
$( '#audiooutput' ).on( 'selectric-change', function() {
	var $selected = $( this ).find( ':selected' );
	var name = $selected.text();
	var sysname = $selected.val();
	var index = $selected.data( 'index' );
	var cmd = [
		  "sed -i 's/output_device = .*/output_device = \"hw:"+ index +"\";/' /etc/shairport-sync.conf"
		, 'systemctl try-restart shairport-sync shairport-meta'
		, pstream( 'mpd' )
	];
	// set only if not usbdac
	if ( name !== $( '#usbdac' ).val() ) cmd.push(
		  'echo '+ name +' > '+ dirsystem +'/audiooutput'
		, 'echo '+ sysname +' > '+ dirsystem +'/sysname'
	);
	var routecmd = $selected.data( 'routecmd' );
	if ( routecmd ) cmd.push( routecmd.replace( '*CARDID*', index ) );
	local = 1;
	$.post( 'commands.php', { bash: cmd }, resetlocal );
} );
$( '#setting-audiooutput' ).click( function() {
	var mixertype = $( '#audiooutput' ).data( 'mixertype' );
	info( {
		  icon     : 'mpd'
		, title    : 'Volume Level Control'
		, radio    : { 'Disable': 'none', 'DAC hardware': 'hardware', 'MPD Software': 'software' }
		, checked  : mixertype
		, ok       : function() {
			var mixer = $( '#infoRadio input[ type=radio ]:checked' ).val();
			if ( mixer === 'none' ) {
				info( {
					  icon    : 'volume'
					, title   : 'Volume Level'
					, message : warning
					, ok      : function() {
						setMixerType( mixer, 'reloadpage' );
					}
				} );
			} else {
				setMixerType( mixer, mixertype === 'none' ? 'reloadpage' : '' );
			}
			checkNoVolume();
		}
	} );
} );
$( '#dop' ).click( function() {
	local = 1;
	$.post( 'commands.php', { bash: [
		  ( ( $( this ).prop( 'checked' ) ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/mpd-dop' )
		, setmpdconf
		, pstream( 'mpd' )
	] }, resetlocal );
} );
function checkNoVolume() {
	if ( $( '#audiooutput' ).data( 'mixertype' ) === 'none'
		&& $( '#crossfade' ).val() == 0
		&& $( '#normalization' ).val() === 'no'
		&& $( '#replaygain' ).val() === 'off'
	) {
		$( '#novolume' ).prop( 'checked', 1 );
		$( '#volume' ).addClass( 'hide' );
	} else {
		$( '#novolume' ).prop( 'checked', 0 );
		$( '#volume' ).removeClass( 'hide' );
	}
}
$( 'body' ).on( 'click touchstart', function( e ) {
	// fired twice, input + label
	if ( e.target.id !== 'novolume' && $( e.target ).prop( 'for' ) !== 'novolume' ) checkNoVolume();
} );
$( '#novolume' ).click( function() {
	var $this = $( this );
	if ( $this.prop( 'checked' ) && !$this.data( 'val' ) ) {
		info( {
			  icon    : 'volume'
			, title   : 'Volume Level'
			, message : warning
			, ok      : function() {
				local = 1;
				$.post( 'commands.php', { bash: [
					  "sed -i -e 's/mixer_type.*/mixer_type              \"none\"/'"
						   +" -e 's/replaygain.*/replaygain              \"off\"/'"
						   +" -e 's/volume_normalization.*/volume_normalization    \"no\"/' /etc/mpd.conf"
					, 'echo none > '+ dirsystem +'/mpd-mixertype'
					, 'rm -f '+ dirsystem +'/{mpd-replaygain,mpd-normalization}'
					, 'mpc crossfade 0'
					, setmpdconf
					, pstream( 'mpd' )
					, 'curl -s -X POST "http://127.0.0.1/pub?id=reload" -d 1'
				] }, resetlocal );
				$( '#crossfade, #normalization, #replaygain' ).prop( 'checked', 0 );
				$( '#crossfade' ).val( 0 );
				$( '#normalization' ).val( 'no' );
				$( '#replaygain' ).val( 'off' );
				$( '#novolume' ).data( 'val', 1 );
				$( '#volume, #setting-crossfade, #setting-replaygain' ).addClass( 'hide' );
				$( '#audiooutput' ).data( 'mixertype', 'none' );
			}
		} );
	} else {
		$( '#volume' ).toggleClass( 'hide' );
	}
} );
$( '#crossfade' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		var crossfade = 2;
		var setcrossfade = 'echo '+ crossfade +' > ';
		$( '#setting-crossfade' ).removeClass( 'hide' );
		$( '#novolume' ).val( 0 ).prop( 'checked', 0 );
	} else {
		var crossfade = 0;
		var setcrossfade = 'rm -f ';
		$( '#setting-crossfade' ).addClass( 'hide' );
	}
	$( this ).val( crossfade );
	checkNoVolume();
	local = 1;
	$.post( 'commands.php', { bash: [
		  'mpc crossfade '+ crossfade
		, setcrossfade + dirsystem +'/mpd-crossfade'
		, pstream( 'mpd' )
	] }, resetlocal );
} );
$( '#setting-crossfade' ).click( function() {
	info( {
		  icon    : 'mpd'
		, title   : 'Crossfade'
		, message : 'Seconds:'
		, radio   : { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 }
		, checked : $( '#crossfade' ).val()
		, ok      : function() {
			var sec = $( '#infoRadio input[ type=radio ]:checked' ).val();
			local = 1;
			$.post( 'commands.php', { bash: [
				  'mpc crossfade '+ sec
				, 'echo '+ crossfade +' > '+ dirsystem +'/mpd-crossfade'
				, pstream( 'mpd' )
			] }, resetlocal );
			$( '#crossfade' ).val( sec );
		}
	} );
} );
$( '#normalization' ).click( function() {
	var yesno = $( this ).prop( 'checked' ) ? 'yes' : 'no';
	local = 1;
	$.post( 'commands.php', { bash: [
		  "sed -i 's/volume_normalization.*/volume_normalization    \""+ yesno +"\"/' /etc/mpd.conf"
		, ( ( yesno === 'yes' ? 'echo yes > ' : 'rm -f ' ) + dirsystem +'/mpd-normalization' )
		, restartmpd
		, pstream( 'mpd' )
	] }, resetlocal );
	$( this ).val( yesno );
	checkNoVolume();
	if ( yesno === 'yes' ) $( '#novolume' ).val( 0 ).prop( 'checked', 0 );
} );
$( '#replaygain' ).click( function() {
	if ( $( this ).prop( 'checked' ) ) {
		var replaygain = 'auto';
		var setreplaygain = 'echo auto > ';
		$( '#setting-replaygain' ).removeClass( 'hide' );
				$( '#novolume' ).val( 0 ).prop( 'checked', 0 );
	} else {
		var replaygain = 'off';
		var setreplaygain = 'rm -f ';
		$( '#setting-replaygain' ).addClass( 'hide' );
	}
	$( '#replaygain' ).val( replaygain );
	checkNoVolume();
	local = 1;
	$.post( 'commands.php', { bash: [
		  "sed -i 's/replaygain.*/replaygain              \""+ replaygain +"\"/' /etc/mpd.conf"
		, setreplaygain + dirsystem +'/mpd-replaygain'
		, restartmpd
		, pstream( 'mpd' )
	] }, resetlocal );
} );
$( '#setting-replaygain' ).click( function() {
	info( {
		  icon      : 'mpd'
		, title     : 'Replay Gain'
		, radio     : { Auto: 'auto', Album: 'album', Track: 'track' }
		, checked   : $( '#replaygain' ).val()
		, ok        : function() {
			var replaygain = $( '#infoRadio input[ type=radio ]:checked' ).val();
			$( '#replaygain' ).val( replaygain );
			local = 1;
			$.post( 'commands.php', { bash: [
				  "sed -i 's/replaygain.*/replaygain              \""+ replaygain +"\"/' /etc/mpd.conf"
				, 'echo '+ replaygain +' > '+ dirsystem +'/mpd-replaygain'
				, restartmpd
				, pstream( 'mpd' )
			] }, resetlocal );
		}
	} );
} );
$( '#autoupdate' ).click( function() {
	var yesno = $( this ).prop( 'checked' ) ? 'yes' : 'no';
	local = 1;
	$.post( 'commands.php', { bash: [
		  "sed -i 's/^auto_update.*/auto_update             \""+ yesno +"\"/' /etc/mpd.conf"
		, ( ( yesno === 'yes' ? 'echo yes > ' : 'rm -f ' ) + dirsystem +'/mpd-autoupdate' )
		, restartmpd
		, pstream( 'mpd' )
	] }, resetlocal );
} );
$( '#buffer' ).click( function() {
	if ( !$( this ).prop( 'checked' ) ) {
		$( '#setting-buffer' ).addClass( 'hide' );
		local = 1;
		$.post( 'commands.php', { bash: [
			  "sed -i 's/^audio_buffer_size.*/audio_buffer_size       \"4096\"/' /etc/mpd.conf"
			, 'rm -f '+ dirsystem +'/mpd-buffer'
			, restartmpd
			, pstream( 'mpd' )
		] }, resetlocal );
	} else {
		$( '#setting-buffer' ).removeClass( 'hide' ).click();
	}
} );
$( '#setting-buffer' ).click( function() {
	var buffer0 = $( '#buffer' ).data( 'buffer' );
	info( {
		  icon      : 'mpd'
		, title     : 'Buffer'
		, message   : '&emsp;&emsp;&emsp;(minimum: 4096)'
		, textlabel : 'Buffer size <gr>(KB)</gr>'
		, textvalue : buffer0
		, cancel    : function() {
			if ( buffer0 == 4096 ) {
				$( '#buffer' ).prop( 'checked', 0 );
				$( '#setting-buffer' ).addClass( 'hide' );
			}
		}
		, ok        : function() {
			var buffer = $( '#infoTextBox' ).val().replace( /\D/g, '' );
			if ( buffer < 4096 ) {
				info( {
					  icon    : 'mpd'
					, title   : 'Buffer'
					, message : '<i class="fa fa-warning fa-lg"></i> Warning<br>'
							   +'<br>Buffer size must be at least <wh>4096KB</wh>.'
				} );
				if ( buffer0 == 4096 ) {
					$( '#buffer' ).prop( 'checked', 0 );
					$( '#setting-buffer' ).addClass( 'hide' );
				}
				return
			}
			
			local = 1;
			$.post( 'commands.php', { bash: [
				  "sed -i 's/^audio_buffer_size.*/audio_buffer_size       \""+ buffer +"\"/' /etc/mpd.conf"
				, 'echo '+ buffer +' > '+ dirsystem +'/mpd-buffer'
				, restartmpd
				, pstream( 'mpd' )
			] }, resetlocal );
			if ( buffer == 4096 ) {
				$( '#buffer' ).prop( 'checked', 0 );
				$( '#setting-buffer' ).addClass( 'hide' );
			}
			$( '#buffer' ).data( 'buffer', buffer );
		}
	} );
} );
$( '#ffmpeg' ).click( function() {
	var yesno = $( this ).prop( 'checked' ) ? 'yes' : 'no';
	local = 1;
	$.post( 'commands.php', { bash: [
		  "sed -i '/ffmpeg/ {n;s/enabled.*/enabled            \""+ yesno +"\"/}' /etc/mpd.conf"
		, ( ( yesno === 'yes' ? 'echo yes > ' : 'rm -f ' ) + dirsystem +'/mpd-ffmpeg' )
		, restartmpd
		, pstream( 'mpd' )
	] }, resetlocal );
} );
$( '#autoplay' ).click( function() {
	local = 1;
	$.post( 'commands.php', { bash: [
		 ( ( $( this ).prop( 'checked' ) ? 'echo 1 > ' : 'rm -f ' ) + dirsystem +'/autoplay' )
		, pstream( 'mpd' )
	] }, resetlocal );
} );

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
