from PIL import Image
import argparse
import array
import base64
import json
import operator
import sys


# This function reads an image and extracts "uiNumberofSprites" from it.
# The sprites must be appended in X position.
def extract_sprites(strImageName, ulSpriteSize_X, ulSpriteSize_Y, uiNumberofSprites):
	atAnimation = []
	
	# Open the input image.
	tImg = Image.open(strImageName)
	if tImg.mode!='RGBA':
		raise Exception('The tileset "%s" image mode is not "RGBA" but "%s".' % (strTilesetName,tImg.mode))
	
	if tImg.size[0]!=ulSpriteSize_X*uiNumberofSprites:
		raise Exception('The image width should be %d, but it is %d!' % (ulSpriteSize_X*uiNumberofSprites, tImg.size[0]))
	if tImg.size[1]!=ulSpriteSize_Y:
		raise Exception('The image height should be %d, but it is %d!' % (ulSpriteSize_Y, tImg.size[1]))
	
	for uiSpriteIdx in range(0,uiNumberofSprites):
		# Get one sprite block from the image.
		tSprite = tImg.crop((uiSpriteIdx*ulSpriteSize_X, 0, (uiSpriteIdx+1)*ulSpriteSize_X, ulSpriteSize_Y))
		
		# Get the raw RGBA data.
		tRGBAData = list(tSprite.getdata())
		# Create the output array.
		aucRGBAData = array.array('B', [0]*(ulSpriteSize_X*ulSpriteSize_Y*4))
		# Copy all data to the array.
		uiCnt = 0
		for tPixel in tRGBAData:
			aucRGBAData[uiCnt+0] = tPixel[0]
			aucRGBAData[uiCnt+1] = tPixel[1]
			aucRGBAData[uiCnt+2] = tPixel[2]
			aucRGBAData[uiCnt+3] = tPixel[3]
			uiCnt += 4
		# Encode the complete tile as base64.
		strSpriteBase64 = base64.b64encode(aucRGBAData.tostring())
		atAnimation.append(strSpriteBase64)
	
	return atAnimation


atPlayerAnimation = {}

atLifeLost = {}
atLifeLost['sprites'] = extract_sprites('adventure_pig_angel_as_tiles.png', 32, 32, 3)
atLifeLost['sequence'] = [0, 1, 2, 2, 1]
atPlayerAnimation['life_lost'] = atLifeLost

atWalkJump = {}
atWalkJump['sprites'] = extract_sprites('adventure_pig_as_tiles.png', 32, 32, 10)
atWalkJump['sprites'].extend(extract_sprites('adventure_pig_climbing_as_tiles.png', 32, 32, 3))
atWalkJump['sprites'].extend(extract_sprites('adventure_pig_dead_as_tiles.png', 32, 32, 1))
atWalkJump['sequence_walk_left'] = [0, 1, 2, 1, 0, 3, 4, 3]
atWalkJump['sequence_walk_right'] = [5, 6, 7, 6, 5, 8, 9, 8]
atWalkJump['jump_left'] = 4
atWalkJump['jump_right'] = 9
atWalkJump['dead'] = 13
atPlayerAnimation['walkjump'] = atWalkJump

tFile = open('player_sprite.json', 'wt')
tFile.write(json.dumps(atPlayerAnimation))
tFile.close()
