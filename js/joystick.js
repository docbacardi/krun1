/* Constants for the joystick movement. */
var JOYSTICKBIT_Up = 1;
var JOYSTICKBIT_Down = 2;
var JOYSTICKBIT_Left = 4;
var JOYSTICKBIT_Right = 8;
var JOYSTICKBIT_Fire = 16;


/* This is the current joystick data. */
var ucJoystick = 0;



function joystick_handler_common()
{
	/* Something happened on the joystick. Is the game in pause state? */
	if( tState==STATE_PAUSE )
	{
		game_request_resume();
	}
}
