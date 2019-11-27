<?php
$sudo = '/usr/bin/sudo /usr/bin';
$audiooutput = trim( @file_get_contents( '/srv/http/data/system/audio-output' ) );
$audioaplayname = trim( @file_get_contents( '/srv/http/data/system/audio-aplayname' ) );
$usbdac = trim( @file_get_contents( '/srv/http/data/system/usbdac' ) );
$dop = file_exists( '/srv/http/data/system/dop' ) ? 'checked' : '';
$autoplay = file_exists( '/srv/http/data/system/autoplay' ) ? 'checked' : '';
$model = exec( 'cat /proc/cpuinfo | grep Revision | tail -c 4 | cut -c 1-2' );
if ( $model === '11' ) {  // RPi4
    exec( "$sudo/aplay -l | grep '^card'", $lines );
} else if ( $model === '09' || $model === '0c' ) {  //RPi Zero
    exec( "$sudo/aplay -l | grep '^card' | grep -v 'IEC958/HDMI1\|bcm2835 ALSA\]$'", $lines );
} else {
    exec( "$sudo/aplay -l | grep '^card' | grep -v 'IEC958/HDMI1'", $lines );
}
$htmlacards = '';
if ( count( $lines ) === 1 ) {
    $htmlacards.= '<option value="'.$audioaplayname.'" data-index="0">'.$audiooutput.'</option>';
} else {
    foreach( $lines as $line ) {
        $selected = '';
        $device = preg_replace( '/card (.*):.*device (.*):.*/', 'hw:$1,$2', $line );
        $index = substr( $device, -1 ) + 1;
        $aplayname = preg_replace( '/.*\[(.*)\],.*/', '$1', $line );
        $aplaynameL = count( preg_grep( "/$aplayname/", $lines ) );
        if ( $aplaynameL > 1 ) $aplayname.= '-'.$index;
        $routecmd = exec( "$sudo/grep route_cmd \"/srv/http/settings/i2s/$aplayname\" | cut -d: -f2" ) ?: '';
        $dataroutecmd = $routecmd ? ' data-routecmd="'.str_replace( '*CARDID*', $index, $routecmd ).'"' : '';
        $extlabel = exec( "$sudo/grep extlabel \"/srv/http/settings/i2s/$aplayname\" | cut -d: -f2" ) ?: $aplayname;
        if ( $usbdac ) {
            if ( $aplayname === $usbdac ) $selected = ' selected';
        } else if ( $aplayname === $audioaplayname ) {
            $selected = ' selected';
            $extlabel = $audiooutput;
        }
        $htmlacards.= '<option value="'.$aplayname.'" data-index="'.$index.'"'.$dataroutecmd.$selected.'>'.$extlabel."</option>";
    }
}

$mixertype = exec( "$sudo/grep mixer_type /etc/mpd.conf | cut -d'\"' -f2" );
$crossfade = exec( "$sudo/mpc crossfade | cut -d' ' -f2" );
$normalization = exec( "$sudo/grep 'volume_normalization' /etc/mpd.conf | cut -d'\"' -f2" );
$replaygain = exec( "$sudo/grep 'replaygain' /etc/mpd.conf | cut -d'\"' -f2" );
$novolume = ( $mixertype !== 'none' || $crossfade || $normalization !== 'no' || $replaygain !== 'off' ) ? 0 : 1;
$autoupdate = exec( "$sudo/grep 'auto_update' /etc/mpd.conf | cut -d'\"' -f2" );
$buffer = exec( "$sudo/grep 'audio_buffer_size' /etc/mpd.conf | cut -d'\"' -f2" );
if ( file_exists( '/usr/bin/ffmpeg' ) ) $ffmpeg = exec( "$sudo/sed -n '/ffmpeg/ {n;p}' /etc/mpd.conf | cut -d'\"' -f2" ) === 'yes' ? 'checked' : '';
?>
<input id="usbdac" type="hidden" value="<?=$usbdac?>">
<div class="container">
    <heading>Audio Output</heading>
        <div class="col-l control-label">Inferface</div>
        <div class="col-r">
            <select id="audiooutput" data-mixertype="<?=$mixertype?>" data-style="btn-default btn-lg">
                <?=$htmlacards?>
            </select>
            <i id="setting-audiooutput" class="settingedit fa fa-gear"></i>
            <span class="help-block hide">Volume level control, hardware or software, was set by its driver unless manually set by users.
                <br>Disable to get the best sound quality. DAC hardware volume will be reset to 0dB.
                <br>DAC hardware volume is good and convenient.
                <br>Software volume depends on users preferences.</span>
        </div>
    <heading>Bit-perfect</heading>
<?php if ( in_array( $hardwarecode, [ '04', '08', '0e', '0d', '11' ] ) ) { ?>
        <div class="col-l">DSD over PCM</div>
        <div class="col-r">
            <input id="dop" type="checkbox" <?=$dop?>>
            <div class="switchlabel" for="dop"></div>
            <span class="help-block hide">For DSD-capable devices without drivers dedicated for native DSD. Enable if there's no sound from the DAC.
                <br>DoP will repack 16bit DSD stream into 24bit PCM frames and transmit to the DAC. 
                Then PCM frames will be reassembled back to original DSD stream, COMPLETELY UNCHANGED, with expense of double bandwith.
                <br>On-board audio and non-DSD devices will always get DSD converted to PCM stream, no bit-perfect</span>
        </div>
<?php } ?>
        <div class="col-l">No volume</div>
        <div class="col-r">
            <input id="novolume" type="checkbox" data-val="<?=$novolume?>" <?=( $novolume ? 'checked' : '' )?>>
            <div class="switchlabel" for="novolume"></div>
            <span class="help-block hide">Disable all software volume manipulations for bit-perfect stream from MPD to DAC and reset DAC hardware volume to 0dB to preserve full amplitude stream.</span>
        </div>
    <div id="volume" class="form-horizontal <?=( $novolume ? 'hide' : '' )?>">
        <heading>Volume</heading>
            <div class="col-l">Crossfade</div>
            <div class="col-r">
                <input id="crossfade" class="switch" type="checkbox" value="<?=$crossfade?>" <?=( $crossfade ? 'checked' : '' )?>>
                <div class="switchlabel" for="crossfade"></div>
                <i id="setting-crossfade" class="setting fa fa-gear <?=( $crossfade ? '' : 'hide' )?>"></i>
                <span class="help-block hide">Fade-out to fade-in between songs.</span>
            </div>
            <div class="col-l">Normalization</div>
            <div class="col-r">
                <input id="normalization" type="checkbox" value="<?=$normalization?>" <?=( $normalization === 'no' ? '' : 'checked' )?>>
                <div class="switchlabel" for="normalization"></div>
                <span class="help-block hide">Normalize the volume level of songs as they play.</span>
            </div>
            <div class="col-l">Replay gain</div>
            <div class="col-r">
                <input id="replaygain" type="checkbox" value="<?=$replaygain?>" <?=( $replaygain === 'off' ? '' : 'checked' )?>>
                <div class="switchlabel" for="replaygain"></div>
                <i id="setting-replaygain" class="setting fa fa-gear <?=( $replaygain === 'off' ? 'hide' : '' )?>"></i>
                <span class="help-block hide">Set gain control to setting in replaygain tag. Currently only FLAC, Ogg Vorbis, Musepack, and MP3 (through ID3v2 ReplayGain tags, not APEv2) are supported.</span>
            </div>
    </div>
    <heading>Options</heading>
        <div class="col-l">Auto update</div>
        <div class="col-r">
            <input id="autoupdate" type="checkbox" <?=$autoupdate?>>
            <div class="switchlabel" for="autoupdate"></div>
            <span class="help-block hide">Automatic update MPD database when files changed.</span>
        </div>
        <div class="col-l">Custom buffer</div>
        <div class="col-r">
            <input id="buffer" type="checkbox" data-buffer="<?=$buffer?>" <?=( $buffer === '4096' ? '' : 'checked' )?>>
            <div class="switchlabel" for="buffer"></div>
            <i id="setting-buffer" class="setting fa fa-gear <?=( $buffer === '4096' ? 'hide' : '' )?>"></i>
            <span class="help-block hide">Default buffer size: 4096KB (24 seconds of CD-quality audio)</span>
        </div>
<?php if ( isset( $ffmpeg ) ) { ?>
        <div class="col-l">FFmpeg</div>
        <div class="col-r">
            <input id="ffmpeg" type="checkbox" <?=$ffmpeg?>>
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
        <div class="col-l">Play on startup</div>
        <div class="col-r">
            <input id="autoplay" type="checkbox" <?=$autoplay?>>
            <div class="switchlabel" for="autoplay"></div>
            <span class="help-block hide">Start playing automatically after boot.</span>
        </div>
    <div style="clear: both"></div>
</div>
