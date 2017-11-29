.PHONY: all clean install

all: aztec_pig_level1.json player_sprite.json optimized.js


clean:
	rm -f aztec_pig_level1.json
	rm -f player_sprite.json
	rm -f optimized.js

player_sprite.json: player_animation/adventure_pig_angel_as_tiles.png player_animation/adventure_pig_as_tiles.png player_animation/adventure_pig_climbing_as_tiles.png player_animation/adventure_pig_dead_as_tiles.png
	python2.7 get_anims.py

aztec_pig_level1.json: aztec_pig_level1.tmx
	python2.7 map_optimize.py aztec_pig_level1.tmx aztec_pig_level1.json


optimized.js: game.js js/joystick.js js/joystick_keyboard.js js/joystick_swipe.js js/loader.js js/message_area.js
	closure-compiler $(foreach src,$^,--js $(src)) --js_output_file optimized.js --warning_level VERBOSE --compilation_level ADVANCED_OPTIMIZATIONS --language_in ECMASCRIPT5_STRICT
