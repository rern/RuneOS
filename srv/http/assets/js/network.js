$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

var dirsystem = '/srv/http/data/system';
var intervalscan;
var wlcurrent = '';
var wlconnected = '';
var accesspoint = $( '#accesspoint' ).length;

nicsStatus();

$( '#back' ).click( function() {
	wlcurrent = '';
	clearInterval( intervalscan );
	$( '#divinterface, #divwebui, #divaccesspoint' ).removeClass( 'hide' );
	$( '#divwifi' ).addClass( 'hide' );
	if ( wlconnected ) { // refresh for ip to be ready
		$( '#refreshing' ).removeClass( 'hide' );
		wlanIP( wlconnected );
	} else {
		nicsStatus();
	}
} );
$( '#listinterfaces' ).on( 'click', 'li', function( e ) {
	var $this = $( this );
	var inf = $this.prop( 'class' );
	var ip = $this.data( 'ip' );
	var router = $this.data( 'router' );
	var dhcp = $this.data( 'dhcp' ) ? 1 : 0;
	if ( inf !== 'eth0' ) {
		wlcurrent = inf;
		if ( accesspoint && $( '#accesspoint' ).prop( 'checked' ) ) {
			info( {
				  icon    : 'wifi-3'
				, title   : 'RPi access point'
				, message : 'Stop RPi access point and connect a router?'
						   +'<br><br><i class="fa fa-warning fa-lg"></i>&ensp;<w>Warning</w>'
						   +'<br><br>Connected devices will be dropped.'
						   +'<br><w>Before continuing:</w>'
						   +'<br>Remote browser - with wired LAN IP'
						   +'<br>or connect a display and a mouse to RPi.'
				, ok      : function() {
					local = 1;
					$.post( 'commands.php', { bash: [
						  'systemctl stop hostapd dnsmasq'
						, 'rm -f /srv/http/data/system/accesspoint'
						, 'ifconfig wlan0 0.0.0.0'
						, pstream( 'network' )
						, pstream( 'system' )
					] }, function() {
						wlanStatus();
						resetlocal();
					} );
					$( '#accesspoint' ).prop( 'checked', 0 )
					$( '#boxqr, #settings-accesspoint' ).addClass( 'hide' );
				}
			} );
		} else {
			wlanStatus();
		}
	} else {
		var dataeth0 =   "Description='eth0 connection'"
						+'\nInterface=eth0'
						+'\nForceConnect=yes'
						+'\nSkipNoCarrier=yes'
						+'\nConnection=ethernet'
		info( {
			  icon         : 'lan'
			, title        : 'Edit LAN IP'
			, textlabel    : [ 'IP', 'Gateway', 'Primary DNS', 'Secondary DNS' ]
			, textvalue    : [ ip, router, router ]
			, textrequired : [ 0 ]
			, checkbox     : { 'Static IP': 1 }
			, preshow      : function() {
				$( '#infoText' ).toggle( dhcp !== 1 );
				$( '#infoCheckBox input' ).prop( 'checked', !dhcp );
			}
			, ok           : function() {
				var checked = $( '#infoCheckBox input' ).prop( 'checked' );
				var newdhcp = checked ? 0 : 1;
				if ( dhcp && newdhcp === dhcp ) return
				
				var ip = $( '#infoTextBox' ).val();
				var gw = $( '#infoTextBox1' ).val();
				var dns = "'"+ $( '#infoTextBox2' ).val() +"'";
				var dns2 = $( '#infoTextBox3' ).val();
				if ( dns2 ) dns += " '"+ dns2 +"'";
				if ( !checked ) {
					dataeth0 += '\nIP=dhcp';
				} else {
					dataeth0 +=  '\nAutoWired=yes'
								+'\nExcludeAuto=no'
								+'\nIP=static'
								+"\nAddress=('"+ ip +"/24')";
					if ( gw ) dataeth0 += "\nGateway=('"+ gw +"')";
					if ( dns ) dataeth0 += "\nDNS=("+ dns +")";
				}
				notify( 'LAN', 'Restarting ...', 'gear fa-spin', -1 );
				var cmd = [
					  'echo -e "'+ dataeth0 +'" | tee /etc/netctl/eth0 /srv/http/data/system/netctl-eth0'
					, 'systemctl restart netctl-ifplugd@eth0'
				]
				if ( !checked ) cmd.push( 'sleep 8' );
				$.post( 'commands.php', { bash: cmd }, nicsStatus );
			}
		} );
		$( '#infoCheckBox' ).on( 'click', 'input', function() {
			$( '#infoText' ).toggle( $( this ).prop( 'checked' ) );
		} );
	}
} );
$( '#listwifi' ).on( 'click', '.fa-save', function() {
	var $this = $( this ).parent();
	if ( ! $this.data( 'profile' ) || $this.data( 'connected' ) ) return
	
	var wlan = $this.data( 'wlan' );
	var ssid = $this.data( 'ssid' );
	info( {
		  icon        : 'wifi-3'
		, title       : 'Saved Wi-Fi'
		, message     : 'Forget / Connect ?'
		, buttonwidth : 1
		, buttonlabel : '<i class="fa fa-minus-circle"></i> Forget'
		, buttoncolor : '#bb2828'
		, button      : function() {
			local = 1;
			$.post( 'commands.php', { bash: [
				  'netctl stop "'+ ssid +'"'
				, 'systemctl disable netctl-auto@wlan0'
				, 'rm "/etc/netctl/'+ ssid +'" "/srv/http/data/system/netctl-'+ ssid +'"'
				, pstream( 'network' )
				] }, function() {
				wlconnected = '';
				wlanScan();
				resetlocal();
			} );
		}
		, oklabel     : 'Connect'
		, ok          : function() {
			connect( wlan, ssid, 0 );
		}
	} );
} );
$( '#listwifi' ).on( 'click', 'li', function( e ) {
	if ( $( e.target ).hasClass( 'fa-save' ) && !$( e.target ).parent().data( 'connected' ) ) return
	
	var $this = $( this );
	var wlan = $this.data( 'wlan' );
	var ssid = $this.data( 'ssid' );
	var encrypt = $this.data( 'encrypt' );
	var wpa = $this.data( 'wpa' );
	var eth0ip = $( '#listinterfaces li.eth0' ).data( 'ip' );
	if ( location.host === eth0ip ) {
		var msgreconnect = '';
	} else {
		var msgreconnect = '<br>Reconnect with IP: <wh>'+ eth0ip +'</wh>';
	}
	if ( $this.data( 'connected' ) ) {
		info( {
			  icon    : 'wifi-3'
			, title   : ssid
			, message : 
				'<div class="col-l">'
					+'IP<br>'
					+'Router'
				+'</div>'
				+'<div class="col-r" style="width: 180px; min-width: auto; top: 10px; color: #e0e7ee; text-align: left;">'
					+ $this.data( 'ip' ) +'<br>'
					+ $this.data( 'router' )
				+'</div>'
			, buttonwidth : 1
			, buttonlabel : '<i class="fa fa-minus-circle"></i> Forget'
			, buttoncolor : '#bb2828'
			, button      : function() {
				local = 1;
				$.post( 'commands.php', { bash: [
					  'netctl stop "'+ ssid +'"'
					, 'systemctl disable netctl-auto@wlan0'
					, 'rm "/etc/netctl/'+ ssid +'" "/srv/http/data/system/netctl-'+ ssid +'"'
					, pstream( 'network' )
					] }, function() {
					wlconnected = '';
					wlanScan();
					resetlocal();
				} );
			}
			, oklabel     : 'Disconnect'
			, ok          : function() {
				clearInterval( intervalscan );
				$( '#scanning' ).removeClass( 'hide' );
				local = 1;
				$.post( 'commands.php', { bash: [
					  'netctl stop "'+ ssid +'"'
					, 'systemctl disable netctl-auto@wlan'
					, pstream( 'network' )
					] }, function() {
						wlconnected = '';
						wlanScanInterval();
						resetlocal();
				} );
			}
		} );
	} else if ( $this.data( 'profile' ) ) { // saved wi-fi
		if ( accesspoint && $( '#accesspoint' ).prop( 'checked' ) ) {
			info( {
				  icon    : 'wifi-3'
				, title   : 'RPi access point'
				, message : 'Stop RPi access point and connect Wi-Fi?'
						   + msgreconnect
				, ok      : function() {
					connect( wlan, ssid, 0 );
				}
			} );
		} else {
			connect( wlan, ssid, 0 );
		}
	} else if ( encrypt === 'on' ) { // new wi-fi
		newWiFi( $this );
	} else { // no password
		var data = 'Interface='+ wlan
				  +'\nConnection=wireless'
				  +'\nIP=dhcp'
				  +'\nESSID="'+ ssid +'"'
				  +'\nSecurity=none';
		connect( wlan, ssid, data );
	}
} );
$( '#add' ).click( function() {
	$this = $( this );
	info( {
		  icon          : 'wifi-3'
		, title         : 'Add Wi-Fi'
		, textlabel     : [ 'SSID', 'IP', 'Gateway' ]
		, checkbox      : { 'Static IP': 1, 'Hidden SSID': 1, 'WEP': 1 }
		, passwordlabel : 'Password'
		, preshow       : function() {
			$( '#infotextlabel a:eq( 1 ), #infoTextBox1, #infotextlabel a:eq( 2 ), #infoTextBox2' ).hide();
		}
		, ok            : function() {
			var ssid = $( '#infoTextBox' ).val();
			var wlan = $( '#listwifi li:eq( 0 )' ).data( 'wlan' );
			var password = $( '#infoPasswordBox' ).val();
			var ip = $( '#infoTextBox2' ).val();
			var gw = $( '#infoTextBox3' ).val();
			var hidden = $( '#infoCheckBox input:eq( 1 )' ).prop( 'checked' );
			var wpa = $( '#infoCheckBox input:eq( 2 )' ).prop( 'checked' ) ? 'wep' : 'wpa';
			var data = 'Interface='+ wlan
					  +'\nConnection=wireless'
					  +'\nIP=dhcp'
					  +'\nESSID="'+ ssid +'"';
			if ( hidden ) {
				data += '\nHidden=yes';
			}
			if ( password ) {
				data += '\nSecurity='+ wpa
					   +'\nKey="'+ password +'"';
			}
			if ( ip ) {
				data += '\nAddress='+ ip
					   +'\nGateway='+ gw;
			}
			connect( wlan, ssid, data );
		}
	} );
	$( '#infoCheckBox' ).on( 'click', 'input:eq( 0 )', function() {
		$( '#infotextlabel a:eq( 1 ), #infoTextBox1, #infotextlabel a:eq( 2 ), #infoTextBox2' ).toggle( $( this ).prop( 'checked' ) );
	} );
} );
$( '#accesspoint' ).change( function() {
	$( '#refreshing' ).removeClass( 'hide' );
	if ( $( this ).prop( 'checked' ) ) {
		var cmd = [
				  'ifconfig wlan0 '+ $( '#ipwebuiap' ).text()
				, 'systemctl start hostapd dnsmasq'
				, 'echo 1 > '+ dirsystem +'/accesspoint'
				, 'systemctl disable --now netctl-auto@wlan0'
				, 'netctl stop-all'
				, pstream( 'network' )
		];
		if ( wlconnected ) {
			var eth0ip = $( '#listinterfaces li.eth0' ).data( 'ip' );
			var ipwebuiap = $( '#ipwebuiap' ).text();
			info( {
				  icon    : 'wifi-3'
				, title   : 'Wi-Fi'
				, message : 'Disconnect Wi-Fi and start RPi access point?'
						   + ( location.host === eth0ip ? '' : 'Reonnect with IP address: <wh>'+ ipwebuiap +'</wh>' )
				, ok      : function() {
					qr();
					$( '#boxqr, #settings-accesspoint' ).removeClass( 'hide' );
					local = 1;
					$.post( 'commands.php', { bash: cmd }, function() {
						nicsStatus();
						resetlocal();
					} );
				}
			} );
			return
		}
		
		qr();
		$( '#boxqr, #settings-accesspoint' ).removeClass( 'hide' );
	} else {
		$( '#boxqr, #settings-accesspoint' ).addClass( 'hide' );
		var cmd = [
			  'systemctl stop hostapd dnsmasq'
			, 'rm -f '+ dirsystem +'/accesspoint'
			, 'ifconfig wlan0 0.0.0.0'
			, pstream( 'network' )
		];
	}
	local = 1;
	$.post( 'commands.php', { bash: cmd }, function() {
		nicsStatus();
		resetlocal();
	} );
});
$( '#settings-accesspoint' ).click( function() {
	info( {
		  icon    : 'network'
		, title   : 'Access Point Settings'
		, textlabel : [ 'Password', 'IP' ]
		, textvalue : [ $( '#accesspoint' ).data( 'passphrase' ), $( '#accesspoint' ).data( 'ip' ) ]
		, textrequired : [ 0, 1 ]
		, ok      : function() {
			var passphrase = $( '#infoTextBox' ).val();
			if ( passphrase && passphrase.length < 8 ) {
				info( 'Password must be at least 8 characters.' );
				return
			}
			
			var ip = $( '#infoTextBox1' ).val();
			var ips = ip.split( '.' );
			var ip3 = ips.pop();
			var ip012 = ips.join( '.' );
			var iprange = ip012 +'.'+ ( +ip3 + 1 ) +','+ ip012 +'.254,24h';
			var values = '"'+ passphrase +'" '+ ip +' '+ iprange;
			local = 1;
			$.post( 'commands.php', { bash: [
				  '/srv/http/settings/network-accesspoint.sh '+ values
				, 'echo '+ passphrase +' > '+ dirsystem +'/accesspoint-passphrase'
				, 'echo '+ ip +' > '+ dirsystem +'/accesspoint-ip'
				, 'echo '+ iprange +' > '+ dirsystem +'/accesspoint-iprange'
				, pstream( 'network' )
			] }, resetlocal );
			$( '#passphrase' ).text( passphrase || '(No password)' );
			$( '#ipwebuiap' ).text( ip );
			qr();
		}
	} );
} );

document.addEventListener( 'visibilitychange', function() {
	if ( !wlcurrent ) return
	
	if ( document.hidden ) {
		clearInterval( intervalscan );
	} else {
		wlanScanInterval();
	}
} );

function connect( wlan, ssid, data ) {
	clearInterval( intervalscan );
	wlcurrent = wlan;
	$( '#scanning' ).removeClass( 'hide' );
	var cmd = [
		  'echo -e "'+ data +'" | tee "/etc/netctl/'+ ssid +'" "/srv/http/data/system/netctl-'+ ssid +'"'
		, 'netctl stop-all'
		, 'ifconfig '+ wlan +' down'
		, 'netctl start "'+ ssid +'"'
	];
	if ( !data ) cmd.shift();
	local = 1;
	$.post( 'commands.php', { bash: cmd }, function( std ) {
		if ( std != -1 ) {
			wlconnected = wlan;
			if ( accesspoint && $( '#accesspoint' ).prop( 'checked' ) ) {
				$( '#listinterfaces li.wlan0' ).html( '<i class="fa fa-wifi-3"></i>Wi-Fi&ensp;<span class="green">&bull;</span>' );
				$( '#accesspoint' ).prop( 'checked', 0 );
				$( '#boxqr, #settings-accesspoint' ).addClass( 'hide' );
				var cmd = [
					  'systemctl stop hostapd dnsmasq'
					, 'rm -f '+ dirsystem +'/accesspoint'
					, 'ifconfig wlan0 0.0.0.0'
				];
			} else {
				var cmd = [];
			}
			cmd.push(
				  'systemctl enable netctl-auto@wlan0'
				, pstream( 'network' )
			);
			$.post( 'commands.php', { bash: cmd }, function() {
				wlanScanInterval();
				resetlocal();
			} );
		} else {
			$( '#scanning' ).addClass( 'hide' );
			wlconnected =  '';
			info( {
				  icon      : 'wifi-3'
				, title     : 'Wi-Fi'
				, message   : 'Connect to <wh>'+ ssid +'</wh> failed.'
			} );
			resetlocal();
		}
	} );
}
function escape_string( string ) {
	var to_escape = [ '\\', ';', ',', ':', '"' ];
	var hex_only = /^[0-9a-f]+$/i;
	var output = "";
	for ( var i = 0; i < string.length; i++ ) {
		if ( $.inArray( string[ i ], to_escape ) != -1 ) {
			output += '\\'+string[ i ];
		} else {
			output += string[ i ];
		}
	}
	return output;
};
function newWiFi( $this ) {
	var wlan = $this.data( 'wlan' );
	var ssid = $this.data( 'ssid' );
	var wpa = $this.data( 'wpa' );
	info( {
		  icon          : 'wifi-3'
		, title         : 'Wi-Fi'
		, message       : 'Connect: <wh>'+ ssid +'</wh>'
		, passwordlabel : 'Password'
		, ok            : function() {
			var data = 'Interface='+ wlan
					  +'\nConnection=wireless'
					  +'\nIP=dhcp'
					  +'\nESSID="'+ ssid +'"'
					  +'\nSecurity='+ ( wpa || 'wep' )
					  +'\nKey="'+ $( '#infoPasswordBox' ).val() +'"';
			connect( wlan, ssid, data );
		}
	} );
}
function nicsStatus() {
	$.post( 'commands.php', { bash: '/srv/http/settings/network-status.sh' }, function( data ) {
		var html = '';
		data.forEach( function( el ) {
			var val = el.split( '^^' );
			var inf = val[ 0 ];
			var infname = inf === 'eth0' ? 'LAN' : 'Wi-Fi';
			if ( inf.slice( -1 ) != 0 ) infname += ' '+ inf.slice( -1 );
			var up = val[ 1 ];
			var ip = val[ 2 ];
			var dataip = ip ? ' data-ip="'+ ip +'"' : '';
			var ssid = val[ 3 ];
			var router = val[ 4 ];
			var datarouter = router ? ' data-router="'+ router +'"' : '';
			var dhcp = val[ 5 ] ? ' data-dhcp="1"' : '';
			var wlan = inf !== 'eth0';
			html += '<li class="'+ inf +'"'+ ( up ? ' data-up="1"' : ''  ) + dataip + datarouter + dhcp +'>';
			html += '<i class="fa fa-'+ ( wlan ? 'wifi-3' : 'lan' ) +'"></i>'+ infname;
			if ( accesspoint  && $( '#accesspoint' ).prop( 'checked' ) && wlan ) {
				html += '&ensp;<span class="green">&bull;</span>&ensp;'+ $( '#ipwebuiap' ).text() +'<gr>&ensp;&laquo;&ensp;RPi access point</gr></li>';
			} else if ( inf === 'eth0' ) {
				var routerhtml = router ? '<gr>&ensp;&raquo;&ensp;'+ router +'&ensp;</gr>' : '';
				if ( ip ) html += '&ensp;<span class="green">&bull;</span>&ensp;'+ ip + routerhtml +'</li>';
			} else {
				if ( router ) {
					wlconnected = inf;
					html += '&ensp;<span class="green">&bull;</span>&ensp;'+ ip +'<gr>&ensp;&raquo;&ensp;'+ router +'&ensp;&bull;&ensp;</gr>'+ ssid +'</li>';
				} else {
					html += '</li>';
				}
			}
		} );
		$( '#listinterfaces' ).html( html ).promise().done( function() {
			$( '#divaccesspoint' ).toggleClass( 'hide', $( '.wlan0' ).length === 0 );
		} );
		qr();
		$( '#refreshing' ).addClass( 'hide' );
		bannerHide();
	}, 'json' );
}
function qr() {
	var qroptions = { width  : 120, height : 120 }
	$( 'li' ).each( function() {
		var ip = $( this ).data( 'ip' );
		var router = $( this ).data( 'router' );
		if ( ip && router ) {
			$( '#qrwebui' ).empty();
			$( '#ipwebui' ).text( ip );
			qroptions.text = 'http://'+ ip;
			$( '#qrwebui' ).qrcode( qroptions );
			$( '#divwebui' ).removeClass( 'hide' );
			return false
		}
	} );
	if ( !accesspoint || !$( '#accesspoint' ).prop( 'checked' ) ) return
	
	$( '#qraccesspoint, #qrwebuiap' ).empty();
	qroptions.text = 'WIFI:S:'+ escape_string( $( '#ssid' ).text() ) +';T:WPA;P:'+ escape_string( $( '#passphrase' ).text() ) +';';
	$( '#qraccesspoint' ).qrcode( qroptions );
	qroptions.text = 'http://'+ $( '#ipwebuiap' ).text();
	$( '#qrwebuiap' ).qrcode( qroptions );
	$( '#boxqr' ).removeClass( 'hide' );
}
function wlanIP( wlconnected ) {
	$.post( 'commands.php', { bash: 'ip addr list '+ wlconnected +' | grep inet' }, function( std ) {
		if ( std != -1 ) {
			wlconnected = '';
			nicsStatus();
			$( '#refreshing' ).addClass( 'hide' );
		} else {
			setTimeout( function() {
				wlanIP( wlconnected )
			}, 1000 );
		}
	} );
}
function wlanScan() {
	$( '#scanning' ).removeClass( 'hide' );
	$.post( 'commands.php', { bash: '/srv/http/settings/network-wlanscan.sh '+ wlcurrent }, function( data ) {
		var val, dbm, db, ssid, encrypt, wpa, wlan, connected, profile, router, ip, db, wifi;
		var good = -60;
		var fair = -67;
		var html = '';
		data.forEach( function( el ) {
			val = el.split( '^^' );
			dbm = val[ 0 ];
			db = dbm.split( ' ' )[ 0 ];
			ssid = val[ 1 ];
			encrypt = val[ 2 ];
			wpa = val[ 3 ];
			wlan = val[ 4 ];
			connected = val[ 5 ] ? ' data-connected="1"' : '';
			profile = val[ 6 ] ? ' data-profile="1"' : '';
			router = val[ 7 ] ? ' data-router="'+ val[ 7 ] +'"' : '';
			ip = val[ 8 ] ? ' data-ip="'+ val[ 8 ] +'"' : '';
			html += '<li data-db="'+ db +'" data-ssid="'+ ssid +'" data-encrypt="'+ encrypt +'" data-wpa="'+ wpa +'" data-wlan="'+ wlan +'"'+ connected + profile + router + ip +'>';
			html += '<i class="fa fa-wifi-'+ ( db > good ? 3 : ( db < fair ? 1 : 2 ) ) +'"></i>';
			html += connected ? '<span class="green">&bull;</span>&ensp;' : '';
			html += db < fair ? '<gr>'+ ssid +'</gr>' : ssid;
			html += encrypt === 'on' ? ' <i class="fa fa-lock"></i>' : '';
			html += '<gr>'+ dbm +'</gr>';
			html += profile ? '&ensp;<i class="fa fa-save"></i>' : '';
			$( '#listwifi' ).html( html +'</li>' ).promise().done( function() {
				bannerHide();
				$( '#scanning' ).addClass( 'hide' );
			} );
		} );
	}, 'json' );
}
function wlanScanInterval() {
	wlanScan();
	intervalscan = setInterval( function() {
		wlanScan();
	}, 12000 );
}
function wlanStatus() {
	$( '#divinterface, #divwebui, #divaccesspoint' ).addClass( 'hide' );
	$( '#listwifi' ).empty();
	$( '#divwifi' ).removeClass( 'hide' );
	wlanScanInterval()
}

} );
