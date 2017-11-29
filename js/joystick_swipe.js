/* This is the object for the swipe control. */
var atSwipeControl = [];
atSwipeControl.tLeft = [];
atSwipeControl.tLeft.ulId = null;
atSwipeControl.tLeft.atPoints = null;
atSwipeControl.tLeft.ulLastTime = null;
atSwipeControl.tRight = [];
atSwipeControl.tRight.ulId = null;
atSwipeControl.tRight.atPoints = null;
atSwipeControl.tRight.ulLastTime = null;



function joystick_swipe_handlerTouchStart(tEvent)
{
//	window.console.log("touch start");
//	window.console.log(tEvent.changedTouches);
//	window.console.log(tEvent.targetTouches);
//	window.console.log(tEvent.touches);

//	for(var i=0; i < tEvent.changedTouches.length; i++)
//	{
//		window.console.log(tEvent.changedTouches[i].identifier, tEvent.changedTouches[i].pageX, tEvent.changedTouches[i].pageY);
//	}


/*
atSwipeControl.tLeft = [];
atSwipeControl.tLeft.ulId = null;
atSwipeControl.tLeft.atPoints = null;
atSwipeControl.tLeft.ulLastTime = null;
atSwipeControl.tRight = [];
atSwipeControl.tRight.ulId = null;
atSwipeControl.tRight.atPoints = null;
atSwipeControl.tRight.ulLastTime = null;
*/
	var fSomethingHappened = false;
	
	/* Loop over all touch events. */
	for(var uiCnt=0; uiCnt<tEvent.changedTouches.length; uiCnt++)
	{
		var ulId = tEvent.changedTouches[uiCnt].identifier;
		/* Is the touch event on the left or right screen side? */
		if( tEvent.changedTouches[uiCnt].pageX<(document.documentElement.clientWidth/2) )
		{
			/* The touch event is on the left side. */
			
			/* Is a touch event already in progress? */
			if( atSwipeControl.tLeft.ulId==null )
			{
				/* This is a firebutton event. Do not care about the movement. */
				atSwipeControl.tLeft.ulId = ulId;
				ucJoystick |= JOYSTICKBIT_Fire;
				
				fSomethingHappened = true;
			}
		}
		else
		{
			var tSwipe = atSwipeControl.tRight;
			
			/* Is already a swipe operation in progress on this side? */
			if( tSwipe.ulId==null )
			{
				tSwipe.ulId = tEvent.changedTouches[uiCnt].identifier;
//				tPoint.ulTimeDelta = 0;
				tSwipe.ulX = tEvent.changedTouches[uiCnt].pageX;
				tSwipe.ulY = tEvent.changedTouches[uiCnt].pageY;
//				atSwipeControl.atPoints = [tPoint];
//				atSwipeControl.ulLastTime = tEvent.timeStamp;
				
				fSomethingHappened = true;
			}
		}
	}
	
	if( fSomethingHappened==true )
	{
		joystick_handler_common();
	}
	
	tEvent.preventDefault();
}



function joystick_swipe_handlerTouchEnd(tEvent)
{
	var fSomethingHappened = false;
	
	/* Loop over all touch events. */
	for(var uiCnt=0; uiCnt<tEvent.changedTouches.length; uiCnt++)
	{
		var ulId = tEvent.changedTouches[uiCnt].identifier;
		if( ulId==atSwipeControl.tLeft.ulId )
		{
			/* This is the firebutton event. */
			atSwipeControl.tLeft.ulId = null;
			ucJoystick &= 0xff-JOYSTICKBIT_Fire;
			
			fSomethingHappened = true;
		}
		else if( ulId==atSwipeControl.tRight.ulId )
		{
			/* This is the joystick event. */
			atSwipeControl.tRight.ulId = null;
			ucJoystick &= 0xff-JOYSTICKBIT_Up-JOYSTICKBIT_Down-JOYSTICKBIT_Left-JOYSTICKBIT_Right;
			
			fSomethingHappened = true;
		}
	}
	
	if( fSomethingHappened==true )
	{
		joystick_handler_common();
	}
	
	tEvent.preventDefault();
}



function joystick_swipe_handlerTouchCancel(tEvent)
{
	tMessageArea.add("touch cancel");
	joystick_swipe_handlerTouchEnd(tEvent);
}



function joystick_swipe_handlerTouchMove(tEvent)
{
	var fSomethingHappened = false;
	
	/* Loop over all touch events. */
	for(var uiCnt=0; uiCnt<tEvent.changedTouches.length; uiCnt++)
	{
		var tSwipe = atSwipeControl.tRight;
		if( tEvent.changedTouches[uiCnt].identifier==tSwipe.ulId )
		{
			/* Add a new point to the list. */
			var ulX = tEvent.changedTouches[uiCnt].pageX;
			var ulY = tEvent.changedTouches[uiCnt].pageY;
			
			/* Get the delta positions. */
			var fDeltaX = ulX - tSwipe.ulX;
			var fDeltaY = ulY - tSwipe.ulY;
			
			/* Has the point moved at all? The minimum is 16 pixels, everything below is noise. */
			if( Math.abs(fDeltaX)>=16 || Math.abs(fDeltaY)>=16 )
			{
				tSwipe.ulX = ulX;
				tSwipe.ulY = ulY;
			
				var uiSegment = null;
				var fRad = Math.atan2(fDeltaY, fDeltaX);
				if( fRad<-(7*Math.PI/8) )
				{
					uiSegment = 6;
				}
				else if( fRad<-(5*Math.PI/8) )
				{
					uiSegment = 7;
				}
				else if( fRad<-(3*Math.PI/8) )
				{
					uiSegment = 0;
				}
				else if( fRad<-(1*Math.PI/8) )
				{
					uiSegment = 1;
				}
				else if( fRad<(1*Math.PI/8) )
				{
					uiSegment = 2;
				}
				else if( fRad<(3*Math.PI/8) )
				{
					uiSegment = 3;
				}
				else if( fRad<(5*Math.PI/8) )
				{
					uiSegment = 4;
				}
				else if( fRad<(7*Math.PI/8) )
				{
					uiSegment = 5;
				}
				else
				{
					uiSegment = 6;
				}

//				window.console.log(uiSegment);

				ucJoystick &= 0xff-JOYSTICKBIT_Up-JOYSTICKBIT_Down-JOYSTICKBIT_Left-JOYSTICKBIT_Right;
				if( uiSegment==0 )
				{
					ucJoystick |= JOYSTICKBIT_Up;
					fSomethingHappened = true;
				}
				else if( uiSegment==2 )
				{
					ucJoystick |= JOYSTICKBIT_Right;
					fSomethingHappened = true;
				}
				else if( uiSegment==4 )
				{
					ucJoystick |= JOYSTICKBIT_Down;
					fSomethingHappened = true;
				}
				else if( uiSegment==6 )
				{
					ucJoystick |= JOYSTICKBIT_Left;
					fSomethingHappened = true;
				}
			}
			
			/* Stop after the joystick event. */
			break;
		}
	}
	
	if( fSomethingHappened==true )
	{
		joystick_handler_common();
	}
	
	tEvent.preventDefault();
}



function joystick_swipe_init()
{
	/* React to touch events. */
	document.addEventListener("touchstart",  joystick_swipe_handlerTouchStart,  false);
	document.addEventListener("touchend",    joystick_swipe_handlerTouchEnd,    false);
	document.addEventListener("touchcancel", joystick_swipe_handlerTouchCancel, false);
	document.addEventListener("touchmove",   joystick_swipe_handlerTouchMove,   false);
}

