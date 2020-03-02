/*
simple usage: 
info( 'message' );

normal usage:
info( {                                     // default
	width         : N                       // 400            (info width)
	icon          : 'NAME'                  // 'question'     (top icon)
	title         : 'TITLE'                 // 'Information'  (top title)
	nox           : 1                       // (show)         (no top 'X' close button)
	nobutton      : 1                       // (show)         (no button)
	boxwidth      : N                       // 200            (input text/password width - 'max' to fit)
	autoclose     : N                       // (disabled)     (auto close in ms)
	preshow       : FUNCTION                // (none)         (function before show)
	
	content       : 'HTML'                  //                (replace whole '#infoContent' html)
	message       : 'MESSAGE'               // (blank)        (message under title)
	messagealign  : 'CSS'                   // 'center'       (message under title)
	
	textlabel     : [ 'LABEL', ... ]        // (blank)        (label array input label)
	textvalue     : [ 'VALUE', ... ]        // (blank)        (pre-filled array input value)
	textrequired  : [ N, ... ]              // (none)         (required fields disable ok button if blank)
	textalign     : 'CSS'                   // 'left'         (input text alignment)
	
	passwordlabel : 'LABEL'                 // (blank)        (password input label)
	pwdrequired   : 1                       // (none)         (password required)
	
	fileoklabel   : 'LABEL'                 // 'OK'           (upload button label)
	fileokdisable : '1                      // (enable)       (disable file button after select)
	filetype      : 'TYPE'                  // (none)         (filter and verify filetype)
	
	radio         : { LABEL: 'VALUE', ... } //                ( var value = $( '#infoRadio input[ type=radio ]:checked' ).val(); )
	checked       : N                       // 0              (pre-select input index)
	
	select        : { LABEL: 'VALUE', ... } //                ( var value = $( '#infoSelectBox').val(); )
	selectlabel   : 'LABEL'                 // (blank)        (select input label)
	checked       : N                       // 0              (pre-select option index)
	
	checkbox      : { LABEL: 'VALUE', ... } //                ( $( '#infoCheckBox input[ type=checkbox ]:checked' ).each( function() {
	                                                                var value = this.value;
	                                                            } ); )
	checked       : [ N, ... ]              // (none)         (pre-select array input indexes)
	
	oklabel       : 'LABEL'                 // 'OK'           (ok button label)
	okcolor       : 'COLOR'                 // '#0095d8'      (ok button color)
	ok            : FUNCTION                // (reset)        (ok click function)
	cancellabel   : 'LABEL'                 // 'Cancel'       (cancel button label)
	cancelcolor   : 'COLOR'                 // '#34495e'      (cancel button color)
	cancelbutton  : 1                       // (hide)         (cancel button color)
	cancel        : FUNCTION                // (reset)        (cancel click function)
	
	buttonlabel   : [ 'LABEL', ... ]        //                (label array)
	button        : [ FUNCTION, ... ]       //                (function array)
	buttoncolor   : [ 'COLOR', ... ]        // '#34495e'      (color array)
	buttonwidth   : 1                       // (none)         (equal buttons width)
} );
Note:
- No default - must be specified.
- Single value/function - no need to be array
- select requires Selectric.js
*/
function heredoc( fn ) {
	return fn.toString().match( /\/\*\s*([\s\S]*?)\s*\*\//m )[ 1 ];
};
var containerhtml = heredoc( function() { /*
<div id="infoOverlay" class="hide" tabindex="1">
	<div id="infoBox">
		<div id="infoTopBg">
			<div id="infoTop">
				<i id="infoIcon"></i>&emsp;<a id="infoTitle"></a>
			</div>
			<i id="infoX" class="fa fa-times hide"></i>
			<div style="clear: both"></div>
		</div>
		<div id="infoContent">
		</div>
		<div id="infoButtons">
			<div id="infoFile">
				<a id="infoFileLabel" class="filebtn infobtn-primary">Browse</a>
				<span id="infoFilename"></span>
				<input type="file" class="infoinput" id="infoFileBox">
			</div>
			<a id="infoCancel" class="infobtn infobtn-default"></a>
			<a id="infoOk" class="infobtn infobtn-primary"></a>
		</div>
	</div>
</div>
*/ } );
infocontenthtml = heredoc( function() { /*
			<p id="infoMessage" class="infocontent"></p>
			<div id="infoText" class="infocontent hide">
				<div id="infotextlabel"></div>
				<div id="infotextbox"></div>
			</div>
			<div id="infoRadio" class="infocontent infocheckbox infohtml"></div>
			<div id="infoCheckBox" class="infocontent infocheckbox infohtml"></div>
			<div id="infoSelect" class="infocontent">
				<a id="infoSelectLabel" class="infolabel"></a><select class="infohtml" id="infoSelectBox"></select>
			</div>
*/ } );

$( 'body' ).prepend( containerhtml );

$( '#infoOverlay' ).keydown( function( e ) {
	if ( $( '#infoOverlay' ).is( ':visible' ) ) {
		if ( e.key == 'Enter' && !$( '#infoOk' ).hasClass( 'disabled' ) ) {
			$( '#infoOk' ).click();
		} else if ( e.key === 'Escape' ) {
			$( '#infoCancel' ).click();
		}
	}
} );
$( '#infoContent' ).on( 'click', '.eye', function() {
	$this = $( this );
	$pwd = $this.prev();
	if ( $pwd.prop( 'type' ) === 'text' ) {
		$this.removeClass( 'eyeactive' );
		$pwd.prop( 'type', 'password' );
	} else {
		$this.addClass( 'eyeactive' );
		$pwd.prop( 'type', 'text' );
	}
} );

function infoReset() {
	$( '#infoOverlay' ).addClass( 'hide' );
	$( '#infoBox' ).css( 'margin', '' );
	$( '#infoContent' ).html( infocontenthtml );
	$( '#infoX' ).removeClass( 'hide' );
	$( '.infocontent, .infolabel, .infoinput, .infohtml, .filebtn, .infobtn' ).addClass( 'hide' );
	$( '.infoinput' ).css( 'text-align', '' );
	$( '#infoBox, .infolabel, .infoinput' ).css( 'width', '' );
	$( '.filebtn, .infobtn' ).css( 'background', '' ).off( 'click' );
	$( '#infoIcon' ).removeAttr( 'class' );
	$( '#infoFileBox' ).removeAttr( 'accept' );
	$( '#infoOk, #infoFileLabel' ).removeClass( 'disabled' );
	$( '.extrabtn' ).remove();
	$( '#loader' ).addClass( 'hide' ); // for 'X' click
}

function info( O ) {
	infoReset();
	setTimeout( function() { // fix: wait for infoReset() on 2nd info
	///////////////////////////////////////////////////////////////////
	// simple use as info( 'message' )
	if ( typeof O !== 'object' ) {
		$( '#infoIcon' ).addClass( 'fa fa-info-circle' );
		$( '#infoTitle' ).text( 'Info' );
		$( '#infoX' ).addClass( 'hide' );
		$( '#infoMessage' ).html( O );
		$( '#infoMessage, #infoOk' ).removeClass( 'hide' );
		$( '#infoOverlay' ).removeClass( 'hide' );
		$( '#infoOk' ).html( 'OK' ).click( infoReset );
		alignVertical();
		return;
	}
	
	// title
	var width = 'width' in O ? O.width : '';
	if ( width ) {
		$( '#infoBox' ).css( 'width', width +'px' );
	}
	if ( 'icon' in O ) {
		if ( O.icon.charAt( 0 ) !== '<' ) {
			$( '#infoIcon' ).addClass( 'fa fa-'+ O.icon );
		} else {
			$( '#infoIcon' ).html( O.icon );
		}
	} else {
		$( '#infoIcon' ).addClass( 'fa fa-question-circle' );
	}
	var title = 'title' in O ? O.title : 'Information';
	$( '#infoTitle' ).html( title );
	if ( 'nox' in O ) $( '#infoX' ).addClass( 'hide' );
	if ( 'autoclose' in O ) {
		setTimeout( function() {
			$( '#infoCancel' ).click();
		}, O.autoclose );
	}
	
	// buttons
	if ( 'nobutton' in O === false ) {
		$( '#infoOk' )
			.html( 'oklabel' in O ? O.oklabel : 'OK' )
			.css( 'background-color', O.okcolor || '' )
			.removeClass( 'hide' );
			if ( typeof O.ok === 'function' ) $( '#infoOk' ).click( O.ok );
		if ( 'cancel' in O ) {
			$( '#infoCancel' )
				.html( 'cancellabel' in O ? O.cancellabel : 'Cancel' )
				.css( 'background', 'cancelcolor' in O ? O.cancelcolor : '' );
			if ( 'cancelbutton' in O || 'cancellabel' in O ) $( '#infoCancel' ).removeClass( 'hide' );
		}
		if ( 'button' in O ) {
			button = 'button' in O ? O.button : '';
			buttonlabel = 'buttonlabel' in O ? O.buttonlabel : '';
			buttoncolor = 'buttoncolor' in O ? O.buttoncolor : '';
			if ( typeof button !== 'object' ) button = [ button ];
			if ( typeof buttonlabel !== 'object' ) buttonlabel = [ buttonlabel ];
			if ( typeof buttoncolor !== 'object' ) buttoncolor = [ buttoncolor ];
			var iL = button.length;
			for ( i = 0; i < iL; i++ ) {
				var iid = i || '';
				$( '#infoOk' ).before(  '<a id="infoButton'+ iid +'" class="infobtn extrabtn infobtn-default">'+ buttonlabel[ i ] +'</a>' );
				$( '#infoButton'+ iid )
									.css( 'background-color', buttoncolor[ i ] || '' )
									.click( button[ i ] );
			}
		}
		$( '.infobtn' ).click( infoReset );
	}
	$( '#infoX, #infoCancel' ).click( function() {
		$( '#infoOverlay' ).addClass( 'hide' );
		if ( 'cancel' in O && typeof O.cancel === 'function' ) O.cancel();
	} );
	
	if ( 'content' in O ) {
		// custom html content
		$( '#infoContent' ).html( O.content );
	} else {
		// message
		var message = 'message' in O ? O.message : '';
		if ( message ) {
			$( '#infoMessage' )
				.html( message )
				.css( 'text-align', 'messagealign' in O ? O.messagealign : 'center' )
				.removeClass( 'hide' );
		}
		// inputs
		if ( 'textlabel' in O || 'textvalue' in O ) {
			textlabel = 'textlabel' in O ? O.textlabel : '';
			textvalue = 'textvalue' in O ? O.textvalue : '';
			if ( typeof textlabel !== 'object' ) textlabel = [ textlabel ];
			if ( typeof textvalue !== 'object' ) textvalue = [ textvalue ];
			var labelhtml = '';
			var boxhtml = '';
			var iL = textlabel.length > 1 ? textlabel.length : textvalue.length;
			for ( i = 0; i < iL; i++ ) {
				var iid = i || '';
				var labeltext = textlabel[ i ] || '';
				labelhtml += '<a class="infolabel">'+ labeltext +'</a>';
				var valuehtml = textvalue[ i ] !== '' ? ' value="'+ textvalue[ i ].toString().replace( /"/g, '&quot;' ) +'"' : '';
				boxhtml += '<input type="text" class="infoinput input" id="infoTextBox'+ iid +'"'+ valuehtml +' spellcheck="false">';
			}
			$( '#infotextlabel' ).html( labelhtml );
			$( '#infotextbox' ).html( boxhtml );
			var $infofocus = $( '#infoTextBox' );
			$( '#infoText' ).removeClass( 'hide' );
			if ( 'textalign' in O ) $( '.infoinput' ).css( 'text-align', O.textalign );
			if ( 'textrequired' in O ) {
				if ( typeof O.textrequired !== 'object' ) O.textrequired = [ O.textrequired ];
				O.textrequired.forEach( function( e ) {
					$( '.infoinput' ).eq( e ).addClass( 'required' );
				} );
				checkRequired();
				$( '.infoinput' ).on( 'input', checkRequired );
			}
		}
		if ( 'passwordlabel' in O ) {
			if ( typeof O.passwordlabel !== 'object' ) O.passwordlabel = [ O.passwordlabel ];
			var labelhtml = '';
			var boxhtml = '';
			var iL = O.passwordlabel.length;
			for ( i = 0; i < iL; i++ ) {
				var iid = i || '';
				var labeltext = O.passwordlabel[ i ] || '';
				labelhtml += '<a class="infolabel">'+ labeltext +'</a>';
				boxhtml += '<input type="password" class="infoinput" id="infoPasswordBox'+ iid +'"><i class="eye fa fa-eye fa-lg"></i><br>';
			}
			$( '#infotextlabel' ).append( labelhtml );
			$( '#infotextbox' ).append( boxhtml );
			$( '#infoText' ).removeClass( 'hide' );
			var $infofocus = $( '#infoPasswordBox' );
		}
		if ( 'fileoklabel' in O ) {
			$( '#infoOk' )
				.html( O.fileoklabel )
				.addClass( 'hide' );
			$( '#infoFileLabel' ).click( function() {
				$( '#infoFileBox' ).click();
			} );
			$( '#infoFile, #infoFileLabel' ).removeClass( 'hide' );
			if ( 'filetype' in O ) $( '#infoFileBox' ).attr( 'accept', O.filetype );
			$( '#infoFileBox' ).change( function() {
				var file = this.files[ 0 ];
				if ( !file ) return
				
				var filename = file.name;
				var ext = filename.split( '.' ).pop();
				if ( 'filetype' in O && O.filetype.indexOf( ext ) === -1 ) {
					info( {
						  icon    : 'warning'
						, title   : O.title
						, message : 'File extension must be: <code>'+ O.filetype +'</code>'
						, ok      : function() {
							info( {
								  title       : title
								, message     : message
								, fileoklabel : O.fileoklabel
								, filetype    : O.filetype
								, ok          : function() {
									info( O );
								}
							} );
						}
					} );
					return;
				}
				
				$( '#infoOk' ).removeClass( 'hide' );
				if ( 'fileokdisable' in O ) $( '#infoFileLabel' ).addClass( 'disabled' );
				$( '#infoFilename' ).html( '&ensp;'+ filename );
			} );
		}
		if ( 'checkbox' in O ) {
			if ( typeof O.checkbox !== 'object' ) {
				var html = O.checkbox;
			} else {
				var html = '';
				$.each( O.checkbox, function( key, val ) {
					html += '<label><input type="checkbox" value="'+ val.toString().replace( /"/g, '&quot;' ) +'">&ensp;'+ key +'</label><br>';
				} );
			}
			renderOption( $( '#infoCheckBox' ), html, 'checked' in O ? O.checked : '' );
		}
		if ( 'radio' in O ) {
			if ( typeof O.radio !== 'object' ) {
				var html = O.radio;
			} else {
				var html = '';
				$.each( O.radio, function( key, val ) {
					// <label> for clickable label
					html += '<label><input type="radio" name="inforadio" value="'+ val.toString().replace( /"/g, '&quot;' ) +'">&ensp;'+ key +'</label><br>';
				} );
			}
			renderOption( $( '#infoRadio' ), html, 'checked' in O ? O.checked : '' );
		}
		if ( 'select' in O ) {
			$( '#infoSelectLabel' ).html( 'selectlabel' in O ? O.selectlabel : '' );
			if ( typeof O.select !== 'object' ) {
				var html = O.select;
			} else {
				var html = '';
				$.each( O.select, function( key, val ) {
					html += '<option value="'+ val.toString().replace( /"/g, '&quot;' ) +'">'+ key +'</option>';
				} );
			}
			renderOption( $( '#infoSelectBox' ), html, 'checked' in O ? O.checked : '' );
			$( '#infoSelect, #infoSelectLabel, #infoSelectBox' ).removeClass( 'hide' );
		}
	}

	if ( 'preshow' in O ) O.preshow();
	$( '#infoOverlay' )
		.removeClass( 'hide' )
		.focus(); // enable e.which keypress (#infoOverlay needs tabindex="1")
	alignVertical();
	if ( $infofocus ) $infofocus.focus();
	if ( 'boxwidth' in O ) {
		var maxW = window.innerWidth * 0.98;
		var infoW = width || parseInt( $( '#infoBox' ).css( 'width' ) );
		var calcW = maxW < infoW ? maxW : infoW;
		var labelW = 0;
		$( '.infolabel' ).each( function() {
			var thisW = $( this ).width();
			if ( thisW > labelW ) labelW = thisW;
		} );
		var boxW = O.boxwidth !== 'max' ? O.boxwidth : calcW - 70 - labelW;
		$( '#infotextbox, .infoinput' ).css( 'width', boxW +'px' );
	}
	if ( 'buttonwidth' in O ) {
		var widest = 0;
		var w;
		$.each( $( '.infobtn' ), function() {
			w = $( this ).outerWidth();
			if ( w > widest ) widest = w;
		} );
		$( '.infobtn' ).css( 'min-width', widest +'px' );
	}
	/////////////////////////////////////////////////////////////////////////////
	}, 0 );
}

function alignVertical() { // make infoBox scrollable
	var boxH = $( '#infoBox' ).height();
	var wH = window.innerHeight;
	var top = boxH < wH ? ( wH - boxH ) / 2 : 20;
	$( '#infoBox' ).css( 'margin-top', top +'px' );
}
function checkRequired() {
	var $empty = $( '.infoinput.required' ).filter( function() {
		return !$( this ).val();
	} );
	$( '#infoOk' ).toggleClass( 'disabled', $empty.length > 0 );
}
function renderOption( $el, htm, chk ) {
	$el.html( htm ).removeClass( 'hide' );
	if ( $el.prop( 'id' ) === 'infoCheckBox' ) { // by index
		if ( !chk ) return;
		
		var checked = typeof chk === 'object' ? chk : [ chk ];
		checked.forEach( function( val ) {
			$el.find( 'input' ).eq( val ).prop( 'checked', true );
		} );
	} else {                                    // by value
		var opt = $el.prop( 'id' ) === 'infoSelectBox' ? 'option' : 'input';
		if ( chk === '' ) { // undefined
			$el.find( opt ).eq( 0 ).prop( 'checked', true );
		} else {
			$el.find( opt +'[value="'+ chk +'"]' ).prop( opt === 'option' ? 'selected' : 'checked', true );
		}
	}
}
function verifyPassword( title, pwd, fn ) {
	info( {
		  title         : title
		, message       : 'Please retype'
		, passwordlabel : 'Password'
		, ok            : function() {
			if ( $( '#infoPasswordBox' ).val() === pwd ) {
				fn();
				return;
			}
			
			info( {
				  title   : title
				, message : 'Passwords not matched. Please try again.'
				, ok      : function() {
					verifyPassword( title, pwd, fn )
				}
			} );
		}
	} );
}
function blankPassword( title, message, label, fn ) {
	info( {
		  title   : title
		, message : 'Blank password not allowed.'
		, ok      : function() {
			info( {
				  title         : title
				, message       : message
				, passwordlabel : 'Password'
				, ok            : function() {
					var pwd = $( '#infoPasswordBox' ).val();
					if ( !pwd ) {
						blankPassword( title, message, label, fn );
					} else {
						verifyPassword( title, pwd, fn )
					}
				}
			} );
		}
	} );
}
