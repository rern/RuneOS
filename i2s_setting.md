I2S Setting
---

Set:
- `System` > `I2S module`
- `/srv/http/assets/js/system.js`
  - save `name` to `/srv/http/data/system/audio-output`
  - save `sysname` to `/srv/http/data/system/audio-aplayname`

Boot:
- `/srv/http/settings/mpd-conf.sh`
  - clear `audio_output`
  - get `mixer_type` from `/etc/mpd.conf`
  - if `mixer_type` = `none`, set mixers of each card to 0dB with `amixer`
  - get card list with `aplay -l`
  - each card:
    - if subdevices, append index
    - get
      - `aplayname`
      - card index
      - `mixer_control` for each card
      - if `routecmd` exists, route to subdevice
      - `extlabel` for USB DAC notify change
    - re-populate `audio_output`
    
    - convert `aplayname` to `sysname` (e.g., `snd_rpi_rpi_dac` to `rpi-dac`)
  - 
