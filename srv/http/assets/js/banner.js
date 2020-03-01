$( 'body' ).prepend(
'<div id="banner" class="hide">\
	<div id="bannerTitle"></div>\
	<div id="bannerMessage"></div>\
</div>'
);
$( '#banner' ).click( bannerHide );
function bannerHide() {
	$( '#banner' )
		.addClass( 'hide' )
		.removeAttr( 'style' );
	$( '#bannerTitle, #bannerMessage' ).empty();
}
function notify( title, message, icon, delay ) {
	var iconhtml = icon ? '<i class="fa fa-'+ ( icon || 'check' ) +'"></i>' : '';
	$( '#bannerTitle' ).html( iconhtml + ( title || '' ) );
	$( '#bannerMessage' ).html( message );
	$( '#banner' ).removeClass( 'hide' );
	if ( delay !== -1 ) setTimeout( bannerHide, delay || 3000 );
}
