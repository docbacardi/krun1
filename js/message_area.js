/* This is the request object for loading various data from the server. */

/**
 * @constructor
 */
function MessageArea(strElementId, uiMaxLines)
{
	/* Get the message area. */
	this.tMessageElement = document.getElementById(strElementId);
	this.uiMaxLines = uiMaxLines;
}



MessageArea.prototype.add = function(strMessage)
{
	var tMsgDiv = this.tMessageElement;
	if( tMsgDiv!=null )
	{
		/* Get the old contents and split them by lines. */
		var astrLines = tMsgDiv.innerHTML.split('<br>');
		/* Only keep the last 9 lines. */
		var sizLines = astrLines.length;
		var sizLimit = this.uiMaxLines - 1;
		if( sizLines>sizLimit )
		{
			astrLines.splice(0, sizLines-sizLimit);
		}
		/* Append the new message. */
		astrLines.push(strMessage);
		
		/* Assign the new message list to the area. */
		tMsgDiv.innerHTML = astrLines.join('<br>');
	}
	window.console.log(strMessage);
}


