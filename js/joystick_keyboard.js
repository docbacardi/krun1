function joystick_keyboard_keyDownHandler(tEvent)
{
	var fSomethingHappened = false;
	
	if( tEvent.charCode==0 & tEvent.keyCode==38 )
	{
		ucJoystick |= JOYSTICKBIT_Up;
		fSomethingHappened = true;
	}
	else if( tEvent.charCode==0 & tEvent.keyCode==37 )
	{
		ucJoystick |= JOYSTICKBIT_Left;
		fSomethingHappened = true;
	}
	else if( tEvent.charCode==0 & tEvent.keyCode==40 )
	{
		ucJoystick |= JOYSTICKBIT_Down;
		fSomethingHappened = true;
	}
	else if( tEvent.charCode==0 & tEvent.keyCode==39 )
	{
		ucJoystick |= JOYSTICKBIT_Right;
		fSomethingHappened = true;
	}
	/* This is CTRL on the PC. */
	else if( tEvent.charCode==0 & tEvent.keyCode==17 )
	{
		ucJoystick |= JOYSTICKBIT_Fire;
		fSomethingHappened = true;
	}
	/* This is the A button on the WiiU. */
	else if( tEvent.charCode==0 & tEvent.keyCode==13 )
	{
		ucJoystick |= JOYSTICKBIT_Fire;
		fSomethingHappened = true;
	}
	
	if( fSomethingHappened==true )
	{
		joystick_handler_common();
	}
}



function joystick_keyboard_keyUpHandler(tEvent)
{
	var fSomethingHappened = false;
	
	if( tEvent.charCode==0 & tEvent.keyCode==38 )
	{
		ucJoystick &= 0xff-JOYSTICKBIT_Up;
		fSomethingHappened = true;
	}
	else if( tEvent.charCode==0 & tEvent.keyCode==37 )
	{
		ucJoystick &= 0xff-JOYSTICKBIT_Left;
		fSomethingHappened = true;
	}
	else if( tEvent.charCode==0 & tEvent.keyCode==40 )
	{
		ucJoystick &= 0xff-JOYSTICKBIT_Down;
		fSomethingHappened = true;
	}
	else if( tEvent.charCode==0 & tEvent.keyCode==39 )
	{
		ucJoystick &= 0xff-JOYSTICKBIT_Right;
		fSomethingHappened = true;
	}
	/* This is CTRL on the PC. */
	else if( tEvent.charCode==0 & tEvent.keyCode==17 )
	{
		ucJoystick &= 0xff-JOYSTICKBIT_Fire;
		fSomethingHappened = true;
	}
	/* This is the A button on the WiiU. */
	else if( tEvent.charCode==0 & tEvent.keyCode==13 )
	{
		ucJoystick &= 0xff-JOYSTICKBIT_Fire;
		fSomethingHappened = true;
	}
	
	if( fSomethingHappened==true )
	{
		joystick_handler_common();
	}
}



function joystick_keyboard_init()
{
	/* React to key events. */
	document.addEventListener("keydown", joystick_keyboard_keyDownHandler, true);
	document.addEventListener("keyup",   joystick_keyboard_keyUpHandler,   true);
}
