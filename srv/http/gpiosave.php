<?php
$gpio = [
	 'name'   => [
		  $_POST[ 'pin1' ] => $_POST[ 'name1' ]
		, $_POST[ 'pin2' ] => $_POST[ 'name2' ]
		, $_POST[ 'pin3' ] => $_POST[ 'name3' ]
		, $_POST[ 'pin4' ] => $_POST[ 'name4' ]
	]
	, 'on'    => [
		  'on1'    => $_POST[ 'on1' ]
		, 'ond1'   => $_POST[ 'ond1' ] ?: 0
		, 'on2'    => $_POST[ 'on2' ]
		, 'ond2'   => $_POST[ 'ond2' ] ?: 0
		, 'on3'    => $_POST[ 'on3' ]
		, 'ond3'   => $_POST[ 'ond3' ] ?: 0
		, 'on4'    => $_POST[ 'on4' ]
	]
	, 'off'   => [
		  'off1'   => $_POST[ 'off1' ]
		, 'offd1'  => $_POST[ 'offd1' ] ?: 0
		, 'off2'   => $_POST[ 'off2' ]
		, 'offd2'  => $_POST[ 'offd2' ] ?: 0
		, 'off3'   => $_POST[ 'off3' ]
		, 'offd3'  => $_POST[ 'offd3' ] ?: 0
		, 'off4'   => $_POST[ 'off4' ]
	]
	, 'timer' => $_POST[ 'timer' ]
];
$set = file_put_contents( '/srv/http/data/gpio/gpio.json', json_encode( $gpio, JSON_NUMERIC_CHECK ) );
echo $set;
