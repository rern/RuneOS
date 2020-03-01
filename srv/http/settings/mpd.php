<heading>Audio Output</heading>
<div class="col-l control-label">Device</div>
<div class="col-r">
	<select id="audiooutput" data-style="btn-default btn-lg"></select>
	<i id="setting-audiooutput" class="settingedit fa fa-gear hwmixer"></i><br>
	<span class="hwmixer"><span class="help-block hide"><i class="fa fa-gear"></i>&ensp;Select manually only if the current one is not working.</span></span>
</div>
<div class="col-l control-label">Volume Control</div>
<div class="col-r">
	<select id="mixertype" data-style="btn-default btn-lg">
		<option value="none">Disable</option>
		<option value="hardware">DAC hardware</option>
		<option value="software">MPD software</option>
	</select>
	<span class="help-block hide">Set Volume level control for all devices.
		<br>Disable: best sound quality. DAC hardware volume will be reset to 0dB.
		<br>DAC hardware: good and convenient.
		<br>MPD software: depends on users preferences.
	</span>
</div>
<div class="col-l control-label">Hardware</div>
<div class="col-r"><i id="aplay" class="fa fa-code code"></i>
	<span class="help-block hide"><code>aplay -l; amixer</code></span>
</div>
<pre id="codeaplay" class="hide"></pre>

<div style="clear: both;"></div>
	
<heading>Bit-Perfect</heading>
	<?php 
		  $hwcode = exec( "$sudo/cat /proc/cpuinfo | grep Revision | tail -c 4 | cut -c 1-2" );
		  if ( in_array( $hwcode, [ '04', '08', '0e', '0d', '11' ] ) ) { ?>
<div class="col-l">DSD over PCM</div>
<div class="col-r">
	<input id="dop" type="checkbox">
	<div class="switchlabel" for="dop"></div>
	<span class="help-block hide">For DSD-capable devices without drivers dedicated for native DSD. Enable if there's no sound from the DAC.
		<br>DoP will repack 16bit DSD stream into 24bit PCM frames and transmit to the DAC. 
		Then PCM frames will be reassembled back to original DSD stream, COMPLETELY UNCHANGED, with expense of double bandwith.
		<br>On-board audio and non-DSD devices will always get DSD converted to PCM stream, no bit-perfect</span>
</div>
	<?php } ?>
<div class="col-l">No Volume</div>
<div class="col-r">
	<input id="novolume" type="checkbox">
	<div class="switchlabel" for="novolume"></div>
	<span class="help-block hide">Disable all software volume manipulations for bit-perfect stream from MPD to DAC and reset DAC hardware volume to 0dB to preserve full amplitude stream.</span>
</div>

<heading>Volume</heading>
<div class="col-l">Crossfade</div>
<div class="col-r">
	<input id="crossfade" class="switch" type="checkbox">
	<div class="switchlabel" for="crossfade"></div>
	<i id="setting-crossfade" class="setting fa fa-gear"></i>
	<span class="help-block hide">Fade-out to fade-in between songs.</span>
</div>
<div class="col-l">Normalization</div>
<div class="col-r">
	<input id="normalization" type="checkbox">
	<div class="switchlabel" for="normalization"></div>
	<span class="help-block hide">Normalize the volume level of songs as they play.</span>
</div>
<div class="col-l">Replay Gain</div>
<div class="col-r">
	<input id="replaygain" type="checkbox">
	<div class="switchlabel" for="replaygain"></div>
	<i id="setting-replaygain" class="setting fa fa-gear"></i>
	<span class="help-block hide">Set gain control to setting in replaygain tag. Currently only FLAC, Ogg Vorbis, Musepack, and MP3 (through ID3v2 ReplayGain tags, not APEv2) are supported.</span>
</div>

<heading>Options</heading>
<div class="col-l">Auto Update</div>
<div class="col-r">
	<input id="autoupdate" type="checkbox">
	<div class="switchlabel" for="autoupdate"></div>
	<span class="help-block hide">Automatic update MPD database when files changed.</span>
</div>
<div class="col-l">Custom Buffer</div>
<div class="col-r">
	<input id="buffer" type="checkbox">
	<div class="switchlabel" for="buffer"></div>
	<i id="setting-buffer" class="setting fa fa-gear"></i>
	<span class="help-block hide">Default buffer size: 4096KB (24 seconds of CD-quality audio)</span>
</div>
	<?php if ( file_exists( '/usr/bin/ffmpeg' ) ) { ?>
<div class="col-l">FFmpeg Decoder</div>
<div class="col-r">
	<input id="ffmpeg" type="checkbox">
	<div class="switchlabel" for="ffmpeg"></div>
	<span class="help-block hide">Should be disabled if not used for faster Sources update.
		<br>Decoder for audio filetypes:
		<br>16sv 3g2 3gp 4xm 8svx aa3 aac ac3 adx afc aif aifc aiff al alaw amr anim apc ape asf atrac au aud avi avm2 avs 
		bap bfi c93 cak cin cmv cpk daud dct divx dts dv dvd dxa eac3 film flac flc fli fll flx flv g726 gsm gxf iss 
		m1v m2v m2t m2ts m4a m4b m4v mad mj2 mjpeg mjpg mka mkv mlp mm mmf mov mp+ mp1 mp2 mp3 mp4 mpc mpeg mpg mpga mpp mpu mve mvi mxf 
		nc nsv nut nuv oga ogm ogv ogx oma ogg omg opus psp pva qcp qt r3d ra ram rl2 rm rmvb roq rpl rvc shn smk snd sol son spx str swf 
		tak tgi tgq tgv thp ts tsp tta xa xvid uv uv2 vb vid vob voc vp6 vmd wav webm wma wmv wsaud wsvga wv wve 
	</span>
</div>
	<?php } ?>
<div class="col-l">Play on Startup</div>
<div class="col-r">
	<input id="autoplay" type="checkbox">
	<div class="switchlabel" for="autoplay"></div>
	<span class="help-block hide">Start playing automatically after boot.</span>
</div>

<heading id="status" class="status">Status&emsp;<i class="fa fa-code"></i>&emsp;<i id="restart" class="fa fa-gear"></i></heading>
<span class="help-block hide"><code>systemctl status mpd mpdidle</code></span>
<pre id="codestatus" class="hide"></pre>

<heading id="mpdconf" class="status">Configuration&emsp;<i class="fa fa-code"></i></heading>
<span class="help-block hide"><code>cat /etc/mpd.conf</code></span>
<pre id="codempdconf" class="hide"></pre>

<div style="clear: both"></div>
