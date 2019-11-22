$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

var dirsystem = '/srv/http/data/system';
var formdata = {}
mountStatus();

var html = heredoc( function() { /*
	<form id="formmount">
		<div id="infoRadio" class="infocontent infohtml">
			Type&emsp;<label><input type="radio" name="protocol" value="cifs"> CIFS</label>&emsp;
			<label><input type="radio" name="protocol" value="nfs"> NFS</label>
		</div>
		<div id="infoText" class="infocontent">
			<div id="infotextlabel">
				&emsp;&emsp;&emsp;&emsp;&emsp;Name<br>
				IP<br>
				<span id="sharename">Share name</span><br>
				<span class="guest">
					User<br>
					Password<br>
				</span>
				Options
			</div>
			<div id="infotextbox">
				<input type="text" class="infoinput" name="name" spellcheck="false">
				<input type="text" class="infoinput" name="ip" spellcheck="false">
				<input type="text" class="infoinput" name="directory" spellcheck="false">
				<div class="guest">
				<input type="text" class="infoinput" name="user" spellcheck="false">
				<input type="password" class="infoinput" name="password">
				</div>
				<input type="text" class="infoinput" name="options" spellcheck="false">
			</div>
		</div>
	</form>
*/ } );
$( '#addnas' ).click( function() {
	infoMount();
} );
$( '#infoContent' ).on( 'click', '#infoRadio', function() {
	if ( $( this ).find( 'input:checked' ).val() === 'nfs' ) {
		$( '#sharename' ).text( 'Share path' );
		$( '.guest' ).addClass( 'hide' );
	} else {
		$( '#sharename' ).text( 'Share name' );
		$( '.guest' ).removeClass( 'hide' );
	}
} );
$( '#list' ).on( 'click', 'li', function( e ) {
	var $this = $( this );
	var mountpoint = $this.data( 'mountpoint' );
	var mountname = mountpoint.replace( / /g, '\\\\040' );
	var nas = mountpoint.slice( 9, 12 ) === 'NAS';
	if ( $( e.target ).hasClass( 'remove' ) ) {  // remove
		info( {
			  icon    : 'network'
			, title   : 'Remove Network Mount'
			, message : '<wh>'+ mountpoint +'</wh>'
					   +'<br><br>Continue?'
			, oklabel : '<i class="fa fa-minus-circle"></i>Remove'
			, okcolor : '#bb2828'
			, ok      : function() {
				local = 1;
				$.post( 'commands.php', { bash: [
						  "sed -i '\\|"+ mountname +"| d' /etc/fstab"
						, 'rmdir "'+ mountpoint +'" &> /dev/null'
						, 'rm -f "'+ dirsystem +'/fstab-'+ mountname.split( '/' ).pop() +'"'
						, pstream( 'sources' )
					] }, function() {
					mountStatus();
					resetlocal();
					$( '#refreshing' ).addClass( 'hide' );
				} );
				$( '#refreshing' ).removeClass( 'hide' );
			}
		} );
		return
	}
	
	if ( !$this.data( 'unmounted' ) ) { // unmount
		info( {
			  icon    : nas ? 'network' : 'usbdrive'
			, title   : 'Unmount '+ ( nas ? 'Network Share' : 'USB Drive' )
			, message : '<wh>'+ mountpoint +'</wh>'
					   +'<br><br>Continue?'
			, oklabel : 'Unmount'
			, okcolor : '#de810e'
			, ok      : function() {
				local = 1;
				$.post( 'commands.php', { bash: [
						  ( nas ? '' : 'udevil ' ) +'umount -l "'+ mountpoint +'"'
						, pstream( 'sources' )
					] }, function() {
					mountStatus();
					resetlocal();
					$( '#refreshing' ).addClass( 'hide' );
				} );
				$( '#refreshing' ).removeClass( 'hide' );
			}
		} );
	} else { // remount
		info( {
			  icon    : nas ? 'network' : 'usbdrive'
			, title   : 'Mount '+ ( nas ? 'Network Share' : 'USB Drive' )
			, message : '<wh>'+ mountpoint +'</wh>'
					   +'<br><br>Continue?'
			, oklabel : 'Mount'
			, ok      : function() {
				local = 1;
				$.post( 'commands.php', { bash: [
						  ( nas ? 'mount "'+ mountpoint +'"' : 'udevil mount '+ $this.data( 'source' ) )
						, pstream( 'sources' )
					] }, function() {
					mountStatus();
					resetlocal();
					$( '#refreshing' ).addClass( 'hide' );
				} );
				$( '#refreshing' ).removeClass( 'hide' );
			}
		} );
	}
} );
$( '#listshare' ).on( 'click', 'li', function() {
	if ( $( this ).find( '.fa-search' ).length ) {
		$( '#listshare' ).html( '<li><i class="fa fa-network blink"></i><grl>Scanning ...</grl></li>' );
		$.post( 'commands.php', { bash: '/srv/http/settings/sources-lookup.sh' }, function( data ) {
			if ( data.length ) {
				var htmlshare = '';
				data.forEach( function( el ) {
					var val = el.split( '^^' );
					var host = val[ 0 ];
					var ip = val[ 1 ];
					var share = val[ 2 ];
					htmlshare += '<li data-mount="//'+ ip +'/'+ share +'"><i class="fa fa-network"></i><gr>'+ host +'&ensp;&raquo;&ensp;</gr>//'+ ip +'/'+ share +'</li>';
				} );
			} else {
				var htmlshare = '<li><i class="fa fa-search"></i><grl>No shares available.</grl></li>';
			}
			$( '#listshare' ).html( htmlshare );
		}, 'json' );
	} else {
		var source = $( this ).data( 'mount' );
		var ipshare = source.split( '/' );
		var share = ipshare.pop();
		var ip = ipshare.pop();
		infoMount( {
			  protocol  : 'cifs'
			, name      : share
			, ip        : ip
			, directory : share
		}, 'cifs' );
	}
} );

function mountStatus() {
	$.post( 'commands.php', { bash: '/srv/http/settings/sources-status.sh' }, function( data ) {
		if ( data ) $( '#list' ).html( data );
		$( '#refreshing' ).addClass( 'hide' );
	}, 'json' );
	$( '#refreshing' ).removeClass( 'hide' );
}
function infoMount( formdata, cifs ) {
	info( {
		  icon    : 'network'
		, title   : 'Mount Share'
		, content : html
		, preshow : function() {
			if ( $.isEmptyObject( formdata ) ) {
				$( '#infoRadio input' ).eq( 0 ).prop( 'checked', 1 );
				$( '#infotextbox input:eq( 1 )' ).val( '192.168.1.' );
			} else {
				if ( formdata.protocol === 'cifs' ) {
					$( '#infoRadio input' ).eq( 0 ).prop( 'checked', 1 );
					$( '#infotextbox input:eq( 3 )' ).val( formdata.user );
					$( '#infotextbox input:eq( 4 )' ).val( formdata.password );
				} else {
					$( '#infoRadio input' ).eq( 1 ).prop( 'checked', 1 );
					$( '.guest' ).addClass( 'hide' );
				}
				$( '#infotextbox input:eq( 0 )' ).val( formdata.name );
				$( '#infotextbox input:eq( 1 )' ).val( formdata.ip );
				$( '#infotextbox input:eq( 2 )' ).val( formdata.directory );
				$( '#infotextbox input:eq( 5 )' ).val( formdata.options );
			}
			if ( cifs ) $( '#infoRadio' ).hide();
		}
		, ok      : function() {
			var formmount = $( '#formmount' ).serializeArray();
			var data = {};
			$.map( formmount, function( val ) {
				data[ val[ 'name' ] ] = val[ 'value' ];
			});
			var mountpoint = '/mnt/MPD/NAS/'+ data.name;
			var ip = data.ip;
			var directory = data.directory.replace( /^\//, '' );
			if ( data.protocol === 'cifs' ) {
				var options = 'noauto';
				options += ( !data.user ) ? ',username=guest' : ',username='+ data.user +',password='+ data.password;
				options += ',uid='+ $( '#list' ).data( 'uid' ) +',gid='+ $( '#list' ).data( 'gid' ) +',iocharset=utf8';
				options += data.options ? ','+ data.options : '';
				var device = '"//'+ ip +'/'+ directory +'"';
			} else {
				var options = 'defaults,noauto,bg,soft,timeo=5';
				options += data.options ? ','+ data.options : '';
				var device = '"'+ ip +':/'+ directory +'"';
			}
			var cmd = '"'+ mountpoint +'" '+ ip +' '+ device +' '+ data.protocol +' '+ options;
			local = 1;
			$.post( 'commands.php', { bash: [
					  '/srv/http/settings/sources-mount.sh '+ cmd
					, pstream( 'sources' )
				] }, function( std ) {
				var std = std[ 0 ];
				if ( std ) {
					formdata = data;
					info( {
						  icon    : 'network'
						, title   : 'Mount Share'
						, message : std
						, ok      : function() {
							infoMount( formdata );
						}
					} );
				} else {
					mountStatus();
					formdata = {}
				}
				resetlocal();
				$( '#refreshing' ).addClass( 'hide' );
			}, 'json' );
			$( '#refreshing' ).removeClass( 'hide' );
		}
	} );
}

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
