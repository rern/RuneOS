$( function() { // document ready start >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

var dirsystem = '/srv/http/data/system';
var formdata = {}
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
						, 'rm -f "'+ dirsystem +'/fstab-'+ mountpoint.split( '/' ).pop() +'"'
						, curlPage( 'source' )
					] }, function() {
					refreshData();
					resetlocal();
					$( '#refreshing' ).addClass( 'hide' );
				} );
				banner( 'Network Mount', 'Remove ...', 'network' );
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
						, curlPage( 'source' )
					] }, function() {
					refreshData();
					resetlocal();
					$( '#refreshing' ).addClass( 'hide' );
				} );
				banner( 'Network Mount', 'Unmount ...', 'network' );
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
						, curlPage( 'source' )
					] }, function() {
					refreshData();
					resetlocal();
					$( '#refreshing' ).addClass( 'hide' );
				} );
				banner( 'Network Mount', 'Remount ...', 'network' );
				$( '#refreshing' ).removeClass( 'hide' );
			}
		} );
	}
} );
$( '#listshare' ).on( 'click', 'li', function() {
	if ( $( this ).find( '.fa-search' ).length || !$( '#refreshshares' ).hasClass( 'hide' ) ) {
		$( '#listshare' ).html( '<li><i class="fa fa-network blink"></i><grl>Scanning ...</grl></li>' );
		$.post( 'commands.php', { bash: '/srv/http/bash/sources-sharescan.sh' }, function( list ) {
			var list = JSON.parse( list );
			if ( list.length ) {
				var html = '';
				$.each( list, function( i, val ) {
					html += '<li data-mount="//'+ val.ip +'/'+ val.share +'"><i class="fa fa-network"></i><gr>'+ val.host +'&ensp;&raquo;&ensp;</gr>//'+ val.ip +'/'+ val.share +'</li>';
				} );
			} else {
				var html = '<li><i class="fa fa-info-circle"></i><gr>No shares available</gr></li>';
			}
			$( '#listshare' ).html( html );
			$( '#refreshshares' ).removeClass( 'hide' );
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
$( '#refreshshares' ).click( function() {
	$( '#listshare li' ).click();
} );
$( '#mount' ).click( function() {
	$( '#codemount' ).hasClass( 'hide' ) ? getMounts() : $( '#codemount' ).addClass( 'hide' );
} );
$( '#fstab' ).click( function() {
	$( '#codefstab' ).hasClass( 'hide' ) ? getFstab() : $( '#codefstab' ).addClass( 'hide' );
} );

function getMounts() {
	$.post( 'commands.php', { bash: 'mount | grep MPD' }, function( status ) {
		$( '#codemount' )
			.html( status.join( '<br>' ) )
			.removeClass( 'hide' );
	}, 'json' );
}
function getFstab() {
	$.post( 'commands.php', { bash: 'cat /etc/fstab' }, function( status ) {
		$( '#codefstab' )
			.html( status.join( '<br>' ) )
			.removeClass( 'hide' );
	}, 'json' );
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
			var mountpoint = '/mnt/MPD/NAS/'+ G.name;
			var ip = G.ip;
			var directory = G.directory.replace( /^\//, '' );
			if ( G.protocol === 'cifs' ) {
				var options = 'noauto';
				options += ( !G.user ) ? ',username=guest' : ',username='+ G.user +',password='+ G.password;
				options += ',uid='+ $( '#list' ).data( 'uid' ) +',gid='+ $( '#list' ).data( 'gid' ) +',iocharset=utf8';
				options += G.options ? ','+ G.options : '';
				var device = '"//'+ ip +'/'+ directory +'"';
			} else {
				var options = 'defaults,noauto,bg,soft,timeo=5';
				options += G.options ? ','+ G.options : '';
				var device = '"'+ ip +':/'+ directory +'"';
			}
			var cmd = '"'+ mountpoint +'" '+ ip +' '+ device +' '+ G.protocol +' '+ options;
			local = 1;
			$.post( 'commands.php', { bash: [
					  '/srv/http/bash/sources-mount.sh '+ cmd
					, curlPage( 'source' )
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
					refreshData();
					formdata = {}
				}
				resetlocal();
				$( '#refreshing' ).addClass( 'hide' );
			}, 'json' );
			banner( 'Network Mount', 'Mount ...', 'network' );
			$( '#refreshing' ).removeClass( 'hide' );
		}
	} );
}

refreshData = function() {
	$( '#refreshing' ).removeClass( 'hide' );
	$.post( 'commands.php', { getjson: '/srv/http/bash/sources-data.sh' }, function( list ) {
		G = list;
		G.reboot = list.pop();
		if ( G.length ) {
			var html = '';
			$.each( G, function( i, val ) {
				html += '<li data-mountpoint="'+ val.mountpoint +'"><i class="fa fa-'+ val.icon +'"></i>'+ val.mountpoint;
				html += val.mounted ? '<grn>&ensp;&bull;&ensp;</grn>' : '<red>&ensp;&bull;&ensp;</red>';
				html += '<gr>'+ val.source +'</gr>';
				html +=  val.size ? '&ensp;'+ val.size +'</li>' : '</li>';
			} );
		} else {
			html = '<li><i class="fa fa-info-circle"></i><gr>No sources available<gr></li>';
		}
		$( '#list' ).html( html );
		$( '#refreshing' ).addClass( 'hide' );
		if ( !$( '#codemount' ).hasClass( 'hide' ) ) getMounts();
		if ( !$( '#codefstab' ).hasClass( 'hide' ) ) getFstab();
		showContent();
	}, 'json' );
}
refreshData();

} ); // document ready end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
