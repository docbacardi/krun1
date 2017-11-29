/* Global variables. */

/* This is the state machine for the complete engine. */
var STATE_IDLE         = 0;    /* Nothing to do right now. */
var STATE_LOADING      = 1;    /* Loading the level data. */
var STATE_INITIALIZING = 2;    /* Converting the level to the internal format. */
var STATE_PLAYING      = 3;    /* Playing. */
var STATE_PAUSE        = 4;    /* Playing but paused. */
var STATE_GAME_OVER    = 5;    /* Game over. */
var STATE_FINISH       = 6;    /* Reached the goal. */

var tState = STATE_IDLE;


/* This is the state for the player. */
var PLAYERSTATE_INACTIVE = 0;   /* The player is currently not on the screen. */
var PLAYERSTATE_WALKING = 1;    /* The player is walking on solid ground. */
var PLAYERSTATE_FALLING = 2;    /* The player falls down. */
var PLAYERSTATE_JUMPING = 3;    /* The player is jumping. */
var PLAYERSTATE_LIFELOST = 4;   /* The player lost a life. */

var PLAYERJUMPSTATE_UP = 0;
var PLAYERJUMPSTATE_DOWN = 1;

var PLAYERANIMATION_STAND_LEFT  = 0;
var PLAYERANIMATION_STAND_RIGHT = 1;
var PLAYERANIMATION_WALK_LEFT   = 2;
var PLAYERANIMATION_WALK_RIGHT  = 3;
var PLAYERANIMATION_JUMP_LEFT   = 4;
var PLAYERANIMATION_JUMP_RIGHT  = 5;
var PLAYERANIMATION_CLIMBING    = 6;
var PLAYERANIMATION_DEAD        = 7;


var tPlayer = [];
tPlayer.uiNumberOfLifesLeft = 4;
tPlayer.tState = PLAYERSTATE_INACTIVE;
tPlayer.ulFallingHeight = 0;    /* This is the number of pixels the player fell down. */
tPlayer.ulMaxFallingHeight = 128;   /* This is the maximum number of pixels the player can fall down without dying. */
tPlayer.ulCurrentSpeed = 0;
tPlayer.ulSpeedMax_JumpX = 4;
tPlayer.ulSpeedMax_Walk = 4;
tPlayer.ulSpeedMax_Climb = 2;
tPlayer.ulSpeedMax_FallDown = 8;
tPlayer.ulMaxStepUp = 8;
tPlayer.tCollisionBox = []
tPlayer.tCollisionBox.x0 = 9;
tPlayer.tCollisionBox.y0 = 2;
tPlayer.tCollisionBox.x1 = 23;
tPlayer.tCollisionBox.y1 = 32;
tPlayer.tJumpState = PLAYERJUMPSTATE_UP;
tPlayer.ulJumpBasePositionY = -1;
tPlayer.iJumpSpeedX = 0;
tPlayer.uiJumpYCnt = 0;
tPlayer.uiJumpYMax = 0;
tPlayer.uiJumpYOffset = 0;
tPlayer.atAnimation = [];
tPlayer.atAnimation.auiStandLeft = null;
tPlayer.atAnimation.auiStandRight = null;
tPlayer.atAnimation.auiJumpLeft = null;
tPlayer.atAnimation.auiJumpRight = null;
tPlayer.atAnimation.auiWalkLeft = null;
tPlayer.atAnimation.auiWalkRight = null;
tPlayer.atAnimation.auiClimbing = null;
tPlayer.atAnimation.auiDead = null;


/* These are the possible collision test modes. */
var COLLISIONTEST_WALK  = 0;    /* Check if walking is stopped by a collision. */
var COLLISIONTEST_FALL  = 1;    /* Check if falling is stopped by a collision. */
var COLLISIONTEST_JUMP  = 2;    /* Check if jumping is stopped by a collision. */
var COLLISIONTEST_STAND = 3;    /* Check if the player can stand on a tile. */


/* Size of one tile in pixels. */
var sizTileXPixels;
var sizTileYPixels;

/* Size of the screen and the buffer in tiles. */
var sizScreenSizeXTiles;
var sizScreenSizeYTiles;
var sizBufferSizeXTiles;
var sizBufferSizeYTiles;


/* This is the request object for loading various data from the server. */
var tLoader = [];
tLoader.tRequestObject = null;
tLoader.atRequestList = [];
tLoader.ulRequestPosition = 0;
tLoader.pfnFinal = null;

/* This is the parsed map. */
var tMapParsed;


/*
 * Rendering
 */

/* This is the array of layers. */
var atLayers;
/* This is the array of rooms. */
var atRooms;
var atRoomsActive = [];
/* This is the array of tiles. */
var atTiles;
/* This array contains all animations. */
var atAnimationsAll;
/* This array contains all global animations. They are always active and all tiles with this animation on the screen have the same animation step. */
var atAnimationsGlobal;
/* This array contains the local animations. They are special for one single tile and animate independently from all other tiles and their animations. */
var atAnimationsLocal;
/* This array contains all named tiles. */
var atNamedTiles;

/* This is the list of all sprites in all layers. */
var atSprites;
/* This is the player sprite. */
var tSpritePlayer;
/* This is the game-over sprite. It is the player as an angel. */
var tSpritePlayerAngel;

/* This is the on-screen canvas. */
var tScreenCanvas;
/* This is the context for the on-screen canvas. */
var tScreenCtx;

/* This is the mask canvas and context. */
var tMask;

/* This is the rendering stack. */
var atRenderStack;

/* This is a view of the complete level in buffers of 8*8 tiles. */
var atLevelBuffers;
var uiLevelBuffersX;
var uiLevelBuffersY;

/* This is the array of 'redraw requested' bits for the complete buffer.
 * Note that the buffer is larger than the screen to enable scrolling.
 */
var aucReRe;

/* This is the camera position in pixels. */
var ulCameraX;
var ulCameraY;


var tMessageArea;

/* This is a notification from an asyncronous handler like the "onblur" event that a pause of the game is requested. */
var fRequestPause;

var ulLastRenderTime;



/* This function decodes one character of a base64 encoded string to a 6 bit
 * value.
 */
function base64_decode_char(ucChar)
{
	var ucData = 0;
	
	/* A..Z is 0..25 . */
	if( ucChar>=65 && ucChar<=90 )
	{
		ucData = ucChar - 65;
	}
	/* a..z is 26..51 . */
	else if( ucChar>=97 && ucChar<=122 )
	{
		ucData = ucChar - 71;
	}
	/* 0..9 is 52..61 . */
	else if( ucChar>=48 && ucChar<=57 )
	{
		ucData = ucChar + 4;
	}
	/* + is 62 . */
	else if( ucChar==43 )
	{
		ucData = 62;
	}
	/* / is 63 . */
	else if( ucChar==47 )
	{
		ucData = 63;
	}
	
	return ucData;
}


function base64_to_uint8array(strBase64)
{
	var sizBytesOut = strBase64.length * 3 / 4;
	/* Count the '=' at the end of the encoded string. */
	if( strBase64.charAt(strBase64.length-1)=='=' )
	{
		sizBytesOut -= 1;
		if( strBase64.charAt(strBase64.length-2)=='=' )
		{
			sizBytesOut -= 1;
		}
	}
	var aData = new Uint8ClampedArray(sizBytesOut);
	
	/* Loop over all output bytes. */
	for(var uiPosIn=0,uiPosOut=0; uiPosOut<sizBytesOut; uiPosIn+=4,uiPosOut+=3)
	{
		var ul0 = base64_decode_char(strBase64.charCodeAt(uiPosIn));
		var ul1 = base64_decode_char(strBase64.charCodeAt(uiPosIn+1));
		var ul2 = base64_decode_char(strBase64.charCodeAt(uiPosIn+2));
		var ul3 = base64_decode_char(strBase64.charCodeAt(uiPosIn+3));
		aData[uiPosOut]   = ((ul0 << 2) | (ul1 >>> 4)) & 0xff;
		aData[uiPosOut+1] = ((ul1 << 4) | (ul2 >>> 2)) & 0xff;
		aData[uiPosOut+2] = ((ul2 << 6) | ul3) & 0xff;
	}
	
	return aData;
}



function continue_animation(tAnim, dTickFraction)
{
	var dTickFractionsLeft = dTickFraction;

	if( tAnim.fIsRunning==true )
	{
		while( dTickFractionsLeft>0.0 )
		{
			var dTickFractionChunk = dTickFractionsLeft;
			/* Is a delay present? */
			if( tAnim.dCurrentDelay>0.0 )
			{
				/* Limit the tick fraktion chunk by the delay. */
				if( dTickFractionChunk>tAnim.dCurrentDelay )
				{
					dTickFractionChunk = tAnim.dCurrentDelay;
				}
				
				/* Decrement the delay. */
				tAnim.dCurrentDelay -= dTickFractionChunk;
			}
			dTickFractionsLeft -= dTickFractionChunk;
			
			/* Is a delay left? */
			if( tAnim.dCurrentDelay==0.0 )
			{
				/* No -> move on to the next animation step. */
				
				/* Get the current step value. */
				var tStep = tAnim.atSteps[tAnim.uiCurrentStep];
				/* Set the new tile for this step. */
				tAnim.uiCurrentTileIndex = tStep.uiTileIndex;
				/* Set the new delay for this step. */
				tAnim.dCurrentDelay = tStep.uiDelay;
				/* Increase the posititon. */
				tAnim.uiCurrentStep += 1;
				/* Reached the end of the array? */
				if( tAnim.uiCurrentStep>=tAnim.atSteps.length )
				{
					/* Yes. Restart? */
					if( tAnim.fIsOneshot==false )
					{
						/* Yes, restart! */
						tAnim.uiCurrentStep = 0;
					}
					else
					{
						/* No, this is a one-shot animation. Stop processing this animation. */
						tAnim.fIsRunning = false;
						
						/* Do not process the rest of the time. */
						dTickFractionsLeft = 0.0;
						
						/* Is there a callback? */
						if( tAnim.fnCallbackEnd!=null )
						{
							tAnim.fnCallbackEnd(tAnim);
						}
					}
				}
			}
		}
	}
}



function animations_step(dTickFraction)
{
	/* Loop over all global animations. */
	var sizAnimationsGlobal = atAnimationsGlobal.length;
	for(var uiIdx=0; uiIdx<sizAnimationsGlobal; uiIdx++)
	{
		var tAnimation = atAnimationsGlobal[uiIdx];
		continue_animation(tAnimation, dTickFraction);
	}


	/* Loop over all local animations. */
	var sizAnimationsLocal = atAnimationsLocal.length;
	for(var uiIdx=0; uiIdx<sizAnimationsLocal; uiIdx++)
	{
		var tAnimation = atAnimationsLocal[uiIdx];
		continue_animation(tAnimation, dTickFraction);
	}
}



function animation_clone(tExistingAnimation, uiLayer, ulTileReference)
{
	/* Create the new animation object. */
	var tClonedAnimation = {};

	/* Make a link to the steps. */
	tClonedAnimation.atSteps = tExistingAnimation.atSteps;

	/* Initialize the animation position. */
	tClonedAnimation.uiCurrentTileIndex = tClonedAnimation.atSteps[0].uiTileIndex;
	tClonedAnimation.dCurrentDelay      = 0.0;
	tClonedAnimation.uiCurrentStep      = 0;

	/* Copy all other elements. */
	tClonedAnimation.fIsOneshot         = tExistingAnimation.fIsOneshot;
	tClonedAnimation.fnCallbackEnd      = tExistingAnimation.fnCallbackEnd;

	/* Add the layer and tile index as a reference. */
	tClonedAnimation.uiLayer            = uiLayer;
	tClonedAnimation.ulTileReference    = ulTileReference;

	/* Set the animation to "running" by default. */
	tClonedAnimation.fIsRunning         = true;

	return tClonedAnimation;
}



function animation_search_clone(atList, ulTileReference)
{
	/* Nothing found yet. */
	var uiFoundIdx = null;

	/* Loop over all elements in the list. */
	var sizList = atList.length;
	for(var uiCnt=0; uiCnt<sizList; uiCnt++)
	{
		if( atList[uiCnt].ulTileReference==ulTileReference )
		{
			uiFoundIdx = uiCnt;
			break;
		}
	}

	return uiFoundIdx;
}



function animation_remove_all_clones(atList, ulTileReference)
{
	/* This is the start index. */
	var uiIdx = 0;

	var sizList = atList.length;
	while(uiIdx<sizList)
	{
		/* Does the current element match the criteria? */
		if(atList[uiIdx].ulTileReference==ulTileReference)
		{
			/* Yes -> delete the item. */
			atList.splice(uiIdx, 1);
			/* Update the size of the list. */
			--sizList;
			/* NOTE: do not move to the next entry here. */
		}
		else
		{
			/* Move to the next entry. */
			++uiIdx;
		}
	}
}



function animation_end_mushroom_switch_activated(tAnimation)
{
	tMessageArea.add("Mushroom switch active!");

	var uiTilePos = tAnimation.ulTileReference;
	var uiLayer = tAnimation.uiLayer;

	/* Remove the animation from the local list. */
	animation_remove_all_clones(atAnimationsLocal, uiTilePos);
	/* Remove the animation from the tile. */
	atRenderStack[uiLayer].atAnimations[uiTilePos] = null;

	/* Activate the switch again. */
	var ulTileIdx = atNamedTiles['mushroom_switch_finished'];
	atRenderStack[uiLayer].atTiles[uiTilePos] = ulTileIdx;
	/* Request a redraw of the tile. */
	aucReRe[uiTilePos>>>3] |= 1<<(uiTilePos&7);

	/* Search the switch in the position table. */
	var uiTarget0Pos = tMapParsed.atSwitch2Door[uiTilePos];
	var uiTarget1Pos = uiTarget0Pos + tMapParsed.map_size_x;
	/* Get the door animations. */
	var ulTile0Idx = atNamedTiles['door_up'];
	var tAnim0 = atAnimationsAll[ulTile0Idx];
	var ulTile1Idx = atNamedTiles['door_down'];
	var tAnim1 = atAnimationsAll[ulTile1Idx];
	/* Clone the animations. */
	var tClonedAnimation0 = animation_clone(tAnim0, uiLayer, uiTarget0Pos);
	var tClonedAnimation1 = animation_clone(tAnim1, uiLayer, uiTarget1Pos);
	/* Attach the new animation to the tile and add it to the local animations. */
	atRenderStack[uiLayer].atAnimations[uiTarget0Pos] = tClonedAnimation0;
	atRenderStack[uiLayer].atAnimations[uiTarget1Pos] = tClonedAnimation1;
	atAnimationsLocal.push(tClonedAnimation0);
	atAnimationsLocal.push(tClonedAnimation1);
	/* Set the first element of the new animation. */
	atRenderStack[uiLayer].atTiles[uiTarget0Pos] = ulTile0Idx;
	atRenderStack[uiLayer].atTiles[uiTarget1Pos] = ulTile1Idx;
}



function animation_end_door_open(tAnimation)
{
	var uiTilePos = tAnimation.ulTileReference;
	var uiLayer = tAnimation.uiLayer;

	/* Remove the animation from the local list. */
	animation_remove_all_clones(atAnimationsLocal, uiTilePos);
	/* Remove the animation from the tile. */
	atRenderStack[uiLayer].atAnimations[uiTilePos] = null;

	/* Clear the field. */
	atRenderStack[uiLayer].atTiles[uiTilePos] = 0;
	/* Request a redraw of the tile. */
	aucReRe[uiTilePos>>>3] |= 1<<(uiTilePos&7);
}



var atAnimationEndFunctions = {
	'mushroom_switch_activated': animation_end_mushroom_switch_activated,
	'door_open': animation_end_door_open
};



function redraw_tile(x, y)
{
	/* This is the position in the map data. */
	var uiTilePos = x + tMapParsed.map_size_x * y;
	var fRedraw = ( (aucReRe[uiTilePos>>>3] & (1<<(uiTilePos&7)))!=0 );
	
	/* Check all layers for animation. */
	var sizRenderStack = atRenderStack.length;
	for(var uiCnt=0; uiCnt<sizRenderStack; uiCnt++)
	{
		var tAnim = atRenderStack[uiCnt].atAnimations[uiTilePos];
		if( tAnim!=null && atRenderStack[uiCnt].atTiles[uiTilePos]!=tAnim.uiCurrentTileIndex )
		{
			atRenderStack[uiCnt].atTiles[uiTilePos] = tAnim.uiCurrentTileIndex;
			fRedraw = true;
		}
	}
	
	if( fRedraw==true )
	{
		/* Get the image data for all layers. */
		var i0 = atTiles[ atRenderStack[0].atTiles[uiTilePos] ];
		var i1 = atTiles[ atRenderStack[1].atTiles[uiTilePos] ];
		/* This is the position on the level buffers. */
		var uiBufferPos = Math.floor(x/sizBufferSizeXTiles) + uiLevelBuffersX*Math.floor(y/sizBufferSizeYTiles);
		var uiBufferXOffs = x % sizBufferSizeXTiles;
		var uiBufferYOffs = y % sizBufferSizeYTiles;
		/* Get the buffers. */
		var b0 = atLevelBuffers[uiBufferPos][0][1];
		var b1 = atLevelBuffers[uiBufferPos][1][1];
		/* Draw the tiles. */
		b0.putImageData(i0,uiBufferXOffs*sizTileXPixels,uiBufferYOffs*sizTileYPixels);
		b1.putImageData(i1,uiBufferXOffs*sizTileXPixels,uiBufferYOffs*sizTileYPixels);
		
		aucReRe[uiTilePos>>>3] &= ~(1<<(uiTilePos&7));
	}
}



/*
 * Draw the buffers on the screen.
 */
function draw_map()
{
	var ulBufXStart = Math.floor(ulCameraX / (sizTileXPixels*sizBufferSizeXTiles));
	var ulBufYStart = Math.floor(ulCameraY / (sizTileYPixels*sizBufferSizeYTiles));
	var ulBufXEnd = Math.ceil((ulCameraX+sizScreenSizeXTiles*sizTileXPixels) / (sizTileXPixels*sizBufferSizeXTiles));
	var ulBufYEnd = Math.ceil((ulCameraY+sizScreenSizeYTiles*sizTileYPixels) / (sizTileYPixels*sizBufferSizeYTiles));
	var uiOffsetX = ulCameraX % (sizTileXPixels*sizBufferSizeXTiles);
	var uiOffsetY = ulCameraY % (sizTileYPixels*sizBufferSizeYTiles);
	var ulScreenSizeXPixels = sizScreenSizeXTiles * sizTileXPixels;
	var ulScreenSizeYPixels = sizScreenSizeYTiles * sizTileYPixels;
	var ulBufferXPixels = sizBufferSizeXTiles * sizTileXPixels;
	var ulBufferYPixels = sizBufferSizeYTiles * sizTileYPixels;
	var sx;
	var sy;
	var sw;
	var sh;
	var dx;
	var dy;
	
	
	/* Draw with the identity matrix. */
	/* tScreenCtx.resetTransform(); */
	tScreenCtx.setTransform(1, 0, 0, 1, 0, 0);
	
	var sizRenderStack = atRenderStack.length;
	for(var uiLayerCnt=0; uiLayerCnt<sizRenderStack; uiLayerCnt++)
	{
		var tRenderLayer = atRenderStack[uiLayerCnt];
		
		sy = uiOffsetY;
		sh = ulBufferYPixels-sy;
		dy = 0;
		for(var y=ulBufYStart; y<ulBufYEnd; y++)
		{
			sx = uiOffsetX;
			sw = ulBufferXPixels - sx;
			dx = 0;
			for(var x=ulBufXStart; x<ulBufXEnd; x++)
			{
				/* Get the buffers. */
				var uiBufferPos = x + uiLevelBuffersX*y;
				var i = atLevelBuffers[uiBufferPos][uiLayerCnt][0];
				
				tScreenCtx.drawImage(i, sx, sy, sw, sh, dx, dy, sw, sh);
				
				dx += sw;
				sx = 0;
				sw = ulBufferXPixels;
				if( (dx+sw)>ulScreenSizeXPixels )
				{
					sw = ulScreenSizeXPixels - dx;
				}
			}
			dy += sh;
			sy = 0;
			sh = ulBufferYPixels;
			if( (dy+sh)>ulScreenSizeYPixels )
			{
				sh = ulScreenSizeYPixels - dy;
			}
		}
		
		/* Now display the sprites. */
		var atSprites = tRenderLayer.atSprites;
		var sizSprites = atSprites.length;
		for(var uiSpriteCnt=0; uiSpriteCnt<sizSprites; uiSpriteCnt++)
		{
			var tSprite = atSprites[uiSpriteCnt];
			
			/* Is this sprite visible? */
			if( tSprite.fActive==true )
			{
				/* Yes, the sprite is visible. */
				var posX = tSprite.uiPosX-ulCameraX-tPlayer.tCollisionBox.x0-(tPlayer.tCollisionBox.x1-tPlayer.tCollisionBox.x0)/2;
				var posY = tSprite.uiPosY-ulCameraY-tPlayer.tCollisionBox.y0-(tPlayer.tCollisionBox.y1-tPlayer.tCollisionBox.y0)/2;
				tScreenCtx.drawImage(tSprite.tCanvas, posX, posY);
			}
		}
	}
	
	/* Display the mask on top of all layers. */
	tScreenCtx.translate(-ulCameraX, -ulCameraY);
	tScreenCtx.scale(sizTileXPixels, sizTileYPixels);
	tScreenCtx.drawImage(tMask.tCanvas, 0, 0);
	tScreenCtx.setTransform(1, 0, 0, 1, 0, 0);
}



function camera_update_position(ulCameraNewX, ulCameraNewY)
{
	var ulScreenSizeXPixel = sizScreenSizeXTiles * sizTileXPixels;
	var ulScreenSizeYPixel = sizScreenSizeYTiles * sizTileYPixels;
	
	
	/* Did the position change at all? */
	if( ulCameraNewX!=ulCameraX || ulCameraNewY!=ulCameraY )
	{
		var ulCurrentBufferX = Math.floor(ulCameraX / (sizBufferSizeXTiles*sizTileXPixels));
		var ulCurrentBufferY = Math.floor(ulCameraY / (sizBufferSizeYTiles*sizTileYPixels));
		var ulNewBufferX = Math.floor(ulCameraNewX / (sizBufferSizeXTiles*sizTileXPixels));
		var ulNewBufferY = Math.floor(ulCameraNewY / (sizBufferSizeYTiles*sizTileYPixels));
		var ulNewBufferXEnd = ulNewBufferX + Math.ceil((sizScreenSizeXTiles+1) / sizBufferSizeXTiles);
		var ulNewBufferYEnd = ulNewBufferY + Math.ceil((sizScreenSizeYTiles+1) / sizBufferSizeYTiles);
		
		/* Did the tile position change? */
		if( ulCurrentBufferX!=ulNewBufferX || ulCurrentBufferY!=ulNewBufferY )
		{
			/* Collect all buffers which are currently off-screen. */
			var aFree = [];
			var aNeed = [];
			for(var y=0; y<uiLevelBuffersX; y++)
			{
				for(var x=0; x<uiLevelBuffersX; x++)
				{
					/* Does this position have a buffer? */
					if( atLevelBuffers[x + y*uiLevelBuffersX]!=null )
					{
						if( x<ulNewBufferX || x>=ulNewBufferXEnd || y<ulNewBufferY || y>=ulNewBufferYEnd )
						{
							/* This buffer is completely off-screen. */
							aFree.push([x,y]);
						}
					}
					else
					{
						/* This position does not have a buffer.
						 * Is it inside the new buffered area?
						 */
						if( x>=ulNewBufferX && x<ulNewBufferXEnd && y>=ulNewBufferY && y<ulNewBufferYEnd )
						{
							aNeed.push([x,y]);
						}
					}
				}
			}
			
			/* Now the number of free buffers must match the wanted. */
			if( aFree.length!=aNeed.length )
			{
				tMessageArea.add("Argh!");
			}
			else
			{
				var tBuf;
				var uiSrc;
				var uiDst;
				var xs, ys, xe, ye, uiTilePos;
				for(var uiCnt=0; uiCnt<aFree.length; uiCnt++)
				{
					uiSrc = aFree[uiCnt][0] + aFree[uiCnt][1]*uiLevelBuffersX;
					uiDst = aNeed[uiCnt][0] + aNeed[uiCnt][1]*uiLevelBuffersX;
					atLevelBuffers[uiDst] = atLevelBuffers[uiSrc];
					atLevelBuffers[uiSrc] = null;
					
					/* Invalidate the ReRe for the buffer. */
					xs = aNeed[uiCnt][0]*sizBufferSizeXTiles;
					xe = xs + sizBufferSizeXTiles;
					ys = aNeed[uiCnt][1]*sizBufferSizeYTiles;
					ye = ys + sizBufferSizeYTiles;
					for(var y=ys; y<ye; y++)
					{
						for(var x=xs; x<xe; x++)
						{
							uiTilePos = x + tMapParsed.map_size_x * y;
							aucReRe[uiTilePos>>>3] |= 1<<(uiTilePos&7);
						}
					}
				}
			}
		}
		
		ulCameraX = ulCameraNewX;
		ulCameraY = ulCameraNewY;
	}
}


function camera_move_center_player()
{
	/* There should be several modes in the future, like a fixed position for a special event in a small room.
	 * For now there is just one mode: center around the player.
	 */

	/* Get the player position. */
	var ulPosX = tSpritePlayer.uiPosX;
	var ulPosY = tSpritePlayer.uiPosY;
	if( tPlayer.tState==PLAYERSTATE_JUMPING )
	{
		ulPosY = tPlayer.ulJumpBasePositionY;
	}
	else if( tPlayer.tState==PLAYERSTATE_FALLING )
	{
		/* A jump is currently going on if the player is above the baseline. */
		if( ulPosY<=tPlayer.ulJumpBasePositionY )
		{
			ulPosY = tPlayer.ulJumpBasePositionY;
		}
	}
	
	/* Try to center the player. */
	var ulCameraNewX = ulPosX - (sizScreenSizeXTiles*sizTileXPixels / 2);
	var ulCameraNewY = ulPosY - (sizScreenSizeYTiles*sizTileYPixels / 2);
	var ulCameraMaxX = (tMapParsed.map_size_x-sizScreenSizeXTiles) * sizTileXPixels - 1;
	var ulCameraMaxY = (tMapParsed.map_size_y-sizScreenSizeYTiles) * sizTileYPixels - 1;
	if( ulCameraNewX<0 )
	{
		ulCameraNewX = 0;
	}
	else if( ulCameraNewX>ulCameraMaxX )
	{
		ulCameraNewX = ulCameraMaxX;
	}
	if( ulCameraNewY<0 )
	{
		ulCameraNewY = 0;
	}
	else if( ulCameraNewY>ulCameraMaxY )
	{
		ulCameraNewY = ulCameraMaxY;
	}
	
	/* Return the new camera position. */
	return [ulCameraNewX, ulCameraNewY];
}



function camera_move()
{
	/* There should be several modes in the future, like a fixed position for a special event in a small room.
	 * For now there is just one mode: center around the player.
	 */

	/* Try to center the player. */
	var ulCameraNew = camera_move_center_player();
	
	/* Do not move to the new position at one, but keep the moving speed at a maximum - except it is larger than one complete screen. */
	var iDeltaX = ulCameraNew[0] - ulCameraX;
	var iDeltaY = ulCameraNew[1] - ulCameraY;
	
	var ulScreenSizeXPixels = sizScreenSizeXTiles * sizTileXPixels;
	var ulScreenSizeYPixels = sizScreenSizeYTiles * sizTileYPixels;
	
	var ulCameraNewX;
	var ulCameraNewY;
	
	var ulCameraMaxMovement = 8;
	
	if( iDeltaX>ulScreenSizeXPixels || iDeltaY>ulScreenSizeYPixels )
	{
		/* The distance is too far, just warp there. */
		ulCameraNewX = ulCameraNew[0];
		ulCameraNewY = ulCameraNew[1];
	}
	else
	{
		/* Move there in slow movement. */
		if( iDeltaX<(-ulCameraMaxMovement) )
		{
			iDeltaX = -ulCameraMaxMovement;
		}
		else if( iDeltaX>ulCameraMaxMovement )
		{
			iDeltaX = ulCameraMaxMovement;
		}
		if( iDeltaY<(-ulCameraMaxMovement) )
		{
			iDeltaY = -ulCameraMaxMovement;
		}
		else if( iDeltaY>ulCameraMaxMovement )
		{
			iDeltaY = ulCameraMaxMovement;
		}
		ulCameraNewX = ulCameraX + iDeltaX;
		ulCameraNewY = ulCameraY + iDeltaY;
	}
	
	/* Set the new camera position. */
	camera_update_position(ulCameraNewX, ulCameraNewY);
}



function refresh_map()
{
	/*
	 * Refresh all buffers.
	 */
	var ulTileXStart = Math.floor(ulCameraX/sizTileXPixels);
	var ulTileYStart = Math.floor(ulCameraY/sizTileYPixels);
	var ulTileXEnd = ulTileXStart + sizScreenSizeXTiles + 1;
	var ulTileYEnd = ulTileYStart + sizScreenSizeYTiles + 1;
	for(var y=ulTileYStart; y<ulTileYEnd; y++)
	{
		for(var x=ulTileXStart; x<ulTileXEnd; x++)
		{
			redraw_tile(x,y);
		}
	}
	
	draw_map();
}



function player_looses_life()
{
	/* Make the angel sprite visible. */
	tSpritePlayerAngel.fActive = true;
	/* Start moving at the same position as the player. */
	tSpritePlayerAngel.uiPosX = tSpritePlayer.uiPosX;
	tSpritePlayerAngel.uiPosY = tSpritePlayer.uiPosY;

	/* Show the "dead" animation. */
	tSpritePlayer.uiAnimationTableIndex = 0;
	tPlayer.tCurrentAnimation = PLAYERANIMATION_DEAD;
	tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiDead;
	tSpritePlayer.uiAnimationStepDelay = 1;

	tPlayer.tState = PLAYERSTATE_LIFELOST;
}



function collision_action_gold(tCollisionTestMode, uiLayer, uiTilePos)
{
	var fCollision;
	
	
	switch( tCollisionTestMode )
	{
	case COLLISIONTEST_WALK:
	case COLLISIONTEST_FALL:
	case COLLISIONTEST_JUMP:
		/* Remove the gold bar from the layer. */
		atRenderStack[uiLayer].atTiles[uiTilePos] = 0;
		/* Request a redraw of the tile. */
		aucReRe[uiTilePos>>>3] |= 1<<(uiTilePos&7);

		/* TODO: remove this */
		tMessageArea.add('Gold!');

		/* Search the gold in the position table. */
		var uiTargetPos = tMapParsed.atGold2Target[uiTilePos];
		/* Get the stair tile. */
		var ulTileIdx = atNamedTiles['gold_target'];
		/* Place the new stair. */
		atRenderStack[uiLayer].atTiles[uiTargetPos] = ulTileIdx;
		/* Request a redraw of the tile. */
		aucReRe[uiTargetPos>>>3] |= 1<<(uiTargetPos&7);

		/* No collision. */
		fCollision = 0;

		break;
	
	case COLLISIONTEST_STAND:
		/* The player can not stand on gold. */
		fCollision = 0;
		break;
	}
	
	return fCollision;
}



function collision_action_snake(tCollisionTestMode, uiLayer, uiTilePos)
{
	var fCollision;
	
	
	switch( tCollisionTestMode )
	{
	case COLLISIONTEST_WALK:
	case COLLISIONTEST_FALL:
	case COLLISIONTEST_JUMP:
		player_looses_life();
		
		/* No collision. */
		fCollision = 0;
		
		/* TODO: Remove the snake? */
		
		break;
	
	case COLLISIONTEST_STAND:
		/* The player can not stand on a snake. */
		fCollision = 0;
		break;
	}
	
	return fCollision;
}



function collision_action_spears(tCollisionTestMode, uiLayer, uiTilePos)
{
	var fCollision;
	
	
	switch( tCollisionTestMode )
	{
	case COLLISIONTEST_WALK:
	case COLLISIONTEST_FALL:
	case COLLISIONTEST_JUMP:
		player_looses_life();
		
		/* No collision. */
		fCollision = 0;
		
		break;
	
	case COLLISIONTEST_STAND:
		/* The player can not stand on spears. */
		fCollision = 0;
		break;
	}
	
	return fCollision;
}



function collision_action_mushroom_switch_activate(tCollisionTestMode, uiLayer, uiTilePos)
{
	var fCollision;


	/* Check if the players position is above the mushroom.
	 * Otherwise walking into the mushroom would also trigger the switch.
	 * This can be done by checking the jump state 'tPlayer.tJumpState'.
	 * If it is PLAYERJUMPSTATE_DOWN, the jump is going down.
	 */
	if( (tPlayer.tState==PLAYERSTATE_JUMPING && tPlayer.tJumpState==PLAYERJUMPSTATE_DOWN) || tPlayer.tState==PLAYERSTATE_FALLING )
	{
		/* Get the mushroom animation. */
		var ulTileIdx = atNamedTiles['mushroom_switch_animation'];
		var tAnimation = atAnimationsAll[ulTileIdx];
		/* Clone the mushroom animation. */
		var tClonedAnimation = animation_clone(tAnimation, uiLayer, uiTilePos);
		/* Attach the new animation to the tile and add it to the local animations. */
		atRenderStack[uiLayer].atAnimations[uiTilePos] = tClonedAnimation;
		atAnimationsLocal.push(tClonedAnimation);
		/* Set the first element of the new animation to prevent multiple switch activations. */
		atRenderStack[uiLayer].atTiles[uiTilePos] = ulTileIdx;
	}

	switch( tCollisionTestMode )
	{
	/* The player can walk and jump through mushrooms. */
	case COLLISIONTEST_WALK:
	case COLLISIONTEST_JUMP:
		fCollision = 0;
		break;

	/* The player can not fall through mushrooms. */
	case COLLISIONTEST_FALL:
	/* The player can stand on mushrooms. */
	case COLLISIONTEST_STAND:
		fCollision = 1;
		break;
	}
	
	return fCollision;
}



/* This array maps the name of the collision action to the corresponding handler function. */
var atCollisionFunctions = {
	'gold': collision_action_gold,
	'snake': collision_action_snake,
	'spears': collision_action_spears,
	'mushroom_switch_activate': collision_action_mushroom_switch_activate
};



/* ulPlayerRadiusX = player collision box radius x
 * ulPlayerRadiusY = player collision box radius y
 * atPlayerPositions = an array of x/y pairs of the current movement to test. This is the center position.
 * tCollisionTestMode = one collision mode to test
 */
function collision_test(ulPlayerRadiusX, ulPlayerRadiusY, atPlayerPositions, tCollisionTestMode)
{
	/* Collect the collision information in this array. */
	var ulNotCollidingEntries = 0;
	
	var fCollision = 0;
	
	/* Loop over all player position. */
	for(var uiPositionCnt=0; uiPositionCnt<atPlayerPositions.length; uiPositionCnt++)
	{
		var tPosition = atPlayerPositions[uiPositionCnt];
		
		/* Loop over all tiles which are covered by the collision box. */
		var ulTileXStart = Math.floor((tPosition[0]-ulPlayerRadiusX)/sizTileXPixels);
		var ulTileXEnd   = Math.ceil( (tPosition[0]+ulPlayerRadiusX)/sizTileXPixels);
		var ulTileYStart = Math.floor((tPosition[1]-ulPlayerRadiusY)/sizTileYPixels);
		var ulTileYEnd   = Math.ceil( (tPosition[1]+ulPlayerRadiusY)/sizTileYPixels);
		
		for(var uiY=ulTileYStart; uiY<ulTileYEnd; uiY++)
		{
			for(var uiX=ulTileXStart; uiX<ulTileXEnd; uiX++)
			{
				/* Loop over all layers at this position. */
				var sizRenderStack = atRenderStack.length;
				for(var uiLayer=0; uiLayer<sizRenderStack; uiLayer++)
				{
					var tRenderLayer = atRenderStack[uiLayer];
					
					/* No tile collision yet. */
					var fTileCollision = 0;
					
					/* Get the tile position. */
					var uiTilePos = uiX + tMapParsed.map_size_x * uiY;
					/* Get the ID of the tile. */
					var uiTileId = tRenderLayer.atTiles[uiTilePos];
					/* Get the collision maps for the tile. */
					var atColl = tMapParsed.collision[uiTileId];
					/* Does the tile have collision maps? */
					if( atColl!=null )
					{
						/* Is this collision active in this test mode? */
						if( (tCollisionTestMode==COLLISIONTEST_FALL && atColl.collision_fall==true) ||
						    (tCollisionTestMode==COLLISIONTEST_JUMP && atColl.collision_jump==true) ||
						    (tCollisionTestMode==COLLISIONTEST_WALK && atColl.collision_walk==true) ||
						    (tCollisionTestMode==COLLISIONTEST_STAND && atColl.collision_stand==true) )
						{
							/* Yes -> loop over all collition maps. */
							for(var uiCollCnt=0; uiCollCnt<atColl.maps.length; uiCollCnt++)
							{
								/* Get the current collision map. */
								var tColl = atColl.maps[uiCollCnt];
								/* Process the different collision objects. */
								if( tColl.type=='R' )
								{
									/* This is a rectangle. */
									
									/* Get the radius and center point.
									 * TODO: pre-calculate this in the collision map.
									 */
									var ulCollisionMap_RadiusX = (tColl.x1 - tColl.x0) / 2;
									var ulCollisionMap_RadiusY = (tColl.y1 - tColl.y0) / 2;
									var ulCollisionMap_CenterX = tColl.x0 + ulCollisionMap_RadiusX;
									var ulCollisionMap_CenterY = tColl.y0 + ulCollisionMap_RadiusY;
									
									/* Translate the coordinates from inside a tile to global coordinates. */
									ulCollisionMap_CenterX += uiX*sizTileXPixels;
									ulCollisionMap_CenterY += uiY*sizTileYPixels;
									
									/* Get the difference between the center points. */
									var dx = Math.abs(ulCollisionMap_CenterX - tPosition[0]);
									var dy = Math.abs(ulCollisionMap_CenterY - tPosition[1]);
									
									if( dx<(ulPlayerRadiusX+ulCollisionMap_RadiusX) && dy<(ulPlayerRadiusY+ulCollisionMap_RadiusY) )
									{
										/* Collision. */
										fTileCollision = 1;
										
										/* Does the tile have a collision action? */
										var fnAction = atColl.action;
										if( fnAction!=null )
										{
											fTileCollision = fnAction(tCollisionTestMode, uiLayer, uiTilePos);
										}
										fCollision |= fTileCollision;
										
										/* Hitting one collision map per tile is enough. :) */
										break;
									}
								}
							}
						}
					}
				}
			}
		}
		
		if( fCollision==0 )
		{
			ulNotCollidingEntries += 1;
		}
		else
		{
			/* If a collision happened, stop moving further. */
			break;
		}
	}
	
	return ulNotCollidingEntries;
}



/**
 * Create a list with positions for collision test.
 * @param {number} dStartPosition - The start position of the movement.
 * @param {number} dTotalMovement - The signed distance to move. Negative values will move to the left or up, positive to the right or down.
 */
function make_position_table(dStartPosition, dTotalMovement)
{
	var atPositions = [];
	
	/* No movement -> no points. */
	if( dTotalMovement!=0 )
	{
		/* The first movement phase is the next integer position.
		 * NOTE: If the movement is small enough, the next integer position might not be reached, so this phase is optional.
		 */
		var dAbsMovementLeft = Math.abs(dTotalMovement);
		var dCurrentPosition = dStartPosition;
		
		/* This will get the direction of the movement as -1 or 1. */
		var dMovementDirection;
		
		/* Get the distance to the next integer position. This must be a positive number. */
		var dAbsDistanceNextIntegerPos;
		if( dTotalMovement<0 )
		{
			/* Move left or up -> get the distance to the next smaller integer. */
			dAbsDistanceNextIntegerPos = dCurrentPosition - Math.floor(dCurrentPosition);
			dMovementDirection = -1.0;
		}
		else
		{
			/* Move right or down -> get the distance to the next bigger integer. */
			dAbsDistanceNextIntegerPos = Math.ceil(dCurrentPosition) - dCurrentPosition;
			dMovementDirection = 1.0;
		}
		
		/* Is the movement big enough to reach the next integer? */
		if( dAbsMovementLeft>=dAbsDistanceNextIntegerPos )
		{
			/* Move to the next integer only if the current position is not exactly on one. */
			if( dAbsDistanceNextIntegerPos>0 )
			{
				dCurrentPosition += dMovementDirection * dAbsDistanceNextIntegerPos;
				atPositions.push(dCurrentPosition);
				dAbsMovementLeft -= dAbsDistanceNextIntegerPos;
			}
			
			/* Process the next reachable integer positions. */
			while( dAbsMovementLeft>=1 )
			{
				dCurrentPosition += dMovementDirection;
				atPositions.push(dCurrentPosition);
				dAbsMovementLeft -= 1;
			}
		}
		/* Add the rest of the movement. */
		if( dAbsMovementLeft!=0 )
		{
			dCurrentPosition += dMovementDirection * dAbsMovementLeft;
			atPositions.push(dCurrentPosition);
		}
	}
	
	return atPositions;
}



function player_move_walk(dTickFraction, ucJoystickLocal)
{
	if( (ucJoystickLocal&JOYSTICKBIT_Fire)!=0 )
	{
		tPlayer.tState = PLAYERSTATE_JUMPING;
		tPlayer.tJumpState = PLAYERJUMPSTATE_UP;
		tPlayer.iJumpSpeedX = 0;
		tPlayer.uiJumpYCnt = 0;
		tPlayer.uiJumpYMax = 0;
		tPlayer.uiJumpYOffset = 0;
		tPlayer.ulJumpBasePositionY = tSpritePlayer.uiPosY;
		if( (ucJoystickLocal&JOYSTICKBIT_Left)!=0 )
		{
			tPlayer.iJumpSpeedX = -tPlayer.ulSpeedMax_JumpX;
			
			tPlayer.tCurrentAnimation = PLAYERANIMATION_JUMP_LEFT;
			tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiJumpLeft;
			tSpritePlayer.uiAnimationStepDelay = 1;
		}
		else if( (ucJoystickLocal&JOYSTICKBIT_Right)!=0 )
		{
			tPlayer.iJumpSpeedX = tPlayer.ulSpeedMax_JumpX;
			
			tPlayer.tCurrentAnimation = PLAYERANIMATION_JUMP_RIGHT;
			tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiJumpRight;
			tSpritePlayer.uiAnimationStepDelay = 1;
		}
		else
		{
			if( tPlayer.tCurrentAnimation==PLAYERANIMATION_STAND_LEFT || tPlayer.tCurrentAnimation==PLAYERANIMATION_WALK_LEFT || tPlayer.tCurrentAnimation==PLAYERANIMATION_JUMP_LEFT )
			{
				tPlayer.tCurrentAnimation = PLAYERANIMATION_JUMP_LEFT;
				tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiJumpLeft;
				tSpritePlayer.uiAnimationStepDelay = 1;
			}
			else
			{
				tPlayer.tCurrentAnimation = PLAYERANIMATION_JUMP_RIGHT;
				tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiJumpRight;
				tSpritePlayer.uiAnimationStepDelay = 1;
			}
		}
	}
	else if( (ucJoystickLocal&(JOYSTICKBIT_Left|JOYSTICKBIT_Right|JOYSTICKBIT_Up|JOYSTICKBIT_Down))==0 )
	{
		/* No movement. */
		tPlayer.ulCurrentSpeed = 0;
		
		/* Show the "standing" animation. */
		tSpritePlayer.uiAnimationTableIndex = 0;
		if( tPlayer.tCurrentAnimation==PLAYERANIMATION_WALK_LEFT || tPlayer.tCurrentAnimation==PLAYERANIMATION_JUMP_LEFT )
		{
			tPlayer.tCurrentAnimation = PLAYERANIMATION_STAND_LEFT;
			tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiStandLeft;
			tSpritePlayer.uiAnimationStepDelay = 1;
		}
		else if( tPlayer.tCurrentAnimation==PLAYERANIMATION_WALK_RIGHT || tPlayer.tCurrentAnimation==PLAYERANIMATION_JUMP_RIGHT )
		{
			tPlayer.tCurrentAnimation = PLAYERANIMATION_STAND_RIGHT;
			tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiStandRight;
			tSpritePlayer.uiAnimationStepDelay = 1;
		}
	}
	else
	{
		/* Get the new requested position. */
		var posOldX = tSpritePlayer.uiPosX;
		var posOldY = tSpritePlayer.uiPosY;
		var posNewX = posOldX;
		var posNewY = posOldY;
		
		/* Get the collision box radius for the sprite. */
		var ulPlayerCollisionBoxRadiusX = (tPlayer.tCollisionBox.x1 - tPlayer.tCollisionBox.x0)/2;
		var ulPlayerCollisionBoxRadiusY = (tPlayer.tCollisionBox.y1 - tPlayer.tCollisionBox.y0)/2;
		
		if( (ucJoystickLocal&JOYSTICKBIT_Left)!=0 )
		{
			if( tPlayer.ulCurrentSpeed<tPlayer.ulSpeedMax_Walk )
			{
				/* Increase the speed by 1 every tick. */
				tPlayer.ulCurrentSpeed += 1 * dTickFraction;
			}
			/* Do not go faster than the maximum. */
			if( tPlayer.ulCurrentSpeed>tPlayer.ulSpeedMax_Walk )
			{
				tPlayer.ulCurrentSpeed = tPlayer.ulSpeedMax_Walk;
			}
			
			var auiPositionsX = make_position_table(posOldX, -tPlayer.ulCurrentSpeed*dTickFraction);
			var sizPositionsX = auiPositionsX.length;
			var atMovement = new Array(sizPositionsX);
			for(var uiCntX=0; uiCntX<sizPositionsX; uiCntX++)
			{
				atMovement[uiCntX] = [auiPositionsX[uiCntX], posOldY];
			}
			
			/* FIXME: return null here if no movement is possible and the direct index otherwise. this saves the "-1" below. */
			var ulIdx = collision_test(ulPlayerCollisionBoxRadiusX, ulPlayerCollisionBoxRadiusY, atMovement, COLLISIONTEST_WALK);
			if( ulIdx>0 )
			{
				posNewX = atMovement[ulIdx-1][0];
				posNewY = atMovement[ulIdx-1][1];
			}
			else
			{
				/* The player collides with something at the target position,
				 * but is it possible to move up a short way?
				 *
				 * Try the positions in this way, where the X dimension depends on the current speed.
				 * The example below shows the tests for a speed of 4 pixels:
				 *
				 * 3210
				 * 7654
				 * ba98
				 * fedc
				 *
				 * This ensures 2 things:
				 *  1) X positions are tested from right to left in the way of the movement. This prevents impossible moves.
				 *  2) Y positions are tested from the highest position to the lowest. This prevents an immediate fall-down at the destination position.
				 */
				var auiPositionsY = make_position_table(posOldY-tPlayer.ulMaxStepUp-1, tPlayer.ulMaxStepUp);
				var sizPositionsY = auiPositionsY.length;
				atMovement = new Array(sizPositionsX*sizPositionsY);
				for(var uiCntY=0; uiCntY<sizPositionsY; uiCntY++)
				{
					for(var uiCntX=0; uiCntX<sizPositionsX; uiCntX++)
					{
						atMovement[uiCntY*sizPositionsX+uiCntX] = [auiPositionsX[uiCntX], auiPositionsY[uiCntY]];
					}
				}
				ulIdx = collision_test(ulPlayerCollisionBoxRadiusX, ulPlayerCollisionBoxRadiusY, atMovement, COLLISIONTEST_WALK);
				if( ulIdx>0 )
				{
					posNewX = atMovement[ulIdx-1][0];
					posNewY = atMovement[ulIdx-1][1];
				}
			}
			
			if( tPlayer.tCurrentAnimation!=PLAYERANIMATION_WALK_LEFT )
			{
				tPlayer.tCurrentAnimation = PLAYERANIMATION_WALK_LEFT;
				tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiWalkLeft;
				tSpritePlayer.uiAnimationTableIndex = 0;
			}
			tSpritePlayer.uiAnimationStepDelay = 1 + tPlayer.ulSpeedMax_Walk - tPlayer.ulCurrentSpeed;
		}
		else if( (ucJoystickLocal&JOYSTICKBIT_Right)!=0 )
		{
			if( tPlayer.ulCurrentSpeed<tPlayer.ulSpeedMax_Walk )
			{
				/* Increase the speed by 1 every tick. */
				tPlayer.ulCurrentSpeed += 1 * dTickFraction;
			}
			/* Do not go faster than the maximum. */
			if( tPlayer.ulCurrentSpeed>tPlayer.ulSpeedMax_Walk )
			{
				tPlayer.ulCurrentSpeed = tPlayer.ulSpeedMax_Walk;
			}
			
			var auiPositionsX = make_position_table(posOldX, tPlayer.ulCurrentSpeed*dTickFraction);
			var sizPositionsX = auiPositionsX.length;
			var atMovement = new Array(sizPositionsX);
			for(var uiCnt=0; uiCnt<sizPositionsX; uiCnt++)
			{
				atMovement[uiCnt] = [auiPositionsX[uiCnt], posOldY];
			}
			
			/* FIXME: return null here if no movement is possible and the direct index otherwise. this saves the "-1" below. */
			var ulIdx = collision_test(ulPlayerCollisionBoxRadiusX, ulPlayerCollisionBoxRadiusY, atMovement, COLLISIONTEST_WALK);
			if( ulIdx>0 )
			{
				posNewX = atMovement[ulIdx-1][0];
				posNewY = atMovement[ulIdx-1][1];
			}
			else
			{
				/* The player collides with something at the target position,
				 * but is it possible to move up a short way?
				 *
				 * Try the positions in this way, where the X dimension depends on the current speed.
				 * The example below shows the tests for a speed of 4 pixels:
				 *
				 * 0123
				 * 4567
				 * 89ab
				 * cdef
				 *
				 * This ensures 2 things:
				 *  1) X positions are tested from left to right in the way of the movement. This prevents impossible moves.
				 *  2) Y positions are tested from the highest position to the lowest. This prevents an immediate fall-down at the destination position.
				 */
				var auiPositionsY = make_position_table(posOldY-tPlayer.ulMaxStepUp-1, tPlayer.ulMaxStepUp);
				var sizPositionsY = auiPositionsY.length;
				atMovement = new Array(sizPositionsX*sizPositionsY);
				for(var uiCntY=0; uiCntY<sizPositionsY; uiCntY++)
				{
					for(var uiCntX=0; uiCntX<sizPositionsX; uiCntX++)
					{
						atMovement[uiCntY*sizPositionsX+uiCntX] = [auiPositionsX[uiCntX], auiPositionsY[uiCntY]];
					}
				}
				ulIdx = collision_test(ulPlayerCollisionBoxRadiusX, ulPlayerCollisionBoxRadiusY, atMovement, COLLISIONTEST_WALK);
				if( ulIdx>0 )
				{
					posNewX = atMovement[ulIdx-1][0];
					posNewY = atMovement[ulIdx-1][1];
				}
			}
			
			if( tPlayer.tCurrentAnimation!=PLAYERANIMATION_WALK_RIGHT )
			{
				tPlayer.tCurrentAnimation = PLAYERANIMATION_WALK_RIGHT;
				tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiWalkRight;
				tSpritePlayer.uiAnimationTableIndex = 0;
			}
			tSpritePlayer.uiAnimationStepDelay = 1 + tPlayer.ulSpeedMax_Walk - tPlayer.ulCurrentSpeed;
		}
		else if( (ucJoystickLocal&JOYSTICKBIT_Up)!=0 )
		{
			if( tPlayer.ulCurrentSpeed<tPlayer.ulSpeedMax_Climb )
			{
				/* Increase the speed by 1 every tick. */
				tPlayer.ulCurrentSpeed += 1 * dTickFraction;
			}
			/* Do not go faster than the maximum. */
			if( tPlayer.ulCurrentSpeed>tPlayer.ulSpeedMax_Climb )
			{
				tPlayer.ulCurrentSpeed = tPlayer.ulSpeedMax_Climb;
			}
			
			var auiPositionsY = make_position_table(posOldY, -tPlayer.ulCurrentSpeed*dTickFraction);
			var sizPositionsY = auiPositionsY.length;
			var atMovement = new Array(sizPositionsY);
			for(var uiCnt=0; uiCnt<sizPositionsY; uiCnt++)
			{
				atMovement[uiCnt] = [posOldX, auiPositionsY[uiCnt]];
			}
			
			var ulIdx = collision_test(ulPlayerCollisionBoxRadiusX, ulPlayerCollisionBoxRadiusY, atMovement, COLLISIONTEST_WALK);
			if( ulIdx>0 )
			{
				posNewX = atMovement[ulIdx-1][0];
				posNewY = atMovement[ulIdx-1][1];
				
				/* Test if the player can stand at the new position. */
				var ulFallDown = test_fall_down(posNewX, posNewY, posOldY-posNewY);
				if( ulFallDown>0 )
				{
					posNewY += ulFallDown;
				}
			}
			
			if( tPlayer.tCurrentAnimation!=PLAYERANIMATION_CLIMBING )
			{
				tPlayer.tCurrentAnimation = PLAYERANIMATION_CLIMBING;
				tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiClimbing;
				tSpritePlayer.uiAnimationTableIndex = 0;
				tSpritePlayer.uiAnimationStepDelay = 3;
			}
		}
		else if( (ucJoystickLocal&JOYSTICKBIT_Down)!=0 )
		{
			if( tPlayer.ulCurrentSpeed<tPlayer.ulSpeedMax_Climb )
			{
				/* Increase the speed by 1 every tick. */
				tPlayer.ulCurrentSpeed += 1 * dTickFraction;
			}
			/* Do not go faster than the maximum. */
			if( tPlayer.ulCurrentSpeed>tPlayer.ulSpeedMax_Climb )
			{
				tPlayer.ulCurrentSpeed = tPlayer.ulSpeedMax_Climb;
			}
			
			var auiPositionsY = make_position_table(posOldY, tPlayer.ulCurrentSpeed*dTickFraction);
			var sizPositionsY = auiPositionsY.length;
			var atMovement = new Array(sizPositionsY);
			for(var uiCnt=0; uiCnt<sizPositionsY; uiCnt++)
			{
				atMovement[uiCnt] = [posOldX, auiPositionsY[uiCnt]];
			}
			
			var ulIdx = collision_test(ulPlayerCollisionBoxRadiusX, ulPlayerCollisionBoxRadiusY, atMovement, COLLISIONTEST_WALK);
			if( ulIdx>0 )
			{
				posNewX = atMovement[ulIdx-1][0];
				posNewY = atMovement[ulIdx-1][1];
			}
			
			if( tPlayer.tCurrentAnimation!=PLAYERANIMATION_CLIMBING )
			{
				tPlayer.tCurrentAnimation = PLAYERANIMATION_CLIMBING;
				tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiClimbing;
				tSpritePlayer.uiAnimationTableIndex = 0;
				tSpritePlayer.uiAnimationStepDelay = 3;
			}
		}
		
		tSpritePlayer.uiPosX = posNewX;
		tSpritePlayer.uiPosY = posNewY;
	}
}



function test_fall_down(ulPosX, ulPosY, ulMaxSpeed)
{
	/* This is the number of pixels falling down. 0 means no falling down. */
	var ulFallingDown = 0;
	
	/* Get the collision box for one line of floor below the sprite. */
	var ulPlayerFloorBoxRadiusX = (tPlayer.tCollisionBox.x1 - tPlayer.tCollisionBox.x0)/2;
	var ulPlayerFloorBoxRadiuxY = 0.5;
	
	/* The usual position is at the center of the sprite. For the fall-down test move the test point to the bottom of the sprite. */
	var ulFloorBoxPosY = ulPosY + (tPlayer.tCollisionBox.y1 - tPlayer.tCollisionBox.y0)/2;
	
	/* Is at least one line of ground below the player? */
	var auiPositionsY = make_position_table(ulFloorBoxPosY, ulMaxSpeed);
	var sizPositionsY = auiPositionsY.length;
	var atMovement = new Array(sizPositionsY);
	for(var uiCnt=0; uiCnt<sizPositionsY; uiCnt++)
	{
		atMovement[uiCnt] = [ulPosX, auiPositionsY[uiCnt]];
	}
	
	var ulIdx = collision_test(ulPlayerFloorBoxRadiusX, ulPlayerFloorBoxRadiuxY, atMovement, COLLISIONTEST_STAND);
	if( ulIdx>0 )
	{
		/* The player can not stand there, but can it fall through?
		 * NOTE: this is important for getting gold when falling down.
		 */
		ulIdx = collision_test(ulPlayerFloorBoxRadiusX, ulPlayerFloorBoxRadiuxY, atMovement, COLLISIONTEST_FALL);
		if( ulIdx>0 )
		{
			ulFallingDown = atMovement[ulIdx-1][1] - ulFloorBoxPosY;
		}
	}
	
	return ulFallingDown;
}



function player_jump(dTickFraction, ucJoystickLocal)
{
	/* Get the current position. */
	var posOldX = tSpritePlayer.uiPosX;
	var posOldY = tSpritePlayer.uiPosY;
	var posNewX;
	var posNewY;
	
	/* Get the collision box radius for the sprite. */
	var ulPlayerCollisionBoxRadiusX = (tPlayer.tCollisionBox.x1 - tPlayer.tCollisionBox.x0)/2;
	var ulPlayerCollisionBoxRadiusY = (tPlayer.tCollisionBox.y1 - tPlayer.tCollisionBox.y0)/2;
	
	/* THe jump speed is 1 Y unit per tick.
	 * The availabe amount of ticks might start in the up phase and end in the down phase.
	 */
	var dJumpSpeedLeft = dTickFraction;
	
	/* Is the jump going up? */
	if( tPlayer.tJumpState==PLAYERJUMPSTATE_UP )
	{
		/* Is the fire button still pressed? */
		if( (ucJoystickLocal&JOYSTICKBIT_Fire)!=0 )
		{
			/* Yes -> continue to jump. */
			
			/* Get the part of the jump which still goes up. */
			var dChunkJumpSpeed = dJumpSpeedLeft;
			if( (tPlayer.uiJumpYCnt+dChunkJumpSpeed)>12 )
			{
				dChunkJumpSpeed = 12 - tPlayer.uiJumpYCnt;
			}
			tPlayer.uiJumpYCnt += dChunkJumpSpeed;
			dJumpSpeedLeft -= dChunkJumpSpeed;
			
			/* Get the new movements for X and Y. */
			var ulMovementX = tPlayer.iJumpSpeedX * dChunkJumpSpeed;
			var ulMovementY = tPlayer.ulJumpBasePositionY - (48*48-(tPlayer.uiJumpYCnt*4-48)*(tPlayer.uiJumpYCnt*4-48))/48 - posOldY;
			
			if( ulMovementY!=0 )
			{
				/* Get the X movement per Y pixel. Y is always negative here, so the value must be negated to get the correct direction. */
				var ulMovementDx = -ulMovementX/ulMovementY;
				
				/* Create the movement list for the Y part. */
				var auiPositionsY = make_position_table(posOldY, ulMovementY);
				var sizPositionsY = auiPositionsY.length;
				var atMovement = new Array(sizPositionsY);
				for(var uiCnt=0; uiCnt<sizPositionsY; uiCnt++)
				{
					/* This is the current Y position in the movement table. */
					var ulPosY = auiPositionsY[uiCnt];
					/* Get the distance of the entry in the movement table from the old Y position. */
					var ulDistanceY = posOldY - ulPosY;
					var ulPosX = posOldX + ulDistanceY * ulMovementDx;
					atMovement[uiCnt] = [ulPosX, ulPosY];
				}
				
				var ulIdx = collision_test(ulPlayerCollisionBoxRadiusX, ulPlayerCollisionBoxRadiusY, atMovement, COLLISIONTEST_JUMP);
				if( ulIdx==atMovement.length )
				{
					/* No collision. Move the complete way. */
					posNewX = atMovement[ulIdx-1][0];
					posNewY = atMovement[ulIdx-1][1];
					
					/* Finished going up? */
					if( tPlayer.uiJumpYCnt>=12 )
					{
						/* Yes, end of table reached. Move down from now on. */
						tPlayer.tJumpState = PLAYERJUMPSTATE_DOWN;
						tPlayer.uiJumpYMax = tPlayer.uiJumpYCnt + 4;
						tPlayer.uiJumpYCnt = 0;
						tPlayer.uiJumpYOffset = 0;
						tPlayer.ulFallingHeight = 0;
					}
				}
				else
				{
					/* Collision! Move as far as possible. */
					if( ulIdx>0 )
					{
						posNewX = atMovement[ulIdx-1][0];
						posNewY = atMovement[ulIdx-1][1];
					}
					else
					{
						posNewX = posOldX;
						posNewY = posOldY;
					}
					
					/* Start falling from here. */
					tPlayer.tState = PLAYERSTATE_FALLING;
					tPlayer.ulFallingHeight = 0;
				}
			}
			else
			{
				/* The Y movement is 0. */
				posNewX = posOldX;
				posNewY = posOldY;
				
				/* Finished going up? */
				if( tPlayer.uiJumpYCnt>=12 )
				{
					/* Yes, end of table reached. Move down from now on. */
					tPlayer.tJumpState = PLAYERJUMPSTATE_DOWN;
					tPlayer.uiJumpYMax = tPlayer.uiJumpYCnt + 4;
					tPlayer.uiJumpYCnt = 0;
					tPlayer.uiJumpYOffset = 0;
					tPlayer.ulFallingHeight = 0;
				}
			}
		}
		else
		{
			/* The fire button is no longer pressed. The jump goes down from here on. */
			posNewX = posOldX;
			posNewY = posOldY;
			
			tPlayer.tJumpState = PLAYERJUMPSTATE_DOWN;
			tPlayer.uiJumpYMax = tPlayer.uiJumpYCnt + 4;
			tPlayer.uiJumpYCnt = 0;
			/* The complete jump would be 48 pixels high.
			 * Check how many pixels were already moved, then get the difference to the complete move of 48 pixels.
			 * This is the offset for the next part which is going down. It uses the same formula as here so without this offset, it would always start at 48.
			 */
			tPlayer.uiJumpYOffset = 48 - (tPlayer.ulJumpBasePositionY - posOldY);
			tPlayer.ulFallingHeight = 0;
		}
	}
	
	if( tPlayer.tJumpState==PLAYERJUMPSTATE_DOWN && dJumpSpeedLeft>0)
	{
		/* The jump is going down. */
		
		/* Is at least one line of ground below the player? */
		var ulFallingDown = test_fall_down(posOldX, posOldY, 1);
		if( ulFallingDown==0 )
		{
			/* Yes -> stop jumping here. */
			posNewX = posOldX;
			posNewY = posOldY;
			
			tPlayer.tState = PLAYERSTATE_WALKING;
			/* NOTE: no need to check the height here. The jump table did not yet finish, so it is OK. */
		}
		else
		{
			/* Limit the jump to the . */
			var dChunkJumpSpeed = dJumpSpeedLeft;
			if( (tPlayer.uiJumpYCnt+dChunkJumpSpeed)>tPlayer.uiJumpYMax )
			{
				dChunkJumpSpeed = tPlayer.uiJumpYMax - tPlayer.uiJumpYCnt;
			}
			tPlayer.uiJumpYCnt += dChunkJumpSpeed;
			dJumpSpeedLeft -= dChunkJumpSpeed;
			
			/* Get the new movements for X and Y. */
			var ulMovementX = tPlayer.iJumpSpeedX * dChunkJumpSpeed;
			var ulMovementY = tPlayer.ulJumpBasePositionY - (48*48-(tPlayer.uiJumpYCnt*4)*(tPlayer.uiJumpYCnt*4))/48 + tPlayer.uiJumpYOffset - posOldY;
			
			if( ulMovementY!=0 )
			{
				/* Get the X movement per Y pixel. Y is always negative here, so the value must be negated to get the correct direction. */
				var ulMovementDx = -ulMovementX/ulMovementY;
				
				/* Create the movement list for the Y part. */
				var auiPositionsY = make_position_table(posOldY, ulMovementY);
				var sizPositionsY = auiPositionsY.length;
				var atMovement = new Array(sizPositionsY);
				for(var uiCnt=0; uiCnt<sizPositionsY; uiCnt++)
				{
					/* This is the current Y position in the movement table. */
					var ulPosY = auiPositionsY[uiCnt];
					/* Get the distance of the entry in the movement table from the old Y position. */
					var ulDistanceY = posOldY - ulPosY;
					var ulPosX = posOldX + ulDistanceY * ulMovementDx;
					atMovement[uiCnt] = [ulPosX, ulPosY];
				}
				
				var ulIdx = collision_test(ulPlayerCollisionBoxRadiusX, ulPlayerCollisionBoxRadiusY, atMovement, COLLISIONTEST_JUMP);
				if( ulIdx==atMovement.length )
				{
					/* No collision. Move the complete way. */
					posNewX = atMovement[ulIdx-1][0];
					posNewY = atMovement[ulIdx-1][1];
					
					/* Finished going down? */
					if( tPlayer.uiJumpYCnt>=tPlayer.uiJumpYMax )
					{
						/* Yes, end of table reached. Fall down from now on. */
						tPlayer.tState = PLAYERSTATE_FALLING;
						/* NOTE: no need to check the height here. The jump table did not yet finish, so it is OK. */
					}
				}
				else
				{
					/* Collision! Move as far as possible. */
					if( ulIdx>0 )
					{
						posNewX = atMovement[ulIdx-1][0];
						posNewY = atMovement[ulIdx-1][1];
					}
					else
					{
						posNewX = posOldX;
						posNewY = posOldY;
					}
					
					/* Start walking from here. */
					tPlayer.tState = PLAYERSTATE_WALKING;
					/* NOTE: no need to check the height here. The jump table did not yet finish, so it is OK. */
				}
			}
			else
			{
				posNewX = posOldX;
				posNewY = posOldY;
				
				/* Finished going down? */
				if( tPlayer.uiJumpYCnt>=tPlayer.uiJumpYMax )
				{
					/* Yes, end of table reached. Fall down from now on. */
					tPlayer.tState = PLAYERSTATE_FALLING;
					/* NOTE: no need to check the height here. The jump table did not yet finish, so it is OK. */
				}
			}
		}
	}
	
	tSpritePlayer.uiPosX = posNewX;
	tSpritePlayer.uiPosY = posNewY;
}



function fill_room_mask(tRoom, tIsVisible)
{
	if( tIsVisible==true )
	{
		if( tRoom.atBitmap==null )
		{
			var ulRoomSizeX = tRoom.ulX1 - tRoom.ulX0;
			var ulRoomSizeY = tRoom.ulY1 - tRoom.ulY0;
			tMask.tContext.clearRect(tRoom.ulX0, tRoom.ulY0, ulRoomSizeX, ulRoomSizeY);
		}
		else
		{
			/* NOTE: Do not use putImageData here. This would overwrite other visible rooms. */
			var tMaskCanvas = tRoom.atBitmap.tCanvas;
			tMask.tContext.globalCompositeOperation = 'destination-out';
			tMask.tContext.drawImage(tMaskCanvas, tRoom.ulX0, tRoom.ulY0);
			tMask.tContext.globalCompositeOperation = 'source-over';
		}
	}
	else
	{
		/* NOTE: the fill style is still "#000000". */
		var ulRoomSizeX = tRoom.ulX1 - tRoom.ulX0;
		var ulRoomSizeY = tRoom.ulY1 - tRoom.ulY0;
		tMask.tContext.fillRect(tRoom.ulX0, tRoom.ulY0, ulRoomSizeX, ulRoomSizeY);
	}
}



function rooms_get_active()
{
	/* Collect all current active rooms in this array. */
	var atRoomsNowActive = [];
	var atRoomsNowInactive = [];
	/* A flag for chenges. */
	var bHaveChanges = false;
	
	/* Get the player's tile position. */
	var ulPlayerTilePositionX = Math.floor(tSpritePlayer.uiPosX / sizTileXPixels);
	var ulPlayerTilePositionY = Math.floor(tSpritePlayer.uiPosY / sizTileYPixels);
	
	/* Loop over all rooms. If ther player is inside the room, add it to the "now active" rooms. */
	for(var uiRoomIdx=0; uiRoomIdx<atRooms.length; uiRoomIdx++)
	{
		var tRoom = atRooms[uiRoomIdx];
		
		/* Is the player position in the room?
		 * NOTE: this works for rectangle and polyline rooms as both have a bounding box.
		 */
		if( ulPlayerTilePositionX>=tRoom.ulX0 && ulPlayerTilePositionX<=tRoom.ulX1 && ulPlayerTilePositionY>=tRoom.ulY0 && ulPlayerTilePositionY<=tRoom.ulY1 )
		{
			/* The player is inside the bounding box.
			 * If the room has a bitmap, it must be checked too.
			 */
			var fRoomIsActive = false;
			
			/* Is this a room with a bitmap? */
			if( tRoom.atBitmap==null )
			{
				/* No, this room is a simple rectangle. */
				fRoomIsActive = true;
			}
			else
			{
				/* This is a polyline room. */
				
				/* Get the tile offset in the bounding box. */
				var ulX = ulPlayerTilePositionX - tRoom.ulX0;
				var ulY = ulPlayerTilePositionY - tRoom.ulY0;
				var ulByteOffset = Math.floor(ulX/8) + ulY*Math.ceil((tRoom.ulX1-tRoom.ulX0)/8);
				var ucByte = tRoom.atBitmap.aucBitmap[ulByteOffset];
				var ucMask = 1 << (ulX&7);
				if( (ucByte & ucMask)!=0 )
				{
					fRoomIsActive = true;
				}
			}
			
			if( fRoomIsActive==true )
			{
				/* Is the room part of the old rooms? */
				if( atRoomsActive.indexOf(tRoom)==-1 )
				{
					/* No -> this is a new room. */
					bHaveChanges = true;
				}
				atRoomsNowActive.push(tRoom);
			}
		}
	}
	
	/* Look for old rooms. These are rooms which are part of the "active" array, but not part of the "now active". */
	for(var uiRoomIdx=0; uiRoomIdx<atRoomsActive.length; uiRoomIdx++)
	{
		var tRoom = atRoomsActive[uiRoomIdx];
		if( atRoomsNowActive.indexOf(tRoom)==-1 )
		{
			bHaveChanges = true;
			atRoomsNowInactive.push(tRoom);
		}
	}
	
	/* Did the visibility of the rooms change? */
	if( bHaveChanges==true )
	{
		/* There are new active rooms. */
		atRoomsActive = atRoomsNowActive;
		
		/* First make all rooms invisible which became inactive. */
		for(var uiRoomIdx=0; uiRoomIdx<atRoomsNowInactive.length; uiRoomIdx++)
		{
//			window.console.log("Leaving room:"+atRoomsNowInactive[uiRoomIdx].strName);
			/* Make all tiles of the room invisible. */
			fill_room_mask(atRoomsNowInactive[uiRoomIdx], false);
		}
		
		/* Then redraw the mask for all active rooms.
		 * NOTE: it is not enough to make the new rooms visible as the
		 *       regions of the rooms overlap. If one or more room
		 *       became invisible, it destroyed the visibility of
		 *       rooms next to them.
		 */
		for(var uiRoomIdx=0; uiRoomIdx<atRoomsActive.length; uiRoomIdx++)
		{
//			window.console.log("Entering room:"+atRoomsActive[uiRoomIdx].strName);
			/* Make all tiles of the room visible. */
			fill_room_mask(atRoomsActive[uiRoomIdx], true);
		}
	}
}



function sprite_animations(dTickFraction)
{
	/* Loop over all sprites. */
	var sizSprites = atSprites.length;
	for(var uiSpriteIdx=0; uiSpriteIdx<sizSprites; uiSpriteIdx++)
	{
		var ptSprite = atSprites[uiSpriteIdx];
		
		/* Is the sprite active? */
		if( ptSprite.fActive==true )
		{
			var dTickFractionsLeft = dTickFraction;
			
			while( dTickFractionsLeft>0.0 )
			{
				var dTickFractionsChunk = dTickFractionsLeft;
				
				/* Is a delay active? */
				if( ptSprite.uiAnimationStepDelayCnt<ptSprite.uiAnimationStepDelay )
				{
					/* Limit the tick fraction chunk by the rest of the delay. */
					if( ptSprite.uiAnimationStepDelayCnt+dTickFractionsChunk>ptSprite.uiAnimationStepDelay )
					{
						dTickFractionsChunk = ptSprite.uiAnimationStepDelay - ptSprite.uiAnimationStepDelayCnt;
					}
					
					ptSprite.uiAnimationStepDelayCnt += dTickFractionsChunk;
				}
				dTickFractionsLeft -= dTickFractionsChunk;
				
				if( ptSprite.uiAnimationStepDelayCnt>=ptSprite.uiAnimationStepDelay )
				{
					/* Reset the step delay counter. */
					ptSprite.uiAnimationStepDelayCnt = 0;
					
					/* Get the next position. */
					var uiPosition = ptSprite.uiAnimationTableIndex + 1;
					/* Does the new position exceed the table? */
					if( uiPosition>=ptSprite.auiAnimation.length )
					{
						/* Yes -> go back to the first element in the list. */
						uiPosition = 0;
					}
					ptSprite.uiAnimationTableIndex = uiPosition;
					
					/* Get the new sprite index. */
					var uiNewSpriteIndex = ptSprite.auiAnimation[uiPosition];
					
					/* Does the new sprite differ from the last one? */
					if( uiNewSpriteIndex!=ptSprite.uiAnimationSpriteIndex )
					{
						ptSprite.uiAnimationSpriteIndex = uiNewSpriteIndex;
						
						/* Draw the animation to the sprite buffer. */
						var tCtx = ptSprite.tContext;
						tCtx.putImageData(ptSprite.atAnimationSprites[uiNewSpriteIndex],0,0);
					}
				}
			}
		}
	}
}



function life_lost_animation(dTickFraction)
{
	/* Move the angel up until it is not visible anymore. */
	
	/* The speed should be 4 Pixels in one tick. */
	var dSpeed = 4.0 * dTickFraction;
	
	/* Move the angel up. */
	var uiPosY = tSpritePlayerAngel.uiPosY - dSpeed;
	
	/* Is is one tile out of the screen window? */
	if( uiPosY<(ulCameraY-sizTileYPixels) )
	{
		/* The animation has finished. */
		
		/* Is one or more lifes left? */
		if( tPlayer.uiNumberOfLifesLeft>1 )
		{
			tPlayer.uiNumberOfLifesLeft--;
			level_restart();
		}
		else
		{
			tState = STATE_GAME_OVER;
			
			/* Clear the complete screen. */
			tScreenCtx.fillRect(0, 0, sizScreenSizeXTiles*sizTileXPixels, sizScreenSizeYTiles*sizTileYPixels);
			/* Display the "game over" text. */
			/* FIXME: center this! */
			tScreenCtx.strokeText("Game over!", 100, 100);
		}
	}
	else
	{
		tSpritePlayerAngel.uiPosY = uiPosY;
	}
}



function player_move(dTickFraction, ucJoystickLocal)
{
	/* Check the current player state. */
	if( tPlayer.tState==PLAYERSTATE_WALKING )
	{
		/* Test if the player stands on solid ground. */
		var dSpeedMaxFalldownScaled = tPlayer.ulSpeedMax_FallDown * dTickFraction;
		var ulFallingDown = test_fall_down(tSpritePlayer.uiPosX, tSpritePlayer.uiPosY, dSpeedMaxFalldownScaled);
		if( ulFallingDown!=0 )
		{
			tSpritePlayer.uiPosY += ulFallingDown;
			tPlayer.tState = PLAYERSTATE_FALLING;
			tPlayer.ulFallingHeight = ulFallingDown;
		}
		else
		{
			/* Move the player. */
			player_move_walk(dTickFraction, ucJoystickLocal);
		}
	}
	else if( tPlayer.tState==PLAYERSTATE_FALLING )
	{
		/* Test if the player is still falling. */
		
		/* Get the maximum possible falling speed for the elapsed time. */
		var dSpeedMaxFalldownScaled = tPlayer.ulSpeedMax_FallDown * dTickFraction;
		var dFallingDown = test_fall_down(tSpritePlayer.uiPosX, tSpritePlayer.uiPosY, dSpeedMaxFalldownScaled);
		if( dFallingDown!=0 )
		{
			/* Yes, the player is still falling. */
			tSpritePlayer.uiPosY += dFallingDown;
			tPlayer.ulFallingHeight += dFallingDown;
		}
		else
		{
			/* No, the player hit the ground. */
			tPlayer.ulJumpBasePositionY = -1;
			
			/* Did the height exceed the allowed maximum?  */
			if( tPlayer.ulFallingHeight>tPlayer.ulMaxFallingHeight )
			{
				/* Yes, this was too high. */
				player_looses_life();
			}
			else
			{
				tPlayer.tState = PLAYERSTATE_WALKING;
			}
		}
	}
	else if( tPlayer.tState==PLAYERSTATE_JUMPING )
	{
		player_jump(dTickFraction, ucJoystickLocal);
	}
	else if( tPlayer.tState==PLAYERSTATE_LIFELOST )
	{
		life_lost_animation(dTickFraction);
	}
}



function timer_loop()
{
	/* Request to be called before the next repaint. */
	if( tState!=STATE_PAUSE )
	{
		window.requestAnimationFrame(timer_loop);
	}
	
	/* Rendering starts here. Measure the time. */
	var time_start = Date.now();
	
	if( ulLastRenderTime!=0 )
	{
		/* Get the number of miliseconds passed since the last rendering. */
		var ulRenderDelta = time_start - ulLastRenderTime;
		/* Convert the passed miliseconds to tick fractions, where one tick is 40ms. */
		var dTickFraction = ulRenderDelta / 40;
		
		if( tState==STATE_PLAYING )
		{
			if( fRequestPause==true )
			{
				/* Change the state. */
				tState = STATE_PAUSE;
				
				/* Show the "PAUSED" image. For now this is a simple text. */
				for(var uiCnt=0; uiCnt<10; uiCnt++)
				{
					tScreenCtx.strokeText("PAUSED", 160+16*uiCnt, 160+16*uiCnt);
				}
				
				/* The pause request was processed. */
				fRequestPause = false;
			}
			else
			{
				player_move(dTickFraction, ucJoystick);
				
				/* Test for the end position. */
				var uiPlayerTilePosX = Math.floor(tSpritePlayer.uiPosX/sizTileXPixels);
				var uiPlayerTilePosY = Math.floor(tSpritePlayer.uiPosY/sizTileYPixels);
				var uiPlayerTilePos = uiPlayerTilePosX + tMapParsed.map_size_x * uiPlayerTilePosY;
				if( uiPlayerTilePos==tMapParsed.uiFinishPos )
				{
					tState = STATE_FINISH;
				}
				else
				{
					for(var uiPos in tMapParsed.atRespawn)
					{
						if( uiPos==uiPlayerTilePos )
						{
							/* Replace the start position. */
							tMapParsed.atStartPositions[0].x = uiPlayerTilePosX;
							tMapParsed.atStartPositions[0].y = uiPlayerTilePosY;
						}
					}
				}
				
				/* Sprite animation. */
				sprite_animations(dTickFraction);
				
				/* Move the camera. */
				camera_move();
				
				/* Open and close rooms. */
				rooms_get_active();
				
				/* Move the animation. */
				animations_step(dTickFraction);
				refresh_map();
			}
		}
		else if(tState==STATE_GAME_OVER )
		{
			/* TODO: Move on to the main menu after a short delay. */
			/* Show the "GAME OVER" image. For now this is a simple text. */
			for(var uiCnt=0; uiCnt<10; uiCnt++)
			{
				tScreenCtx.strokeText("GAME OVER", 160+16*uiCnt, 160+16*uiCnt);
			}
		}
		else if( tState==STATE_FINISH )
		{
			/* Move to the left and keep the camera fixed. */
			player_move(dTickFraction, JOYSTICKBIT_Left);

			/* Sprite animation. */
			sprite_animations(dTickFraction);

			/* Move the animation. */
			animations_step(dTickFraction);
			refresh_map();

			/* Display the finish text. */
			tScreenCtx.strokeText("You escaped the tomb.", 200, 160);
			tScreenCtx.strokeText("Krun is free now.", 215, 200);
		}
	}
	
	/* Remember the milisecond timer at the beginning of this rendering. */
	ulLastRenderTime = time_start;
	
	var time_used = Date.now() - time_start;
	tScreenCtx.fillRect(0, sizScreenSizeYTiles*sizTileYPixels, sizScreenSizeXTiles*sizTileXPixels, 10);
	var strMsg = time_used.toString(10);
	tScreenCtx.strokeText(strMsg, 10, sizScreenSizeYTiles*sizTileYPixels+10);

	var strMsgLifesLeft = "Lifes left: " + tPlayer.uiNumberOfLifesLeft.toString(10);
	tScreenCtx.strokeText(strMsgLifesLeft, (sizScreenSizeXTiles*sizTileXPixels)/2, sizScreenSizeYTiles*sizTileYPixels+10);
}



function create_image_data(aucData, sizXPixels, sizYPixels)
{
	/* Create a new empty image data object. */
	var tImgData = tScreenCtx.createImageData(sizXPixels, sizYPixels);
	
	/* Copy the data to the image data. */
	for(var uiCnt=0; uiCnt<sizXPixels*sizYPixels*4; uiCnt++)
	{
		tImgData.data[uiCnt] = aucData[uiCnt]
	}
	
	return tImgData;
}



function loader_callback_initialize_map(tLoader)
{
	/* Get the JSON data. */
	var tMapJson = tLoader.get_current_response();
	
	/* Initialize the parsed map. */
	tMapParsed = [];
	
	/* Copy some values from the JSON map to the optimized map. */
	tMapParsed.map_size_x = tMapJson['map_size_x']
	tMapParsed.map_size_y = tMapJson['map_size_y'];
	
	/* Decode all layers. */
	atLayers = [];
	for(var strLayerName in tMapJson['layers'])
	{
		atLayers[strLayerName] = base64_to_uint8array(tMapJson['layers'][strLayerName]);
	}
	
	/* Decode all rooms. */
	atRooms = new Array(tMapJson['rooms'].length);
	var atRoomsJson = tMapJson['rooms'];
	for(var uiCnt=0; uiCnt<tMapJson['rooms'].length; uiCnt++)
	{
		var tRoom = [];
		tRoom.strName  = atRoomsJson[uiCnt]['name'];
		tRoom.ulX0     = atRoomsJson[uiCnt]['x0'];
		tRoom.ulY0     = atRoomsJson[uiCnt]['y0'];
		tRoom.ulX1     = atRoomsJson[uiCnt]['x1'];
		tRoom.ulY1     = atRoomsJson[uiCnt]['y1'];
		
		var strBitmap = atRoomsJson[uiCnt]['bitmap'];
		if( strBitmap==null )
		{
			tRoom.atBitmap = null;
		}
		else
		{
			var tBitmap = base64_to_uint8array(strBitmap);
			
			var uiMaskSizeX = tRoom.ulX1 - tRoom.ulX0;
			var uiMaskSizeY = tRoom.ulY1 - tRoom.ulY0;
			
			var tCanvas = document.createElement("canvas");
			tCanvas.width  = uiMaskSizeX;
			tCanvas.height = uiMaskSizeY;
			
			/* Loop over all bits in the array and set a transparent or black pixel in the image data. */
			var tImgData = tScreenCtx.createImageData(tCanvas.width, tCanvas.height);
			for(var uiMaskX=0; uiMaskX<uiMaskSizeX; uiMaskX++)
			{
				for(var uiMaskY=0; uiMaskY<uiMaskSizeY; uiMaskY++)
				{
					/* The tile is visible if the bit is set.
					 * This mask is combined with 'destination-out' because this way there is no need for clipping.
					 * With the 'destination-out', pixels are kept which are transparent in the mask.
					 */
					var uiByteOffset = Math.floor(uiMaskX/8) + uiMaskY*Math.ceil(uiMaskSizeX/8);
					var uiBitMask = 1 << (uiMaskX & 7);
					var uiImgDataOffset = (uiMaskX + uiMaskY*uiMaskSizeX) * 4;
					if( (tBitmap[uiByteOffset]&uiBitMask)==0 )
					{
						tImgData.data[uiImgDataOffset + 0] = 0x00;
						tImgData.data[uiImgDataOffset + 1] = 0x00;
						tImgData.data[uiImgDataOffset + 2] = 0x00;
						tImgData.data[uiImgDataOffset + 3] = 0x00;
					}
					else
					{
						tImgData.data[uiImgDataOffset + 0] = 0x00;
						tImgData.data[uiImgDataOffset + 1] = 0x00;
						tImgData.data[uiImgDataOffset + 2] = 0x00;
						tImgData.data[uiImgDataOffset + 3] = 0xff;
					}
				}
			}
			
			/* Draw the image data to the canvas. */
			var tCtx = tCanvas.getContext("2d");
			tCtx.putImageData(tImgData, 0, 0);
			
			/* Set the canvas, context and bitmap mask. */
			tRoom.atBitmap = [];
			tRoom.atBitmap.tCanvas = tCanvas;
			tRoom.atBitmap.aucBitmap = tBitmap;
		}
		atRooms[uiCnt] = tRoom;
	}
	
	/* Decode all tiles. */
	atTiles = new Array(tMapJson['tiles'].length);
	for(var uiCnt=0; uiCnt<tMapJson['tiles'].length; uiCnt++)
	{
		atTiles[uiCnt] = create_image_data(base64_to_uint8array(tMapJson['tiles'][uiCnt]), sizTileXPixels, sizTileYPixels);
	}

	/* Read all named tiles. */
	atNamedTiles = [];
	for(var strTileID in tMapJson['named_tiles'])
	{
		var ulTileIdx = tMapJson['named_tiles'][strTileID];
		atNamedTiles[strTileID] = ulTileIdx;
	}

	/* Read all animations. */
	atAnimationsAll = [];
	for(var uiIdx in tMapJson['anims'])
	{
		var tAnimJson = tMapJson['anims'][uiIdx];
		var tStepsJson = tAnimJson['steps'];
		var tAnim = {};
		/* Initialize the current tile index with the first entry. */
		tAnim.uiCurrentTileIndex = tStepsJson[0][0];
		/* Copy all steps. */
		var atSteps = [];
		var sizSteps = tStepsJson.length;
		for(var uiStepIdx=0; uiStepIdx<sizSteps; uiStepIdx++)
		{
			var tStep = {};
			tStep.uiTileIndex = tStepsJson[uiStepIdx][0];
			tStep.uiDelay     = tStepsJson[uiStepIdx][1];
			atSteps.push(tStep);
		}
		tAnim.atSteps       = atSteps;
		tAnim.dCurrentDelay = 0.0;
		tAnim.uiCurrentStep = 0;
		tAnim.fIsOneshot    = Boolean(tAnimJson['fIsOneshot']);
		var fnAction = null;
		var strAction = tAnimJson['fnCallbackEnd'];
		if( strAction!=null && strAction!='' )
		{
			fnAction = atAnimationEndFunctions[strAction];
			if( fnAction==null )
			{
				window.alert("Error in level data! Unknown animation end action:"+strAction);
			}
		}
		tAnim.fnCallbackEnd = fnAction;

		atAnimationsAll[uiIdx] = tAnim;
	}

	/* Read all collision maps. */
	tMapParsed.collision = [];
	for(var uiIdx in tMapJson['collision'])
	{
		/* Get the collision source. */
		var tCollision = tMapJson['collision'][uiIdx];
		
		/* Get the action and the corresponding function. */
		var fnAction = null;
		var strAction = tCollision['action'];
		  if( strAction!=null && strAction!='' )
		{
			fnAction = atCollisionFunctions[strAction];
			if( fnAction==null )
			{
				window.alert("Error in level data! Unknown action:"+strAction);
			}
		}
		
		/* Read all maps. */
		var atMaps = Array(tCollision['maps'].length);
		for(var uiCnt=0; uiCnt<tCollision['maps'].length; uiCnt++)
		{
			var atMapParsed = [];
			var tColl = tCollision['maps'][uiCnt];
			atMapParsed.type = tColl[0];
			atMapParsed.x0   = tColl[1];
			atMapParsed.y0   = tColl[2];
			atMapParsed.x1   = tColl[3];
			atMapParsed.y1   = tColl[4];
			
			atMaps[uiCnt] = atMapParsed;
		}
		
		/* Create a new collision map for the tile. */
		var atColl = [];
		atColl.action = fnAction;
		atColl.maps   = atMaps;
		atColl.collision_fall  = tCollision['collision_fall']
		atColl.collision_jump  = tCollision['collision_jump']
		atColl.collision_stand = tCollision['collision_stand']
		atColl.collision_walk  = tCollision['collision_walk']
		tMapParsed.collision[uiIdx] = atColl;
	}
	
	/* Copy all start positions. */
	tMapParsed.atStartPositions = [];
	for(var uiCnt=0; uiCnt<tMapJson.start.length; uiCnt++)
	{
		var atPos = [];
		atPos.x = tMapJson.start[uiCnt][0];
		atPos.y = tMapJson.start[uiCnt][1];
		tMapParsed.atStartPositions.push(atPos);
	}
	
	/* Copy the action point. */
	tMapParsed.uiFinishPos = tMapJson['action'][0];
	
	/* Copy all gold positions. */
	tMapParsed.atGold2Target = [];
	for(var uiGoldPos in tMapJson['gold2target'])
	{
		var uiTargetPos = tMapJson['gold2target'][uiGoldPos];
		tMapParsed.atGold2Target[uiGoldPos] = uiTargetPos;
	}
	
	/* Copy all switch positions. */
	tMapParsed.atSwitch2Door = [];
	for(var uiSwitchPos in tMapJson['switch2door'])
	{
		var uiDoorPos = tMapJson['switch2door'][uiSwitchPos];
		tMapParsed.atSwitch2Door[uiSwitchPos] = uiDoorPos;
	}

	/* Copy all respawn points. */
	tMapParsed.atRespawn = [];
	for(var uiRespawnPos in tMapJson['respawn'])
	{
		var uiRespawnId = tMapJson['respawn'][uiRespawnPos];
		tMapParsed.atRespawn[uiRespawnPos] = uiRespawnId;
	}

	return true;
}



function loader_callback_initialize_player_sprite(tLoader)
{
	/* Get the JSON data. */
	var tAnimationJson = tLoader.get_current_response()
	
	/* Get the player sprites. */
	var atPlayerSprites = Array(tAnimationJson["walkjump"]["sprites"].length);
	for(var uiAnimationIdx=0; uiAnimationIdx<tAnimationJson["walkjump"]["sprites"].length; uiAnimationIdx++)
	{
		var tSprite = create_image_data(base64_to_uint8array(tAnimationJson["walkjump"]["sprites"][uiAnimationIdx]), 32, 32);
		atPlayerSprites[uiAnimationIdx] = tSprite;
	}
	/* FIXME: read this from the JSON input. */
	tPlayer.atAnimation = [];
	tPlayer.atAnimation.auiStandLeft = [0];
	tPlayer.atAnimation.auiStandRight = [5];
	tPlayer.atAnimation.auiJumpLeft = [4];
	tPlayer.atAnimation.auiJumpRight = [9];
	tPlayer.atAnimation.auiWalkLeft = [0, 1, 2, 1, 0, 3, 4, 3];
	tPlayer.atAnimation.auiWalkRight = [5, 6, 7, 6, 5, 8, 9, 8];
	tPlayer.atAnimation.auiClimbing = [10, 11, 10, 12];
	tPlayer.atAnimation.auiDead = [13];

	var atPlayerLifeLostSprites = Array(tAnimationJson["life_lost"]["sprites"].length);
	for(uiAnimationIdx=0; uiAnimationIdx<tAnimationJson["life_lost"]["sprites"].length; uiAnimationIdx++)
	{
		var tSprite = create_image_data(base64_to_uint8array(tAnimationJson["life_lost"]["sprites"][uiAnimationIdx]), 32, 32);
		atPlayerLifeLostSprites[uiAnimationIdx] = tSprite;
	}
	/* FIXME: read this from the JSON input. */
	var auiLifeLostAnimationSequence = [0, 1, 2, 2, 1];

	/* Initialize the sprites. */
	atSprites = [];
	
	/* Create the player sprite. */
	var tPigSprite = document.createElement("canvas");
	tPigSprite.width = 32;
	tPigSprite.height = 32;
	var tCtx = tPigSprite.getContext("2d");
	tSpritePlayer = [];
	tSpritePlayer.fActive = true;
	tSpritePlayer.uiPosX = 0;
	tSpritePlayer.uiPosY = 0;
	tSpritePlayer.tCanvas = tPigSprite;
	tSpritePlayer.tContext = tCtx;
	tSpritePlayer.atAnimationSprites = atPlayerSprites;
	tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiStandRight;
	tSpritePlayer.uiAnimationSpriteIndex = tPlayer.atAnimation.auiStandRight[0];
	tSpritePlayer.uiAnimationTableIndex = 0;
	tSpritePlayer.uiAnimationStepDelay = 1;
	tSpritePlayer.uiAnimationStepDelayCnt = 0;
	atSprites.push(tSpritePlayer);
	
	tCtx.putImageData(tSpritePlayer.atAnimationSprites[tSpritePlayer.uiAnimationSpriteIndex],0,0);

	/* Create the life-lost sprite. */
	var tPigAngelSprite = document.createElement("canvas");
	tPigAngelSprite.width = 32;
	tPigAngelSprite.height = 32;
	var tPigAngelCtx = tPigAngelSprite.getContext("2d");
	tSpritePlayerAngel = [];
	tSpritePlayerAngel.fActive = false;
	tSpritePlayerAngel.uiPosX = 0;
	tSpritePlayerAngel.uiPosY = 0;
	tSpritePlayerAngel.tCanvas = tPigAngelSprite;
	tSpritePlayerAngel.tContext = tPigAngelCtx;
	tSpritePlayerAngel.atAnimationSprites = atPlayerLifeLostSprites;
	tSpritePlayerAngel.auiAnimation = auiLifeLostAnimationSequence;
	tSpritePlayerAngel.uiAnimationSpriteIndex = auiLifeLostAnimationSequence[0];
	tSpritePlayerAngel.uiAnimationTableIndex = 0;
	tSpritePlayerAngel.uiAnimationStepDelay = 3;
	tSpritePlayerAngel.uiAnimationStepDelayCnt = 0;
	atSprites.push(tSpritePlayerAngel);
	
	tPigAngelCtx.putImageData(tSpritePlayerAngel.atAnimationSprites[tSpritePlayerAngel.uiAnimationSpriteIndex],0,0);
	
	return true;
}



function level_restart()
{
	/* Get the player start position. */
	var ulStartIndex = 0;
	
	/* Start standing right. */
	tPlayer.tCurrentAnimation = PLAYERANIMATION_STAND_RIGHT;
	/* Keep this as the global "tSpritePlayer". */
	var posX = tMapParsed.atStartPositions[ulStartIndex].x*sizTileXPixels+tPlayer.tCollisionBox.x0+(tPlayer.tCollisionBox.x1-tPlayer.tCollisionBox.x0)/2;
	var posY = tMapParsed.atStartPositions[ulStartIndex].y*sizTileYPixels+tPlayer.tCollisionBox.y0+(tPlayer.tCollisionBox.y1-tPlayer.tCollisionBox.y0)/2;
	tSpritePlayer.fActive = true;
	tSpritePlayer.uiPosX = posX;
	tSpritePlayer.uiPosY = posY;
	tSpritePlayer.auiAnimation = tPlayer.atAnimation.auiStandRight;
	tSpritePlayer.uiAnimationSpriteIndex = -1;
	tSpritePlayer.uiAnimationTableIndex = 0;
	tSpritePlayer.uiAnimationStepDelay = 1;
	tSpritePlayer.uiAnimationStepDelayCnt = 0;

	tSpritePlayerAngel.fActive = false;
	tSpritePlayerAngel.uiAnimationSpriteIndex = tSpritePlayerAngel.auiAnimation[0];
	tSpritePlayerAngel.uiAnimationTableIndex = 0;
	tSpritePlayerAngel.uiAnimationStepDelay = 3;
	tSpritePlayerAngel.uiAnimationStepDelayCnt = 0;

	tState = STATE_PLAYING;
	tPlayer.tState = PLAYERSTATE_WALKING;
	tPlayer.ulCurrentSpeed = 0;
}



function loader_callback_level_start(tLoader)
{
	/* Change the state. */
	tState = STATE_INITIALIZING;

	/* Clear all animations. */
	atAnimationsGlobal = [];
	atAnimationsLocal = [];

	/* Get the number of buffers needed for each layer. */
	var ulBuffersNeeded = (Math.ceil(sizScreenSizeXTiles/sizBufferSizeXTiles)+1) * (Math.ceil(sizScreenSizeYTiles/sizBufferSizeYTiles)+1);
	
	/* Create the rendering stack. Rendering starts with element 0 and ends with the last layer in the list. */
	atRenderStack = new Array(2);
	
	var aStackElements = ['ground', 'objects'];
	for(var uiLayerIdx=0; uiLayerIdx<aStackElements.length; uiLayerIdx++)
	{
		var strLayerName = aStackElements[uiLayerIdx];
		
		/* Create all buffers for this layer. */
		var atBuffers = new Array(ulBuffersNeeded);
		for(var uiCnt=0; uiCnt<ulBuffersNeeded; uiCnt++)
		{
			var tCanvas = document.createElement("canvas");
			tCanvas.width = sizTileXPixels * sizBufferSizeXTiles;
			tCanvas.height = sizTileYPixels * sizBufferSizeYTiles;
			
			/* Create the context for the buffer. */
			var tCtx = tCanvas.getContext("2d");
			
			/* Combine the canvas and the context to a buffer tuple. */
			atBuffers[uiCnt] = [tCanvas, tCtx];
		}
		
		/* Check the layer for animation elements. */
		var aucLayer = atLayers[strLayerName];
		var sizLayer = aucLayer.length;
		var atAnim = new Array(sizLayer);
		for(var uiCnt=0; uiCnt<sizLayer; uiCnt++)
		{
			var uiIdx = aucLayer[uiCnt];
			if( uiIdx in atAnimationsAll )
			{
				var tAnim;
				/* Does the animation already exist in the global table? */
				var uiAnimationIdx = animation_search_clone(atAnimationsGlobal, uiIdx);
				if( uiAnimationIdx==null )
				{
					/* No, add a new copy of the animation to the global table. */
					tAnim = animation_clone(atAnimationsAll[uiIdx], null, uiIdx);
					atAnimationsGlobal.push(tAnim);
				}
				else
				{
					/* Yes, the animation already exists. Reuse it. */
					tAnim = atAnimationsGlobal[uiAnimationIdx];
				}
				atAnim[uiCnt] = tAnim;
			}
		}
		
		var tRenderLayer = [];
		tRenderLayer.atTiles      = aucLayer;
		tRenderLayer.atBuffers    = atBuffers;
		tRenderLayer.atAnimations = atAnim;
		tRenderLayer.atSprites    = [];
		atRenderStack[uiLayerIdx] = tRenderLayer;
	}

	/* Create an array for the complete level. */
	uiLevelBuffersX = Math.ceil(tMapParsed.map_size_x/sizBufferSizeXTiles);
	uiLevelBuffersY = Math.ceil(tMapParsed.map_size_y/sizBufferSizeYTiles);
	atLevelBuffers = new Array(uiLevelBuffersX*uiLevelBuffersY);

	/* Create the ReRe buffer for the complete map. */
	aucReRe = new Uint8Array(Math.ceil(tMapParsed.map_size_x*tMapParsed.map_size_y/8));
	/* aucReRe.fill(0xff); */
	for(var uiCnt=0; uiCnt<aucReRe.length; uiCnt++)
	{
		aucReRe[uiCnt] = 0xff;
	}

	/* Append the player sprite to layer 1. */
	atRenderStack[1].atSprites.push(tSpritePlayer);
	/* Append the angel sprite also to layer 1. */
	atRenderStack[1].atSprites.push(tSpritePlayerAngel);

	/* Initialize the camera position. */
	var tCameraNew = camera_move_center_player();
	ulCameraX = tCameraNew[0];
	ulCameraY = tCameraNew[1];

	/*
	 * Place the buffers for each layer at the camera position.
	 */
	/* Clear the complete buffers. */
	/* atLevelBuffers.fill(null); */
	for(var uiCnt=0; uiCnt<atLevelBuffers.length; uiCnt++)
	{
		atLevelBuffers[uiCnt] = null;
	}
	
	/* Get the box where to place the buffers. */
	var ulBufXStart = Math.floor(ulCameraX / (sizTileXPixels*sizBufferSizeXTiles));
	var ulBufYStart = Math.floor(ulCameraY / (sizTileYPixels*sizBufferSizeYTiles));
	var ulBufXEnd = ulBufXStart + Math.ceil(sizScreenSizeXTiles/sizBufferSizeXTiles) + 1;
	var ulBufYEnd = ulBufYStart + Math.ceil(sizScreenSizeYTiles/sizBufferSizeYTiles) + 1;
	var uiBufferCnt = 0;
	for(var y=ulBufYStart; y<ulBufYEnd; y++)
	{
		for(var x=ulBufXStart; x<ulBufXEnd; x++)
		{
			atLevelBuffers[x + uiLevelBuffersX*y] = [ atRenderStack[0].atBuffers[uiBufferCnt], atRenderStack[1].atBuffers[uiBufferCnt] ];
			uiBufferCnt++;
		}
	}


	/*
	 * Refresh all buffers.
	 */
	var ulTileXStart = Math.floor(ulCameraX/sizTileXPixels);
	var ulTileYStart = Math.floor(ulCameraY/sizTileYPixels);
	var ulTileXEnd = ulTileXStart + sizScreenSizeXTiles + 1;
	var ulTileYEnd = ulTileYStart + sizScreenSizeYTiles + 1;
	for(var y=ulTileYStart; y<ulTileYEnd; y++)
	{
		for(var x=ulTileXStart; x<ulTileXEnd; x++)
		{
			redraw_tile(x,y);
		}
	}


	/* Create the image to make tiles invisible. This image has one pixel
	 * for each tile. If the pixel is set to completely transparent, the
	 * tile is visible. If the pixel is 100% black, the tile is not
	 * visible.
	 */
	tMask = []
	tMask.tCanvas = document.createElement("canvas");
	tMask.tCanvas.width = tMapParsed.map_size_x;
	tMask.tCanvas.height = tMapParsed.map_size_y;
	/* Create the context for the mask. */
	tMask.tContext = tMask.tCanvas.getContext("2d");
	/* Fill the complete mask with black pixels. */
	tMask.tContext.fillStyle = "#000000";
	tMask.tContext.fillRect(0, 0, tMask.tCanvas.width, tMask.tCanvas.height);


	level_restart();

	draw_map();

	/* Clear the last render time. */
	ulLastRenderTime = 0;
	
	/* Render the first frame. */
	timer_loop();
}



function load_error(tLoader)
{
	/* Append a message to the message area. */
	var strMsg = "Failed to load the file " + tLoader.get_current_url();
	tMessageArea.add(strMsg);
}



function game_request_pause()
{
	fRequestPause = true;
}



function game_request_resume()
{
	if( tState==STATE_PAUSE )
	{
		/* Change the state to "playing". */
		tState = STATE_PLAYING;
		
		/* Start requesting render events again. */
		window.requestAnimationFrame(timer_loop);
		
		/* Clear the last render time. */
		ulLastRenderTime = 0;
	}
}



function game_run()
{
	/* Create the message area. */
	tMessageArea = new MessageArea('messageArea', 10);
	
	/* Does the function requestAnimationFrame already exist? */
	if ( !window.requestAnimationFrame )
	{
		/* No -> does it exist with another name? */
		var apfnNames = [
			window.webkitRequestAnimationFrame,
			window.mozRequestAnimationFrame,
			window.oRequestAnimationFrame,
			window.msRequestAnimationFrame
		];
		
		var sizNames = apfnNames.length;
		for(var uiCnt=0; uiCnt<sizNames; uiCnt++)
		{
			var pfnRequestAnimFrame = apfnNames[uiCnt];
			if( typeof pfnRequestAnimFrame == 'function')
			{
				window.requestAnimationFrame = pfnRequestAnimFrame;
				break;
			}
		}
	}
	
	if( !window.requestAnimationFrame )
	{
		var strMsg = 'Failed to request animation frames.';
		tMessageArea.add(strMsg);
	}
	else
	{
		/* Initialize the tile size to 32x32. */
		sizTileXPixels = 32;
		sizTileYPixels = 32;
		
		/* Pause the game if it lost focus. */
		fRequestPause = false;
		document.addEventListener('blur', game_request_pause, false);
		
		/* Get the on-screen canvas and context. */
		tScreenCanvas = document.getElementById("myCanvas");
		tScreenCtx = tScreenCanvas.getContext("2d");
		
		/* Set the font and color for the debug messages. */
		tScreenCtx.font = '10px serif';
		tScreenCtx.fillStyle = 'black';
		tScreenCtx.strokeStyle = 'white';
		
		/* Get the size of the screen in tiles. */
		sizScreenSizeXTiles = Math.floor(tScreenCanvas.width / sizTileXPixels);
		sizScreenSizeYTiles = Math.floor(tScreenCanvas.height / sizTileYPixels);
		
		/* A buffer is fixed to 8x8 tiles. */
		sizBufferSizeXTiles = 8;
		sizBufferSizeYTiles = 8;
		
		/* Initialize the keyboard joystick. */
		joystick_keyboard_init();
		/* Initialize the swipe joystick. */
		joystick_swipe_init();
		
		/* Change the state. */
		tState = STATE_LOADING;
		
		/* Load some files. */
		var tLoader = new Loader();
		tLoader.add_request('aztec_pig_level1.json', 'application/json', loader_callback_initialize_map,           null);
		tLoader.add_request('player_sprite.json',    'application/json', loader_callback_initialize_player_sprite, null);
		tLoader.process_list(loader_callback_level_start, load_error);
	}
}



/* Export the main function.
 * Otherwise the closure compiler will remove everything.
 */
window['game_run'] = game_run;
