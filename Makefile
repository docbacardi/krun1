.PHONY: all clean install release

all: aztec_pig_level1.json player_sprite.json krun1.js


clean:
	rm -f aztec_pig_level1.json
	rm -f player_sprite.json
	rm -f krun1.js

player_sprite.json: player_animation/adventure_pig_angel_as_tiles.png player_animation/adventure_pig_as_tiles.png player_animation/adventure_pig_climbing_as_tiles.png player_animation/adventure_pig_dead_as_tiles.png
	python2.7 get_anims.py

aztec_pig_level1.json: aztec_pig_level1.tmx
	python2.7 map_optimize.py aztec_pig_level1.tmx aztec_pig_level1.json


krun1.js: game.js js/joystick.js js/joystick_keyboard.js js/joystick_swipe.js js/loader.js
	closure-compiler $(foreach src,$^,--js $(src)) --js_output_file krun1.js --warning_level VERBOSE --compilation_level ADVANCED_OPTIMIZATIONS --language_in ECMASCRIPT5_STRICT

install: aztec_pig_level1.json index.html krun1.js player_sprite.json
	cp aztec_pig_level1.json docs/
	cp index.html docs/
	cp krun1.js docs/
	cp player_sprite.json docs/

release: aztec_pig_level1.json frame.html krun1.js player_sprite.json
	mkdir -p rel
	cp aztec_pig_level1.json rel/
	cp frame.html rel/index.html
	cp krun1.js rel/
	cp player_sprite.json rel/
	rm -rf krun1.zip
	cd rel && zip -9 ../krun1.zip aztec_pig_level1.json index.html krun1.js player_sprite.json
