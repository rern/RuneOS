<headingnoline>USB and NAS&emsp;<i id="addnas" class="fa fa-plus-circle"></i>&emsp;<i id="refreshing" class="fa fa-network blink hide"></i></headingnoline>
<ul id="list" class="entries" data-uid="<?=( exec( "$sudo/id -u mpd" ) )?>" data-gid="<?=( exec( "$sudo/id -g mpd" ) )?>"></ul>
<p class="brhalf"></p>
<span class="help-block hide">
	Available sources, local USB and NAS mounts, for Library.
	<br>USB drive will be found and mounted automatically. Network shares must be manually configured.
</span>

<heading id="mount" class="status">Mounts&emsp;<i class="fa fa-code"></i></heading>
<span class="help-block hide"><code>mount | grep MPD</code></span>
<pre id="codemount" class="hide"></pre>

<headingnoline>Network Shares&emsp;<i id="refreshshares" class="fa fa-refresh hide"></i></headingnoline>
<ul id="listshare" class="entries">
	<li><i class="fa fa-search"></i><gr>Scan</gr></li>
</ul>
<p class="brhalf"></p>
<span class="help-block hide">
	Available Windows and CIFS shares in WORKGROUP. Scan and select a share to mount as Library source files.
</span>

<heading id="fstab" class="status">File System Table&emsp;<i class="fa fa-code"></i></heading>
<span class="help-block hide"><code>cat /etc/fstab</code></span>
<pre id="codefstab" class="hide"></pre>

<div style="clear: both"></div>
