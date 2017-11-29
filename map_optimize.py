from PIL import Image
from PIL import ImageDraw
import argparse
import array
import base64
import json
import operator
import sys
import xml.etree.ElementTree


strCfg_TxmFile = 'map.tmx'



class TileMap:
	__tXml = None
	__tXmlToor = None
	__ulMapSize_X = None
	__ulMapSize_Y = None
	__ulTileSize_X = None
	__ulTileSize_Y = None
	__aTiles = None
	__aLayers = None
	__aAnimations = None
	__atTileProperties = None
	__atCollisionMaps = None



	def read_rooms(self, tNodeObjectGroup):
		atRooms = []
		
		for tNode in tNodeObjectGroup.findall('object'):
			# Get the ID (this is just for error messages).
			strID = tNode.get('id')
			
			# Get the name.
			strRoomName = tNode.get('name')
			
			# Get the position and dimension.
			ulPosX0 = long(tNode.get('x'))
			ulPosY0 = long(tNode.get('y'))
			strWidth  = tNode.get('width')
			strHeight = tNode.get('height')
			if (not strWidth is None) and (not strHeight is None):
				# This should be a rectangle.
				ulWidth  = long(strWidth)
				ulHeight = long(strHeight)
				
				# Convert the positions in tiles.
				ulTileX0 = ulPosX0 / self.__ulTileSize_X
				ulTileY0 = ulPosY0 / self.__ulTileSize_Y
				ulTileX1 = (ulPosX0+ulWidth+self.__ulTileSize_X-1) / self.__ulTileSize_X
				ulTileY1 = (ulPosY0+ulHeight+self.__ulTileSize_Y-1) / self.__ulTileSize_Y
				
				# Is this a polyline?
				tNodePolyline = tNode.find('polyline')
				if not tNodePolyline is None:
					print 'WARNING: ignoring room %s ("%s") as polylines are not yet supported.' % (strID, strRoomName)
				else:
					# This is a rectangle. Just add the coordinates without a bitmap.
					atObj = {
						'name': strRoomName,
						'x0': ulTileX0,
						'y0': ulTileY0,
						'x1': ulTileX1,
						'y1': ulTileY1,
						'bitmap': None
					}
					atRooms.append(atObj)
			else:
				# This should be a polyline.
				
				# Is this a polyline?
				tNodePolyline = tNode.find('polyline')
				if not tNodePolyline is None:
					print 'WARNING: ignoring the details of room %s ("%s") as polylines are not yet supported.' % (strID, strRoomName)
					
					# Get all point in the polyline.
					strPoints = tNodePolyline.get('points')
					astrPoints = strPoints.split()
					atPoints = []
					for strPoint in astrPoints:
						astrPoint = strPoint.split(',')
						if len(astrPoint)!=2:
							raise Exception('The point "%s" has an incorrect syntax.' % strPoint)
						atPoints.append((long(float(astrPoint[0])+0.5)+ulPosX0, long(float(astrPoint[1])+0.5)+ulPosY0))
					
					# Get the bounding box for all points.
					ulBoundPixelX0 = self.__ulMapSize_X * self.__ulTileSize_X
					ulBoundPixelY0 = self.__ulMapSize_Y * self.__ulTileSize_Y
					ulBoundPixelX1 = 0
					ulBoundPixelY1 = 0
					for tPoint in atPoints:
						if ulBoundPixelX0>tPoint[0]:
							ulBoundPixelX0 = tPoint[0]
						if ulBoundPixelY0>tPoint[1]:
							ulBoundPixelY0 = tPoint[1]
						if ulBoundPixelX1<tPoint[0]:
							ulBoundPixelX1 = tPoint[0]
						if ulBoundPixelY1<tPoint[1]:
							ulBoundPixelY1 = tPoint[1]
					
					
					# Convert the bounding box position from pixels to tiles.
					# Round down the upper left edge.
					# Round up the lower right edge and add 1 to get a bounding box.
					ulTileX0 = ulBoundPixelX0 / self.__ulTileSize_X
					ulTileY0 = ulBoundPixelY0 / self.__ulTileSize_Y
					ulTileX1 = (ulBoundPixelX1+self.__ulTileSize_X-1) / self.__ulTileSize_X
					ulTileY1 = (ulBoundPixelY1+self.__ulTileSize_Y-1) / self.__ulTileSize_Y
					
					# Create a bitmap for the complete bounding box. Align the image to tile borders.
					tImg = Image.new('RGB', ((ulTileX1-ulTileX0)*self.__ulTileSize_X,(ulTileY1-ulTileY0)*self.__ulTileSize_Y))
					# Create a list with all points for the line.
					atLinePoints = []
					ulImgOffsetX = ulTileX0 * self.__ulTileSize_X
					ulImgOffsetY = ulTileY0 * self.__ulTileSize_Y
					for tPoint in atPoints:
						atLinePoints.append((tPoint[0]-ulImgOffsetX, tPoint[1]-ulImgOffsetY))
					# Draw the complete line.
					tDraw = ImageDraw.Draw(tImg)
					tDraw.polygon(atLinePoints, outline='#ffffff', fill='#ffffff')
					del tDraw
					# Loop over all 32x32 pixel blocks and check if there is one single white pixel.
					# If there is at least one white pixel, the tile is part of the room.
					tImgPixels = tImg.load()
					uiBitmapBitsX = ulTileX1 - ulTileX0
					uiBitmapBitsY = ulTileY1 - ulTileY0
					uiBitmapSizeX = int((uiBitmapBitsX+7)/8)
					tBitmap = array.array('B', [0]*(uiBitmapSizeX*uiBitmapBitsY))
					for uiTileCntX in range(0, uiBitmapBitsX):
						for uiTileCntY in range(0, uiBitmapBitsY):
							fHasWhitePixels = 0
							for uiPixelX in range(0, self.__ulTileSize_X):
								for uiPixelY in range(0, self.__ulTileSize_Y):
									tPixel = tImgPixels[uiTileCntX*int(self.__ulTileSize_X) + uiPixelX, uiTileCntY*int(self.__ulTileSize_Y) + uiPixelY]
									if tPixel!=(0,0,0):
										fHasWhitePixels = 1
							if fHasWhitePixels==1:
								tBitmap[int(uiTileCntX/8)+(uiTileCntY*uiBitmapSizeX)] |= (1 << (uiTileCntX&7))
					
					# DEBUG: Show the bitmap as a small image.
					#tImgDemo = Image.new('RGB', (uiBitmapBitsX,uiBitmapBitsY))
					#tImgDemoPixels = tImgDemo.load()
					#for uiTileCntX in range(0, uiBitmapBitsX):
					#	for uiTileCntY in range(0, uiBitmapBitsY):
					#		tBit = (0,0,0)
					#		if (tBitmap[int(uiTileCntX/8)+(uiTileCntY*uiBitmapSizeX)]&(1<<(uiTileCntX&7))):
					#			tBit = (255,255,255)
					#		tImgDemoPixels[uiTileCntX,uiTileCntY] = tBit
					#tImgDemo.show()
					
					# Convert the bitmap data to base64.
					strBitmap = base64.b64encode(tBitmap.tostring())
					
					atObj = {
						'name': strRoomName,
						'x0': ulTileX0,
						'y0': ulTileY0,
						'x1': ulTileX1,
						'y1': ulTileY1,
						'bitmap': strBitmap
					}
					atRooms.append(atObj)
				else:
					# This is a rectangle. Just add the coordinates without a bitmap.
					print 'WARNING: ignoring rectangle without width and height.'
		
		return atRooms
	
	
	
	def __init__(self, tTxmFile, tOutputFile):
		# Open the TMX file.
		self.__tXml = xml.etree.ElementTree.parse(tTxmFile)
		self.__tXmlRoot = self.__tXml.getroot()
		
		if self.__tXmlRoot.tag!='map':
			raise Exception('The input file has no "map" root but "%s". Is this really a TMX file?' % self.__tXmlRoot.tag)
		
		# Get the map and tile dimension.
		self.__ulMapSize_X  = long(self.__tXmlRoot.get('width'))
		self.__ulMapSize_Y  = long(self.__tXmlRoot.get('height'))
		self.__ulTileSize_X = long(self.__tXmlRoot.get('tilewidth'))
		self.__ulTileSize_Y = long(self.__tXmlRoot.get('tileheight'))
		
		print 'map:   %dx%d' % (self.__ulMapSize_X,self.__ulMapSize_Y)
		print 'tiles: %dx%d' % (self.__ulTileSize_X,self.__ulTileSize_Y)
		
		# Create a tilelist with one empty (i.e. completely transparent) element.
		self.__aTiles = dict({})
		tTile = Image.new('RGBA', (self.__ulTileSize_X,self.__ulTileSize_Y), 0)
		tTile.paste(0, (0,0,tTile.size[0],tTile.size[1]), 0)
		self.addNewTile(0L, tTile, 'empty tile')
		
		# Create a new, empty animation dict.
		self.__aAnimations = dict({})
		# Create a new empty property dict.
		self.__atTileProperties = dict({})
		# Create a new empty dict for the collision maps.
		self.__atCollisionMaps = dict({})
		
		# Loop over all tilesets and read the tiles from the images.
		for tXmlTilesetNode in self.__tXmlRoot.findall('tileset'):
			ulFirstGid = long(tXmlTilesetNode.get('firstgid'))
			strTilesetName = tXmlTilesetNode.get('name')
			ulSizeX = long(tXmlTilesetNode.get('tilewidth'))
			ulSizeY = long(tXmlTilesetNode.get('tileheight'))
			
			if self.__ulTileSize_X!=ulSizeX or self.__ulTileSize_Y!=ulSizeY:
				raise Exception('The tile dimensions %dx%d of the set "%s" does not match the maps tile dimensions %dx%d.' % (ulSizeX,ulSizeY,strTilesetName,self.__ulTileSize_X,self.__ulTileSize_Y))
			
			ulGidCnt = ulFirstGid
			
			# Loop over all image objects.
			for tXmlImageNode in tXmlTilesetNode.findall('image'):
				strImagePath = tXmlImageNode.get('source')
				ulImageSizeX = long(tXmlImageNode.get('width'))
				ulImageSizeY = long(tXmlImageNode.get('height'))
				print 'Image "%s": %dx%d' % (strImagePath,ulImageSizeX,ulImageSizeY)
				if (ulImageSizeX % self.__ulTileSize_X)!=0 or (ulImageSizeY % self.__ulTileSize_Y)!=0:
					raise Exception('The tile image has an unused border!')
				
				# Open the input image.
				tImg = Image.open(strImagePath)
				if ulImageSizeX>tImg.size[0] or ulImageSizeY>tImg.size[1]:
					raise Exception('The tileset "%s" image dimensions of %dx%d exceed the image dimensions of %dx%d.' % (strTilesetName,ulImageSizeX,ulImageSizeY,tImg.size[0],tImg.size[1]))
				if tImg.mode!='RGBA':
					raise Exception('The tileset "%s" image mode is not "RGBA" but "%s".' % (strTilesetName,tImg.mode))
				
				# Loop over all tiles in the image.
				for ulImgY in range(0, ulImageSizeY, self.__ulTileSize_Y):
					for ulImgX in range(0, ulImageSizeX, self.__ulTileSize_X):
						tTile = tImg.crop((ulImgX, ulImgY, ulImgX+self.__ulTileSize_X, ulImgY+self.__ulTileSize_Y))
						self.addNewTile(ulGidCnt, tTile, strTilesetName)
						ulGidCnt += 1
			
			# Look for extra information about the tiles, like animations and terrain.
			for tXmlTileNode in tXmlTilesetNode.findall('tile'):
				# NOTE: the id is relative to ulFirstGid here.
				ulTileIdx = long(tXmlTileNode.get('id')) + ulFirstGid
				# Is this an animation?
				tXmlAnimationNode = tXmlTileNode.find('animation')
				if not tXmlAnimationNode is None:
					# Collect all frames of the animation.
					atAnimationSteps = []
					for tXmlAnimationFrameNode in tXmlAnimationNode.findall('frame'):
						ulAnimIdx = long(tXmlAnimationFrameNode.get('tileid')) + ulFirstGid
						ulDurationMs = long(tXmlAnimationFrameNode.get('duration'))
						# Translate the duration in multiple of 40ms with round up.
						ulDuration40Ms = long((ulDurationMs+39) / 40)
						atAnimationSteps.append((ulAnimIdx,ulDuration40Ms))
                                        atAnimation = {
                                                'steps': atAnimationSteps,
                                                'fIsOneshot': False,
                                                'fnCallbackEnd': None
                                        }
					self.__aAnimations[ulTileIdx] = atAnimation
				# Is this a list of properties?
				tXmlPropertiesNode = tXmlTileNode.find('properties')
				if not tXmlPropertiesNode is None:
					# Collect all properties for the tile.
					atProperties = dict({})
					for tXmlPropertyNode in tXmlPropertiesNode.findall('property'):
						strKey = tXmlPropertyNode.get('name')
						strValue = tXmlPropertyNode.get('value')
						atProperties[strKey] = strValue
					self.__atTileProperties[ulTileIdx] = atProperties
				tXmlObjectGroupNode = tXmlTileNode.find('objectgroup')
				if not tXmlObjectGroupNode is None:
					# Collision information.
					atCollision = []
					for tXmlObjectNode in tXmlObjectGroupNode.findall('object'):
						ulX = long(tXmlObjectNode.get('x'))
						ulY = long(tXmlObjectNode.get('y'))
						# Does the node have 'width' and 'height' attributes?
						strW = tXmlObjectNode.get('width')
						strH = tXmlObjectNode.get('height')
						if strW!='' and strH!='':
							# This can be either a rectangle or an ellipse.
							if not tXmlObjectNode.find('ellipse') is None:
								raise Exception('Tile %d: Elliptic collision areas are not supported.' % ulTileIdx)
							ulW = long(strW)
							ulH = long(strH)
							atCollision.append(('R',ulX,ulY,ulX+ulW,ulY+ulH))
						else:
							# Is this a polyline?
							if not tXmlObjectNode.find('polyline') is None:
								raise Exception('Tile %d: Polyline collision areas are not supported.' % ulTileIdx)
							tXmlPolygonNode = tXmlObjectNode.find('polygon')
							if tXmlPolygonNode is None:
								raise Exception('Tile %d: Unknown collision area.' % ulTileIdx)
							strPoints = tXmlPolygonNode.get('points')
							print 'Poly: %s' % strPoints
							raise Exception('Polygons are not yet finished!')
					self.__atCollisionMaps[ulTileIdx] = {'maps': atCollision, 'action': '', 'collision_fall': True, 'collision_jump': True, 'collision_stand': True, 'collision_walk': True}
		
		# Loop over all tiles with collision maps and look for collision actions.
		for ulGid,atCollision in self.__atCollisionMaps.iteritems():
			# Does this tile have properties?
			if ulGid in self.__atTileProperties:
				atProperties = self.__atTileProperties[ulGid]
				# Is there an "action" property?
				if 'action' in atProperties:
					strAction = atProperties['action']
					atCollision['action'] = strAction
				if 'collision_fall' in atProperties:
					fColl = False
					if long(atProperties['collision_fall'])!=0:
						fColl = True
					atCollision['collision_fall'] = fColl
				if 'collision_jump' in atProperties:
					fColl = False
					if long(atProperties['collision_jump'])!=0:
						fColl = True
					atCollision['collision_jump'] = fColl
				if 'collision_stand' in atProperties:
					fColl = False
					if long(atProperties['collision_stand'])!=0:
						fColl = True
					atCollision['collision_stand'] = fColl
				if 'collision_walk' in atProperties:
					fColl = False
					if long(atProperties['collision_walk'])!=0:
						fColl = True
					atCollision['collision_walk'] = fColl
		
		# Loop over all layers.
		self.__aLayers = dict({})
		for tXmlLayerNode in self.__tXmlRoot.findall('layer'):
			strLayerName = tXmlLayerNode.get('name')
			ulLayerSizeX = long(tXmlLayerNode.get('width'))
			ulLayerSizeY = long(tXmlLayerNode.get('height'))
			
			# The layer dimensions must match the map dimensions.
			if ulLayerSizeX!=self.__ulMapSize_X or ulLayerSizeY!=self.__ulMapSize_Y:
				raise Exception('The layer "%s" dimensions of %dx%d differ from the map dimensions of %dx%d.' % (strLayerName,ulLayerSizeX,ulLayerSizeY,self.__ulMapSize_X,self.__ulMapSize_Y))
			
			# The tile layers must be named 'ground' and 'objects'. All other layers are not translated.
			if not strLayerName in ['ground','objects']:
				print 'Not translating layer "%s".' % strLayerName
			else:
				# Does the layer already exist?
				if strLayerName in self.__aLayers:
					raise Exception('Failed to create layer "%s": a layer with the same name already exists!' % strLayerName)
				
				# Create an empty map with all transparent tiles.
				aLayer = array.array('I', [0]*ulLayerSizeX*ulLayerSizeY)
				
				tXmlDataNode = tXmlLayerNode.find('data')
				if tXmlDataNode is None:
					raise Exception('Layer "%s" has no data node.' % strLayerName)
				
				# Loop over all tiles.
				uiCnt = 0
				for tXmlTileNode in tXmlDataNode.iter('tile'):
					if uiCnt>=(ulLayerSizeX*ulLayerSizeY):
						raise Exceptions('In layer "%s" the number of tile elements (%d) exceed the layer dimensions (%d*%d = %d)!' % (strLayerName,uiCnt,ulLayerSizeX,ulLayerSizeY,ulLayerSizeX*ulLayerSizeY))
					
					ulGid = long(tXmlTileNode.get('gid'))
					
					# Does the tile exist?
					if not ulGid in self.__aTiles:
						raise Exception('Layer "%s" references non-existing tile %d.' % (strLayerName,ulGid))
					
					# Place the tile in the map.
					aLayer[uiCnt] = ulGid
					uiCnt += 1
					
					# Is this an animation?
					if ulGid in self.__aAnimations:
						# Mark all tiles in the animation as used.
						for ulTileIdx,ulDuration in self.__aAnimations[ulGid]['steps']:
							self.__markTileAsUsed(ulTileIdx)
					else:
						self.__markTileAsUsed(ulGid)
				
				# Create the layer.
				self.__aLayers[strLayerName] = aLayer


                # Detect oneshot animations.
                for ulGid,atAnimation in self.__aAnimations.iteritems():
                        # Does this tile have the property "animation_oneshot"?
                        if 'animation_oneshot' in self.__atTileProperties[ulGid]:
                                atAnimation['fIsOneshot'] = True;
                                atAnimation['fnCallbackEnd'] = self.__atTileProperties[ulGid]['animation_oneshot'];


                # Keep all tiles which have the "force_used" property.
                for ulGid,atProperties in self.__atTileProperties.iteritems():
                        if 'force_used' in atProperties:
                		# Is this an animation?
				if ulGid in self.__aAnimations:
					# Mark all tiles in the animation as used.
					for ulTileIdx,ulDuration in self.__aAnimations[ulGid]['steps']:
						self.__markTileAsUsed(ulTileIdx)
				else:
					self.__markTileAsUsed(ulGid)

                # Collect all named tiles.
                atNamedTiles = {}
                for ulTileIdx,atProperties in self.__atTileProperties.iteritems():
                        if 'id' in atProperties:
                                strID = atProperties['id']
                                atNamedTiles[strID] = ulTileIdx


		# Read the room information.
		# Rooms are stored in an objectgroup named 'rooms'.
		for tNode in self.__tXmlRoot.findall('objectgroup'):
			strLayerName = tNode.get('name')
			if strLayerName=='rooms':
				atRooms = self.read_rooms(tNode)
		
		aStartPoints = []
		aActionPoints = []
		aRespawnPoints = {}
		aGoldPositions = {}
		aTargetPositions = {}
		aSwitchPositions = {}
		aDoorPositions = {}
		
		# Look for the special points in the map.
		for tXmlLayerNode in self.__tXmlRoot.findall('layer'):
			strLayerName = tXmlLayerNode.get('name')
			if strLayerName=='organizers':
				tXmlDataNode = tXmlLayerNode.find('data')
				if tXmlDataNode is None:
					raise Exception('Layer "%s" has no data node.' % strLayerName)
				# Loop over all tiles.
				uiCnt = 0
				for tXmlTileNode in tXmlDataNode.iter('tile'):
					if uiCnt>=(self.__ulMapSize_X*self.__ulMapSize_Y):
						raise Exceptions('In layer "%s" the number of tile elements (%d) exceed the map dimensions (%d*%d = %d)!' % (strLayerName,uiCnt,self.__ulMapSize_X,self.__ulMapSize_Y,self.__ulMapSize_X*self.__ulMapSize_Y))
					
					ulGid = long(tXmlTileNode.get('gid'))
					if ulGid in self.__atTileProperties:
						atProps = self.__atTileProperties[ulGid]
						if 'start' in atProps:
							ulX = uiCnt % self.__ulMapSize_X
							ulY = uiCnt / self.__ulMapSize_X
							print 'Found start at %d,%d' % (ulX,ulY)
							aStartPoints.append((ulX,ulY))
						if 'action' in atProps:
							ulX = uiCnt % self.__ulMapSize_X
							ulY = uiCnt / self.__ulMapSize_X
							print 'Found action at %d,%d' % (ulX,ulY)
							aActionPoints.append(uiCnt)
						if 'respawn' in atProps:
							ulRespawnID = int(atProps['respawn'])
							ulX = uiCnt % self.__ulMapSize_X
							ulY = uiCnt / self.__ulMapSize_X
							print 'Found respawn ID %d at %d,%d' % (ulRespawnID, ulX, ulY)
							if ulRespawnID in aRespawnPoints:
								raise Exception('Double defined respawn ID %d' % ulRespawnID)
							aRespawnPoints[ulRespawnID] = uiCnt
						if 'goldid' in atProps:
							ulGoldID = int(atProps['goldid'])
							ulX = uiCnt % self.__ulMapSize_X
							ulY = uiCnt / self.__ulMapSize_X
							print 'Found gold ID %d at %d,%d' % (ulGoldID, ulX, ulY)
							if ulGoldID in aGoldPositions:
								raise Exception('Double defined gold ID %d' % ulGoldID)
							aGoldPositions[ulGoldID] = uiCnt
						if 'targetid' in atProps:
							ulTargetID = int(atProps['targetid'])
							ulX = uiCnt % self.__ulMapSize_X
							ulY = uiCnt / self.__ulMapSize_X
							print 'Found target ID %d at %d,%d' % (ulTargetID, ulX, ulY)
							if ulTargetID in aTargetPositions:
								raise Exception('Double defined target ID %d' % ulTargetID)
							aTargetPositions[ulTargetID] = uiCnt
						if 'switchid' in atProps:
							ulSwitchID = int(atProps['switchid'])
							ulX = uiCnt % self.__ulMapSize_X
							ulY = uiCnt / self.__ulMapSize_X
							print 'Found switch ID %d at %d,%d' % (ulSwitchID, ulX, ulY)
							if ulSwitchID in aSwitchPositions:
								raise Exception('Double defined switch ID %d' % ulSwitchID)
							aSwitchPositions[ulSwitchID] = uiCnt
						if 'doorid' in atProps:
							ulDoorID = int(atProps['doorid'])
							ulX = uiCnt % self.__ulMapSize_X
							ulY = uiCnt / self.__ulMapSize_X
							print 'Found door ID %d at %d,%d' % (ulDoorID, ulX, ulY)
							if ulDoorID in aDoorPositions:
								raise Exception('Double defined door ID %d' % ulDoorID)
							aDoorPositions[ulDoorID] = uiCnt
					uiCnt += 1
		
		
		# Count all used tiles.
		uiTileCnt = 0
		aTranslateGidDict = {}
		for ulIdx,tTile in self.__aTiles.iteritems():
			# Add the usage counters.
			if tTile['use']>0:
				aTranslateGidDict[ulIdx] = uiTileCnt
				uiTileCnt += 1
		
		print 'Optimized to %d tiles.' % uiTileCnt
		
		# Translate all layers.
		aTranslatedLayers = {}
		for strLayerName,aLayer in self.__aLayers.iteritems():
			# Create a new array.
			sizArray = aLayer.buffer_info()[1]
			aLayerNew = array.array('B', [0]*sizArray)
			for uiCnt in range(0,sizArray):
				aLayerNew[uiCnt] = aTranslateGidDict[aLayer[uiCnt]]
			
			# Encode the layer with base64.
			aTranslatedLayers[strLayerName] = base64.b64encode(aLayerNew.tostring())

                # Translate all named tiles.
                aTranslatedNamedTiles = {}
                for strTileName,ulTileIdx in atNamedTiles.iteritems():
                        ulTranslatedIdx = aTranslateGidDict[ulTileIdx]
                        aTranslatedNamedTiles[strTileName] = ulTranslatedIdx

		# Translate all used animations.
		aTranslatedAnimations = {}
		for ulAnimIdx,tAnim in self.__aAnimations.iteritems():
			# Is the animation used?
			if ulAnimIdx in aTranslateGidDict:
				ulTranslatedIdx = aTranslateGidDict[ulAnimIdx]
                                atSteps = []
				for ulIdx,ulDuration in tAnim['steps']:
					atSteps.append((aTranslateGidDict[ulIdx],ulDuration))
				aTranslatedAnim = {
                                        'steps': atSteps,
                                        'fIsOneshot': tAnim['fIsOneshot'],
                                        'fnCallbackEnd': tAnim['fnCallbackEnd']
                                }
				aTranslatedAnimations[ulTranslatedIdx] = aTranslatedAnim
		
		# Translate all collision maps.
		aTranslatedCollisionMaps = {}
		for ulOldGid,atMap in self.__atCollisionMaps.iteritems():
			# Is this tile used?
			if ulOldGid in aTranslateGidDict:
				ulNewGid = aTranslateGidDict[ulOldGid]
				aTranslatedCollisionMaps[ulNewGid] = atMap
		
		# Dump all tiles as base64 encoded RGBA data.
		aTranslatedTiles = [0] * uiTileCnt
		for ulOldGid,ulNewGid in aTranslateGidDict.iteritems():
			tTile = self.__aTiles[ulOldGid]['img']
			# Get the raw RGBA data.
			tRGBAData = list(tTile.getdata())
			# Create the output array.
			aucRGBAData = array.array('B', [0]*(self.__ulTileSize_X*self.__ulTileSize_Y*4))
			# Copy all data to the array.
			uiCnt = 0
			for tPixel in tRGBAData:
				aucRGBAData[uiCnt+0] = tPixel[0]
				aucRGBAData[uiCnt+1] = tPixel[1]
				aucRGBAData[uiCnt+2] = tPixel[2]
				aucRGBAData[uiCnt+3] = tPixel[3]
				uiCnt += 4
			# Encode the complete tile as base64.
			aTranslatedTiles[ulNewGid] = base64.b64encode(aucRGBAData.tostring())
		
		# Build a translation table for the gold position to the target position.
		aGold2Target = {}
		for uiID, uiGoldPos in aGoldPositions.iteritems():
			uiTargetPos = aTargetPositions[uiID]
			aGold2Target[uiGoldPos] = uiTargetPos
		
		# Build a translation table for the switch position to the door position.
		aSwitch2Door = {}
		for uiID, uiSwitchPos in aSwitchPositions.iteritems():
			uiDoorPos = aDoorPositions[uiID]
			aSwitch2Door[uiSwitchPos] = uiDoorPos
		
		# Build a translation table for the respawn position to a dummy.
		aRespawn = {}
		for uiID, uiRespawnPos in aRespawnPoints.iteritems():
			aRespawn[uiRespawnPos] = uiID

		# Dump all information as JSON.
		atMap = {
			'map_size_x': self.__ulMapSize_X,
			'map_size_y': self.__ulMapSize_Y,
			'layers': aTranslatedLayers,
			'tiles': aTranslatedTiles,
			'anims': aTranslatedAnimations,
			'collision': aTranslatedCollisionMaps,
			'start': aStartPoints,
			'action': aActionPoints,
			'respawn': aRespawn,
			'rooms': atRooms,
			'named_tiles': aTranslatedNamedTiles,
			'gold2target': aGold2Target,
			'switch2door': aSwitch2Door
		}
		
		tOutputFile.write(json.dumps(atMap))
	
	
	def addNewTile(self, ulIndex, tImage, strTilesetName):
		if ulIndex in self.__aTiles:
			raise Exception('Tile %d already exists!' % ulIndex)
		self.__aTiles[ulIndex] = dict({'img': tImage, 'tileset':strTilesetName, 'use': 0})
	
	
	def __markTileAsUsed(self,ulTileId):
		# Mark the tile as used.
		self.__aTiles[ulTileId]['use'] += 1






def main():
	tParser = argparse.ArgumentParser(description='Optimize a TXM map file.')
	tParser.add_argument('infile', nargs='?', type=argparse.FileType('r'), default=sys.stdin,
	                     help='read the input data from INPUT_FILENAME', metavar='INPUT_FILENAME')
	tParser.add_argument('outfile', nargs='?', type=argparse.FileType('w'), default=sys.stdout,
	                     help='write the output data to OUTPUT_FILENAME', metavar='OUTPUT_FILENAME')
	aOptions = tParser.parse_args()
	
	tTxm = TileMap(aOptions.infile, aOptions.outfile)
	if aOptions.infile!=sys.stdin:
		aOptions.infile.close()
	if aOptions.outfile!=sys.stdout:
		aOptions.outfile.close()


if __name__ == '__main__':
	main()
