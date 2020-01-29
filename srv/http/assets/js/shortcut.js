// keyboard controls
$( document ).keydown( function( e ) {
	if ( !$( '#infoOverlay' ).hasClass( 'hide' ) || infoactive ) return
	
	var key = e.key;

	if ( [ 'ArrowUp', 'ArrowDown' ].indexOf( key ) !== -1 ) e.preventDefault();
	
	if ( !$( '#settings' ).hasClass( 'hide' ) && key === 'Enter' ) {
		var $menu = $( '#settings' ).find( 'a.active' );
		if ( !$menu.length ) $menu = $( '#settings' ).find( '.submenu.active' );
		var href = $menu.prop( 'href' );
		href ? location.href = href : $menu.click();
		return
	}
	
	if ( key === 'Escape' ) {
		$( '.menu' ).addClass( 'hide' );
		if ( typeof colorpicker !== 'undefined' ) $( '#colorcancel' ).click();
		return
	}
	
	if ( $( '#infoOverlay' ).css( 'display' ) === 'block' || !$( '#divcolorpicker' ).hasClass( 'hide' ) ) return
		
	var keyevent = {
		  AudioVolumeDown    : 'voldn'
		, AudioVolumeMute    : 'volmute'
		, AudioVolumeUp      : 'volup'
		, MediaNextTrack     : 'next'
		, MediaPause         : 'pause'
		, MediaPlay          : 'play'
		, MediaPlayPause     : 'play'
		, MediaPreviousTrack : 'previous'
		, MediaStop          : 'stop'
		, MediaTrackPrevious : 'previous'
		, MediaTrackNext     : 'next'
	}
	if ( key === ' ' && e.target.localName !== 'input' ) {
		$( '#play' ).click();
		e.preventDefault();
	} else if ( key === 'Tab' ) {
		e.preventDefault();
		if ( GUI.library ) {
			$( '#tab-playback' ).click();
		} else if ( GUI.playback ) {
			$( '#tab-playlist' ).click();
		} else {
			$( '#tab-library' ).click();
		}
	} else {
		$( '#'+ keyevent[ key ] ).click();
	}
	if ( key === ' ' || key === 'Tab' || key.slice( 5 ) === 'Media' ) return
	
	// context menu
	var $contextmenu = $( '.contextmenu:not( .hide )' );
	if ( !$contextmenu.length ) $contextmenu = $( '#settings:not( .hide )' );
	if ( $contextmenu.length ) {
		if ( GUI.library ) {
			var $liactive = $( '#db-entries li.active' );
		} else if ( GUI.playlist ) {
			if ( !GUI.pleditor ) {
				var $liactive = $( '#pl-entries li.updn' );
				if ( !$liactive.length ) $liactive = $( '#pl-entries li.active' );
			} else {
				var $liactive = $( '#pl-editor li.active' );
			}
		}
		var $menu = $contextmenu.find( 'a.active' );
		var $menuactive = $menu.length ? $menu : $contextmenu.find( '.submenu.active' ).parent();
		var $menufirst = $contextmenu.find( 'a:not( .hide )' ).first();
		var $menulast = $contextmenu.find( 'a:not( .hide )' ).last();
		if ( key === 'ArrowLeft' ) {
			$( '.menu' ).addClass( 'hide' )
			$menuactive.removeClass( 'active' );
			$( '.submenu' ).removeClass( 'active' );
		} else if ( key === 'ArrowRight' ) {
			var $submenu = $menuactive.find( '.submenu' );
			if ( $submenu.length ) {
				$menuactive.removeClass( 'active' );
				$submenu.addClass( 'active' );
			}
		} else if ( key === 'ArrowUp' || key === 'ArrowDown' ) {
			if ( !$menuactive.length ) {
				$menufirst.addClass( 'active' );
			} else {
				$menuactive.removeClass( 'active' );
				$( '.submenu' ).removeClass( 'active' );
				if ( key === 'ArrowDown' ) {
					if ( $menuactive.is( $menulast ) ) {
						$menufirst.addClass( 'active' );
					} else {
						$menuactive.nextAll( 'a' ).not( '.hide' ).first().addClass( 'active' );
					}
				} else {
					if ( $menuactive.is( $menufirst ) ) {
						$menulast.addClass( 'active' );
					} else {
						$menuactive.prevAll( 'a' ).not( '.hide' ).first().addClass( 'active' );
					}
				}
			}
		} else if ( key === 'Enter' ) {
			$contextmenu.find( 'a.active' ).click();
			$contextmenu.find( '.submenu.active' ).click();
		}
		return
	}
	
	if ( GUI.playback ) {
		if ( key === 'ArrowLeft' ) {
			$( '#previous' ).click();
		} else if ( key === 'ArrowRight' ) {
			$( '#next' ).click();
		} else if ( key === 'ArrowUp' ) {
			$( '#volup' ).click();
		} else if ( key === 'ArrowDown' ) {
			$( '#voldn' ).click();
		}
	} else if ( GUI.library ) {
		if ( !$( '#db-search' ).hasClass( 'hide' ) ) return
		
		// home /////////////////////////////////////////
		if ( !$( '#home-blocks' ).hasClass( 'hide' ) ) {
			var $blupdn = $( '.divblock.updn' );
			if ( !$blupdn.length ) {
				$( '.divblock:not( .hide ):eq( 0 )' ).addClass( 'updn' );
				return
			}
			
			if ( key === 'ArrowLeft' ) {
				var $div = $( '.divblock.updn' ).prevAll( ':not( .hide )' ).first();
				$( '.divblock' ).removeClass( 'updn' );
				if ( !$div.length ) $div = $( '.divblock:not( .hide )' ).last();
				$div.addClass( 'updn' );
			} else if ( key === 'ArrowRight' ) {
				var $div = $( '.divblock.updn' ).nextAll( ':not( .hide )' ).first().addClass( 'updn' );
				$( '.divblock' ).removeClass( 'updn' );
				if ( !$div.length ) $div = $( '.divblock:not( .hide )' ).first();
				$div.addClass( 'updn' );
			} else if ( key === 'Enter' ) {
				$( '.divblock.updn .home-block' ).tap();
			}
			return
		}
		
		// back button //////////////////////////////////
		if ( key === 'ArrowLeft' ) {
			$( '#db-back' ).click();
			return
		} else if ( key === 'ArrowRight' ) {
			$( '#db-entries li.active .db-icon' ).tap();
			return
		}
		
		// list ///////////////////////////////////////
		var $liactive = $( '#db-entries li.active' );
		if ( !$liactive.length ) {
			$( '#db-entries li:eq( 0 )' ).addClass( 'active' );
			setTimeout( function() {
				$( 'html, body' ).scrollTop( 0 );
			}, 300 );
			return
		}
		
		$( '#db-entries li' ).removeClass( 'active' );
		if ( key === 'ArrowUp' ) {
			var $icon = $liactive.prev().find( '.db-icon' );
			if ( !$icon.length ) $icon = $( '#db-entries .db-icon' ).last();
			$icon.tap();
		} else if ( key === 'ArrowDown' ) {
			var $icon = $liactive.next().find( '.db-icon' );
			if ( !$icon.length ) {
				$icon = $( '#db-entries .db-icon:eq( 0 )' );
				setTimeout( function() {
					$( 'html, body' ).scrollTop( 0 );
				}, 300 );
			}
			$icon.tap();
		} else if ( key === 'Enter' ) {
			if ( $( '.licover' ).length || $( '#db-entries li.db-webradio' ).length ) {
				var menu = $liactive.find( '.db-icon' ).data( 'target' );
				$( menu ).find( 'a:eq( 1 )' ).click();
			} else {
				$liactive.tap();
			}
		}
		$( '.contextmenu' ).addClass( 'hide' );
	} else if ( GUI.playlist ) {
		if ( !GUI.pleditor ) {
			var $liupdn = $( '#pl-entries li.updn' );
			if ( !$liupdn.length ) $liupdn = $( '#pl-entries li.active' );
			if ( key === 'ArrowUp' ) {
				var $li = $liupdn.prev( 'li' );
				$( '#pl-entries li' ).removeClass( 'updn' );
				if ( !$li.length ) $li = $( '#pl-entries li' ).last();
				$li.addClass( 'updn' );
			} else if ( key === 'ArrowDown' ) {
				var $li = $liupdn.next( 'li' );
				$( '#pl-entries li' ).removeClass( 'updn' );
				if ( !$li.length ) {
					$li = $( '#pl-entries li' ).first();
					setTimeout( function() {
						$( 'html, body' ).scrollTop( 0 );
					}, 300 );
				}
				$li.addClass( 'updn' );
			} else if ( key === 'ArrowRight' ) {
				$( '#pl-entries li.active' ).find( '.pl-icon' ).click();
				$( '#pl-entries li.updn' ).find( '.pl-icon' ).click();
			} else if ( key === 'Enter' ) {
				$( '#pl-entries li.updn' )
					.click()
					.removeClass( 'updn' );
			}
			return
		}
		// back button //////////////////////////////////////
		if ( key === 'ArrowLeft' ) {
			$( '.plsbackroot, .plsback' ).click();
			return
		} else if ( key === 'ArrowRight' ) {
			$( '#pl-editor li.active i' ).click();
			return
		}
		
		// saved playlist //////////////////////////////////
		var $liactive = $( '#pl-editor li.active' );
		if ( !$liactive.length ) {
			$( '#pl-editor li:eq( 0 )' ).addClass( 'active' );
			setTimeout( function() {
				$( 'html, body' ).scrollTop( 0 );
			}, 300 );
			return
		}
		
		if ( key === 'ArrowUp' ) {
			var $icon = $liactive.prev().find( 'i' );
			if ( !$icon.length ) $icon = $( '#pl-editor i' ).last();
			$icon.click();
		} else if ( key === 'ArrowDown' ) {
			var $icon = $liactive.next().find( 'i' );
			if ( !$icon.length ) {
				$icon = $( '#pl-editor i:eq( 0 )' );
				setTimeout( function() {
					$( 'html, body' ).scrollTop( 0 );
				}, 300 );
			}
			$icon.click();
		} else if ( key === 'Enter' ) {
			if ( !$( '#pl-editor li.pl-folder' ).length ) {
				var menu = $liactive.find( 'i' ).data( 'target' );
				$( menu ).find( 'a:eq( 1 )' ).click();
			} else {
				$liactive.click();
			}
		}
		$( '.contextmenu' ).addClass( 'hide' );
	}
} );
