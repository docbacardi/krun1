/* This is the request object for loading various data from the server. */

/**
 * @constructor
 */
function Loader()
{
	this.tRequestObject = null;
	this.atRequestList = [];
	this.ulRequestPosition = 0;
	this.pfnFinal = null;
	this.pfnError = null;
}



Loader.prototype.add_request = function(strURL, strMimeType, pfnCallback, tUserData)
{
	/* Create a new list entry from the parameters. */
	var tEntry = {};
	tEntry.strURL = strURL;
	tEntry.strMimeType = strMimeType;
	tEntry.pfnCallback = pfnCallback;
	tEntry.tUserData = tUserData;
	
	/* Add the new entry to the request list. */
	this.atRequestList.push(tEntry);
}



Loader.prototype.process_list = function(pfnFinalCallback, pfnErrorCallback)
{
	/* Register the callbacks. */
	this.pfnFinal = pfnFinalCallback;
	this.pfnError = pfnErrorCallback;
	
	/* Request the first entry. */
	this.ulRequestPosition = 0;
	this.__process_next_list_element();
}



Loader.prototype.get_current_url = function()
{
	return this.atRequestList[this.ulRequestPosition].strURL;
}



Loader.prototype.get_current_response = function()
{
	var tData = null;
	var tEntry = this.atRequestList[this.ulRequestPosition];
	var strMimeType = tEntry.strMimeType;
	if( strMimeType=='image/png' )
	{
		/* Return the complete image. */
		tData = this.tRequestObject;
	}
	else if( strMimeType=='application/json' )
	{
		/* Parse the JSON data. */
		tData = JSON.parse(this.tRequestObject.responseText);
	}
	else
	{
		/* Return the result of the request. */
		tData = this.tRequestObject.responseText;
	}
	
	return tData;
}



Loader.prototype.get_current_mimetype = function()
{
	return this.atRequestList[this.ulRequestPosition].strMimeType;
}



Loader.prototype.get_current_user_data = function()
{
	return this.atRequestList[this.ulRequestPosition].tUserData;
}



Loader.prototype.get_response = function(uiIndex)
{
	return this.atRequestList[uiIndex].tData;
}



Loader.prototype.__process_next_list_element = function()
{
	/* Are there more files to load? */
	if( this.ulRequestPosition<this.atRequestList.length )
	{
		/* Yes, there are more files. */
		var tEntry = this.atRequestList[this.ulRequestPosition];
		
		/* Keep the pointer to this loader instance in a variable for the callback functions. */
		var tThis = this;
		
		var strMimeType = tEntry.strMimeType;
		if( strMimeType=='image/png' )
		{
			var tRequestObject = new Image();
			tRequestObject.onload = function()
			{
				tThis.__image_onload();
			}
			tRequestObject.onerror = function()
			{
				tThis.__image_onerror();
			}
			
			/* Register the new request object. */
			this.tRequestObject = tRequestObject;
			
			/* Set the source attribure to start loading the image. */
			tRequestObject.src = tEntry.strURL;
		}
		else
		{
			/* Create a new request object. */
			var tRequestObject = new XMLHttpRequest();
			tRequestObject.overrideMimeType(strMimeType);
			tRequestObject.open('GET', tEntry.strURL, true);
			
			tRequestObject.onreadystatechange = function()
			{
				tThis.__state_change();
			}
			
			/* Register the new request object. */
			this.tRequestObject = tRequestObject;
			
			/* Process the request. */
			tRequestObject.send();
		}
	}
	else
	{
		/* No more files to load. */
		
		/* Delete the request object. */
		this.tRequestObject = null;
		
		/* Call the final function. */
		this.pfnFinal(this);
	}
}



Loader.prototype.__process_data = function()
{
	/* Finished loading the file. Now call the function. */
	var tEntry = this.atRequestList[this.ulRequestPosition];
	var bResult = true;
	
	/* Does the entry have a callback? */
	if( tEntry.pfnCallback!=null )
	{
		/* Yes -> pass the data to the callback function. */
		bResult = tEntry.pfnCallback(this);
	}
	else
	{
		/* No -> add the data to the request object. */
		tEntry.tData = this.get_current_response();
	}
	
	if( bResult==true )
	{
		/* Process the next file. */
		this.ulRequestPosition++;
		this.__process_next_list_element();
	}
	else
	{
		this.pfnError(this);
	}
}



Loader.prototype.__state_change = function()
{
	if( this.tRequestObject.readyState==4 )
	{
		if( this.tRequestObject.status=="200" )
		{
			this.__process_data();
		}
		else
		{
			this.pfnError(this);
		}
	}
}



Loader.prototype.__image_onload = function()
{
	this.__process_data();
}



Loader.prototype.__image_onerror = function()
{
	this.pfnError(this);
}
