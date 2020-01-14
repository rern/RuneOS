<div class="container">
	<headingnoline>USB and NAS&emsp;<i id="addnas" class="fa fa-plus-circle"></i>&emsp;<i id="refreshing" class="fa fa-network blink hide"></i></headingnoline>
	<ul id="list" class="entries" data-uid="<?=( exec( "$sudo/id -u mpd" ) )?>" data-gid="<?=( exec( "$sudo/id -g mpd" ) )?>"></ul>
	<p class="brhalf"></p>
	<span class="help-block hide">
		Available sources, local USB and NAS mounts, for Library.
		<br>USB drive will be found and mounted automatically. Network shares must be manually configured.
	</span>
	<headingnoline>Network shares</headingnoline>
	<ul id="listshare" class="entries">
		<li><i class="fa fa-search"></i><grl>Tap to start scanning.</grl></li>
	</ul>
	<p class="brhalf"></p>
	<span class="help-block hide">
		Available Windows and CIFS shares in WORKGROUP. Scan and select a share to mount as Library source files.
	</span>
	<div style="clear: both"></div>
</div>
