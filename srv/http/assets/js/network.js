$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

var dirsystem = '/srv/http/data/system';
var wlcurrent = '';
var wlconnected = '';
var accesspoint = $( '#accesspoint' ).length;
var backdelay = 0;

$( '#back' ).click( function() {
	wlcurrent = '';
	clearInterval( intervalscan );
	$( '#divinterface, #divwebui, #divaccesspoint' ).removeClass( 'hide' );
	$( '#divwifi' ).addClass( 'hide' );
	setTimeout( nicsStatus, backdelay );
} );
$( '#listinterfaces' ).on( 'click', 'li', function( e ) {
	var $this = $( this );
	wlcurrent = $this.prop( 'class' );
	if ( wlcurrent !== 'eth0' ) {
		if ( G.hostapd && wlcurrent === 'wlan0' ) {
			info( {
				  icon    : 'wifi-3'
				, title   : 'Wi-Fi'
				, message : 'Access Point must be disabled.'
			} );
			return
		} else {
			wlanStatus();
		}
	} else {
		var ip = $this.data( 'ip' );
		var gateway = $this.data( 'gateway' );
		var dhcp = $this.data( 'dhcp' ) ? 1 : 0;
		var dataeth0 =   "Description='eth0 connection'"
						+'\nInterface=eth0'
						+'\nForceConnect=yes'
						+'\nSkipNoCarrier=yes'
						+'\nConnection=ethernet'
		info( {
			  icon         : 'lan'
			, title        : 'Edit LAN IP'
			, textlabel    : [ 'IP', 'Gateway', 'Primary DNS', 'Secondary DNS' ]
			, textvalue    : [ ip, gateway, gateway ]
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
				, 'systemctl disable netctl-auto@'+ wlan
				, 'rm "/etc/netctl/'+ ssid +'" "/srv/http/data/system/netctl-'+ ssid +'"'
				, curlPage( 'network' )
				] }, function() {
				wlconnected = '';
				wlanScan();
				resetlocal();
			} );
			banner( 'Wi-Fi', 'Forget ...', 'wifi-3' );
		}
		, oklabel     : 'Connect'
		, ok          : function() {
			connect( wlan, ssid, 0 );
		}
	} );
} );
$( '#listwifi' ).on( 'click', 'li', function( e ) {
	
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
	if ( $( e.target ).hasClass( 'fa-info-circle' ) || $this.data( 'connected' ) ) {
		var connected = $this.data( 'connected' );
		info( {
			  icon    : 'wifi-3'
			, title   : ssid
			, message : !connected ? 'Saved Wi-Fi connection:' :
				'<div class="col-l">'
					+'IP<br>'
					+'Router'
				+'</div>'
				+'<div class="col-r" style="width: 180px; min-width: auto; top: 10px; color: #e0e7ee; text-align: left;">'
					+ $this.data( 'ip' ) +'<br>'
					+ $this.data( 'gateway' )
				+'</div>'
			, buttonwidth : 1
			, buttonlabel : '<i class="fa fa-minus-circle"></i> Forget'
			, buttoncolor : '#bb2828'
			, button      : function() {
				clearInterval( intervalscan );
				local = 1;
				$.post( 'commands.php', { bash: [
					  'netctl stop "'+ ssid +'"'
					, 'systemctl disable netctl-auto@'+ wlan
					, 'rm "/etc/netctl/'+ ssid +'" "/srv/http/data/system/netctl-'+ ssid +'"'
					, curlPage( 'network' )
					] }, function() {
					wlconnected = '';
					wlanScanInterval();
					resetlocal();
				} );
				banner( 'Wi-Fi', 'Forget ...', 'wifi-3' );
			}
			, oklabel     : !connected ? 'Connect' : 'Disconnect'
			, ok          : function() {
				if ( !connected ) {
					connect( wlan, ssid, 0 );
				} else {
					clearInterval( intervalscan );
					local = 1;
					$.post( 'commands.php', { bash: [
						  'netctl stop "'+ ssid +'"'
						, curlPage( 'network' )
						] }, function() {
							wlconnected = '';
							wlanScanInterval();
							resetlocal();
					} );
					banner( 'Wi-Fi', 'Disconnect ...', 'wifi-3' );
				}
			}
		} );
	} else if ( $this.data( 'profile' ) ) { // saved wi-fi
		connect( wlan, ssid, 0 );
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
	if ( !$( '#divinterface li.wlan0' ).length ) {
		info( {
			  icon    : 'wifi-3'
			, title   : 'Wi-Fi'
			, message : 'Wi-Fi device not available.'
					   +'<br>Enable in Sysytem settings.'
		} );
		$( this ).prop( 'checked', 0 );
		return
	}
	
	G.hostapd = $( this ).prop( 'checked' );
	if ( G.hostapd ) {
		if ( $( '#divinterface li.wlan0' ).data( 'gateway' ) ) {
			info( {
				  icon    : 'network'
				, title   : 'Access Point'
				, message : 'Wi-Fi wlan0 must be disconnected.'
			} );
			$( this ).prop( 'checked', 0 );
			G.hostapd = false;
			return
		}
		
		var cmd = [
				  'ifconfig wlan0 '+ G.hostapdip
				, 'systemctl start hostapd dnsmasq'
				, 'echo 1 > '+ dirsystem +'/accesspoint'
				, curlPage( 'network' )
		];
	} else {
		$( '#boxqr, #settings-accesspoint' ).addClass( 'hide' );
		var cmd = [
			  'systemctl stop hostapd dnsmasq'
			, 'rm -f '+ dirsystem +'/accesspoint'
			, 'ifconfig wlan0 0.0.0.0'
			, curlPage( 'network' )
		];
	}
	local = 1;
	$.post( 'commands.php', { bash: cmd }, function() {
		nicsStatus();
		resetlocal();
		if ( G.hostapd ) renderQR();
	} );
	banner( 'RPi Access Point', G.hostapd, 'wifi-3' );
});
$( '#settings-accesspoint' ).click( function() {
	info( {
		  icon      : 'network'
		, title     : 'Access Point Settings'
		, message   : 'Password - at least 8 characters'
		, textlabel : [ 'Password', 'IP' ]
		, textvalue : [ G.passphrase, G.hostapdip ]
		, textrequired : [ 0, 1 ]
		, ok      : function() {
			var ip = $( '#infoTextBox1' ).val();
			var passphrase = $( '#infoTextBox' ).val();
			if ( ip === G.hostapdip && passphrase === G.passphrase ) return
			
			if ( passphrase.length < 8 ) {
				info( 'Password must be at least 8 characters.' );
				return
			}
			
			G.hostapdip = ip;
			G.passphrase = passphrase;
			var ips = ip.split( '.' );
			var ip3 = ips.pop();
			var ip012 = ips.join( '.' );
			var iprange = ip012 +'.'+ ( +ip3 + 1 ) +','+ ip012 +'.254,24h';
			
			var cmd = [
				  "sed -i"
					+" -e 's/^\\(dhcp-range=\\).*/\\1"+ iprange +"/'"
					+" -e 's/^\\(.*option:router,\\).*/\\1"+ ip +"/'"
					+" -e 's/^\\(.*option:dns-server,\\).*/\\1"+ ip +"/'"
					+" /etc/dnsmasq.conf"
				, "sed -i"
					+" -e '/wpa\\|rsn_pairwise/ s/^#\\+//'"
					+" -e 's/\\(wpa_passphrase=\\).*/\\1"+ passphrase +"/'"
					+" /etc/hostapd/hostapd.conf"
				, 'systemctl restart hostapd dnsmasq'
				, curlPage( 'network' )
			];
			if ( ip === '192.168.5.1' ) {
				cmd.push( 'rm -f '+ dirsystem +'/accesspoint-ip*' );
			} else {
				cmd.push(
					  'echo '+ ip +' > '+ dirsystem +'/accesspoint-ip'
					, 'echo '+ iprange +' > '+ dirsystem +'/accesspoint-iprange'
				);
			}
			cmd.push( ( passphrase === 'RuneAudio' ? 'rm -f ' : 'echo '+ passphrase +' > ' ) + dirsystem +'/accesspoint-passphrase' )
			local = 1;
			$.post( 'commands.php', { bash: cmd }, resetlocal );
			banner( 'RPi Access Point', 'Change ...', 'wifi-3' );
			$( '#passphrase' ).text( passphrase || '(No password)' );
			$( '#ipwebuiap' ).text( ip );
			renderQR();
		}
	} );
} );
$( '#ifconfig' ).click( function() {
	$( '#codeifconfig' ).hasClass( 'hide' ) ? getIfconfig() : $( '#codeifconfig' ).addClass( 'hide' );
} );
$( '#netctl' ).click( function() {
	$( '#codenetctl' ).hasClass( 'hide' ) ? getNetctl() : $( '#codenetctl' ).addClass( 'hide' );
} );

function connect( wlan, ssid, data ) {
	clearInterval( intervalscan );
	wlcurrent = wlan;
	$( '#scanning' ).removeClass( 'hide' );
	var cmd = [
		  'echo -e "'+ data +'" > "/srv/http/data/system/netctl-'+ ssid +'"'
		, 'cp "/srv/http/data/system/netctl-'+ ssid +'" "/etc/netctl/'+ ssid +'"'
		, 'netctl stop-all'
		, 'ifconfig '+ wlan +' down'
		, 'netctl start "'+ ssid +'"'
	];
	if ( !data ) cmd.shift();
	local = 1;
	$.post( 'commands.php', { bash: cmd }, function( std ) {
		if ( std != -1 ) {
			wlconnected = wlan;
			$.post( 'commands.php', { bash: [
				  'systemctl enable netctl-auto@'+ wlan
				, curlPage( 'network' )
			] }, function() {
				wlanScanInterval();
				resetlocal();
				$( 'li.'+ wlan +' .fa-search')
					.removeClass( 'fa-search' )
					.addClass( 'fa-refresh blink' )
					.next().remove();
				backdelay = 6000;
				var delayint = setInterval( function() {
					backdelay -= 1000;
					if ( !backdelay ) clearInterval( delayint );
				}, 1000 );
			} );
			banner( 'Wi-Fi', 'Connect ...', 'wifi-3' );
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
function getIfconfig() {
	$.post( 'commands.php', { bash: 'ip a' }, function( status ) {
		$( '#codeifconfig' )
			.html( status.join( '<br>' ) )
			.removeClass( 'hide' );
//		$( 'html, body' ).scrollTop( $( '#ifconfig' ).offset().top - 60 );
	}, 'json' );
}
function getNetctl() {
	$.post( 'commands.php', { bash: 'netctl list' }, function( status ) {
		if ( !status.length ) status = [ '(none)' ];
		$( '#codenetctl' )
			.html( status.join( '<br>' ) )
			.removeClass( 'hide' );
//		$( 'html, body' ).scrollTop( $( '#codenetctl' ).offset().top - 60 );
	}, 'json' );
}
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
	$.post( 'commands.php', { getjson: '/srv/http/bash/network-data.sh' }, function( list ) {
		var reboot = list.pop();
		var html = '';
		$.each( list, function( i, val ) {
			if ( 'hostapd' in val ) {
				G = val;
				$( '#ssid' ).text( G.ssid );
				$( '#passphrase' ).text( G.passphrase )
				$( '#ipwebuiap' ).text( G.hostapdip );
				$( '#accesspoint' ).prop( 'checked', G.hostapd );
				$( '#settings-accesspoint, #boxqr' ).toggleClass( 'hide', !G.hostapd );
				return
			}
			
			html += '<li class="'+ val.interface +'"';
			html += val.state === 'UP' ? ' data-up="1"' : '';
			html += val.ip ? ' data-ip="'+ val.ip +'"' : '';
			html += val.gateway ? ' data-gateway="'+ val.gateway +'"' : '';
			html += val.dhcp ? ' data-dhcp="1"' : '';
			html += '><i class="fa fa-';
			html += val.interface === 'eth0' ? 'lan"></i>LAN' : 'wifi-3"></i>Wi-Fi';
			if ( val.interface === 'eth0' ) {
				html += val.ip ? '&ensp;<grn>&bull;</grn>&ensp;'+ val.ip : '';
				html += val.gateway ? '<gr>&ensp;&raquo;&ensp;'+ val.gateway +'&ensp;</gr>' : '';
			} else if ( val.gateway ) {
				wlconnected = val.interface;
				html += '&ensp;<grn>&bull;</grn>&ensp;'+ val.ip +'<gr>&ensp;&raquo;&ensp;'+ val.gateway +'&ensp;&bull;&ensp;</gr>'+ val.ssid;
			} else if ( accesspoint && G.hostapd && val.ip === G.hostapdip ) {
				html += '&ensp;<grn>&bull;</grn>&ensp;<gr>RPi access point&ensp;&raquo;&ensp;</gr>'+ G.hostapdip
			} else {
				html += '&emsp;<i class="fa fa-search"></i><gr>Scan</gr>';
			}
			html += '</li>';
		} );
		G.reboot = reboot;
		$( '#refreshing' ).addClass( 'hide' );
		$( '#listinterfaces' ).html( html );
		renderQR();
		bannerHide();
		if ( !$( '#codeifconfig' ).hasClass( 'hide' ) ) getIfconfig();
		if ( !$( '#codenetctl' ).hasClass( 'hide' ) ) getNetctl();
		showContent();
	}, 'json' );
}
function renderQR() {
	var qroptions = { width  : 120, height : 120 }
	$( 'li' ).each( function() {
		var ip = $( this ).data( 'ip' );
		var gateway = $( this ).data( 'gateway' );
		if ( ip && gateway ) {
			$( '#qrwebui' ).empty();
			$( '#ipwebui' ).text( ip );
			qroptions.text = 'http://'+ ip;
			$( '#qrwebui' ).qrcode( qroptions );
			$( '#divwebui' ).removeClass( 'hide' );
			return false
		}
	} );
	if ( !accesspoint || !G.hostapd ) return
	
	$( '#qraccesspoint, #qrwebuiap' ).empty();
	qroptions.text = 'WIFI:S:'+ escape_string( G.ssid ) +';T:WPA;P:'+ escape_string( G.passphrase ) +';';
	$( '#qraccesspoint' ).qrcode( qroptions );
	qroptions.text = 'http://'+ G.hostapdip;
	$( '#qrwebuiap' ).qrcode( qroptions );
	$( '#boxqr' ).removeClass( 'hide' );
}
function wlanScan() {
	$( '#scanning' ).removeClass( 'hide' );
	$.post( 'commands.php', { getjson: '/srv/http/bash/network-wlanscan.sh' }, function( list ) {
		var good = -60;
		var fair = -67;
		var html = '';
		$.each( list, function( i, val ) {
			html += '<li data-db="'+ val.dbm +'" data-ssid="'+ val.ssid +'" data-encrypt="'+ val.encrypt +'" data-wpa="'+ val.wpa +'" data-wlan="'+ val.wlan +'"';
			html += val.connected  ? ' data-connected="1"' : '';
			html += val.gateway ? ' data-gateway="'+ val.gateway +'"' : '';
			html += val.ip ? ' data-ip="'+ val.ip +'"' : '';
			html += val.profile ? ' data-profile="1"' : '';
			html += '><i class="fa fa-wifi-'+ ( val.dbm > good ? 3 : ( val.dbm < fair ? 1 : 2 ) ) +'"></i>';
			html += val.connected ? '<grn>&bull;</grn>&ensp;' : '';
			html += val.dbm < fair ? '<gr>'+ val.ssid +'</gr>' : val.ssid;
			html += val.encrypt === 'on' ? ' <i class="fa fa-lock"></i>' : '';
			html += '<gr>'+ val.dbm +' dBm</gr>';
			html += val.profile ? '&ensp;<i class="fa fa-info-circle wh"></i>' : '';
		} );
		$( '#listwifi' ).html( html +'</li>' ).promise().done( function() {
			bannerHide();
			$( '#scanning' ).addClass( 'hide' );
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

refreshData = function() {
	!wlcurrent ? nicsStatus() : wlanScanInterval();
}
refreshData();

} );
