<div id="divinterface">
	<headingnoline>Interfaces&emsp;<i id="refreshing" class="fa fa-wifi-3 blink hide"></i></headingnoline>
	<ul id="listinterfaces" class="entries"></ul>
	<span class="help-block hide">For better performance, use LAN if available.<br><br></span>

	<div id="divwebui" class="hide">
		<div class="col-l">Web UI</div>
		<div class="col-r">
			<gr>http://</gr><span id="ipwebui"></span><br>
			<div class="divqr">
				<div id="qrwebui" class="qr"></div>
			</div>
			<span class="help-block hide">Scan QR code or use IP address to connect RuneAudio web user interface.</span>
		</div>
	</div>

	<heading id="ifconfig" class="status">Status&emsp;<i class="fa fa-code"></i></heading>
	<span class="help-block hide"><code>ip a</code></span>
	<pre id="codeifconfig" class="hide"></pre>
</div>

<div id="divwifi" class="hide">
	<headingnoline>Wi-Fi&emsp;
		<i id="add" class="fa fa-plus-circle"></i>&ensp;<i id="scanning" class="fa fa-wifi-3 blink"></i>
		<i id="back" class="fa fa-arrow-left"></i>
	</headingnoline>
	<ul id="listwifi" class="entries"></ul>
	<span class="help-block hide">Access points with less than -66dBm should not be used.</span>
	
	<heading id="netctl" class="status">Saved Profiles&emsp;<i class="fa fa-code"></i></heading>
	<span class="help-block hide"><code>netctl list</code></span>
	<pre id="codenetctl" class="hide"></pre>
</div>

	<?php if ( file_exists( '/usr/bin/hostapd' ) ) { ?>
<div id="divaccesspoint">
	<heading>RPi Access Point</heading>
	<div class="col-l">Enable</div>
	<div class="col-r">
		<input id="accesspoint" type="checkbox">
		<div class="switchlabel" for="accesspoint"></div>
		<i id="settings-accesspoint" class="setting fa fa-gear"></i>
		<span class="help-block hide">Connect with RPi Wi-Fi directly when no routers available.
			<br>RPi access point should be used only when necessary.</span>
	</div>
	<p class="brhalf"></p>
	<div id="boxqr" class="hide">
		<div class="col-l">Credential</div>
		<div class="col-r">
			<gr>SSID:</gr> <span id="ssid"></span><br>
			<gr>Password:</gr> <span id="passphrase"></span>
			<div class="divqr">
				<div id="qraccesspoint" class="qr"></div>
			</div>
			<span class="help-block hide">Scan QR code or find the SSID and use the password to connect remote devices with RPi access point.</span>
		</div>
		<div class="col-l">Web UI</div>
		<div class="col-r">
			<gr>http://</gr><span id="ipwebuiap"></span>
			<div class="divqr">
				<div id="qrwebuiap" class="qr"></div>
			</div>
			<span class="help-block hide">Scan QR code or use the IP address to connect RuneAudio web user interface with any browsers from remote devices.</span>
		</div>
	</div>
</div>
	<?php } ?>

<div style="clear: both"></div>
