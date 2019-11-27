I2S Setting
---

System > I2S module:
- `/srv/http/settings/mpd.php`
	- get list with `mpc outputs`
	- convert `output` to `sysname` (e.g., `snd_rpi_rpi_dac` to `rpi-dac`)
	- if converted `output` === `/srv/http/data/system/audio-aplayname`
		- set `name` to `/srv/http/data/system/audio-output`
		- set as `selected`
	- get `name` from `/srv/http/settings/i2s/<output>`
	- populate select list 

Set:
- `/srv/http/assets/js/system.js`
  - save `name` to `/srv/http/data/system/audio-output`
  - save `sysname` to `/srv/http/data/system/audio-aplayname`

Boot:
- `/srv/http/settings/mpd-conf.sh`
  - clear `audio_output`
  - get `mixer_type` from `/etc/mpd.conf`
  - if `mixer_type` = `none`, set mixers of each card to 0dB with `amixer`
  - get `aplayname` list with `aplay -l`
  - each card:
    - if subdevices, append index
    - get from `/srv/http/settings/i2s/<aplayname>`
      - `aplayname`
      - card index
      - `mixer_control` for each card
      - if `routecmd` exists, route to subdevice
      - `extlabel` for USB DAC notify change
    - re-populate `audio_output`
