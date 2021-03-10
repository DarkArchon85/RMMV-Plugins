//=================================================================================
//  LordValinar Plugin - Animated Faces
//  LordV_AnimatedFaces.js
//=================================================================================

var Imported = Imported || {};
Imported["LordVAnimatedFaces"] = true;
var LordV = LordV || {};
LordV.AnimFaces = LordV.AnimFaces || {};

/*:
 * @plugindesc v1.3 - Animates faces during Show Text commands.
 * @author LordValinar
 *
 * @param Animated Faces Prefix
 * @desc Prefix to determine an animated face set.
 * @default anim_
 *
 * @param Minimum Animation Delay
 * @type number
 * @min 0
 * @max 9999
 * @desc Random delay before next animation
 * @default 90
 *
 * @param Maximum Animation Delay
 * @type number
 * @min 0
 * @max 9999
 * @desc Random delay before next animation
 * @default 240
 *
 * @param Maximum Idle Frames
 * @type number
 * @min 1
 * @desc How many frames to run an idle face animation
 * @default 2
 *
 * @param Maximum Speak Frames
 * @type number
 * @min 1
 * @desc How many frames to run speaking face animation
 * @default 3
 *
 * @help
 * ============================================================================
 * Setup
 * ============================================================================
 *
 * At bare minimum you'll need a face set that begins with the prefix, and 
 *   a number of frames on top for the Idle animation, and a number of frames 
 *   on the bottom for the Speaking animation.
 * Example: anim_Hero.png (see thread for generated character example)
 *
 * That's it!
 * If you want to change the maximum frames for either Idle or Speaking, or 
 *   if you want to change the minimum and maximum delay between animations,
 *   you can use the following Plugin Commands (not case-sensitive):
 *
 *   > AnimFace Set idleFrames# speakFrames# (ex: animface set 2 3)
 *   > AnimFace Delay minimum# maximum#      (ex: animface delay 90 120)
 *
 *   Or you can use the following script calls:
 *
 *   > $gameMessage.setAnimationFrames(idleFrames#, speakFrames#);
 *     Ex: $gameMessage.setAnimationFrames(2, 3);
 *
 *   > $gameMessage.setAnimationDelay(minimum#, maximum#);
 *     Ex: $gameMessage.setAnimationDelay(90, 120);
 *
 * ============================================================================
 * Credits
 * ============================================================================
 *
 * Myself (LordValinar) and Fogomax for the original (TTKMessagePlus) plugin.
 *  - Quite a few additions and modifications (and removal) went into forging
 *    a separate and new plugin for just animated faces, but I still wanted 
 *    to give credit where credit is due! And so should you!
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * v1.3 - Synchronized with MZ version (delay wasn't working properly)
 * v1.2 - Fixed a problem where speaking frames cap out at Idle frames
 * v1.1 - Added a 'stop' to the animation if there is a wait (\. \| codes)
 * v1.0 - Plugin finished
 *
 * ============================================================================
 * Terms Of Use
 * ============================================================================
 *
 * Free to use and modify for commercial and noncommercial games, with credit.
 * Do NOT remove my name from the Author of this plugin
 * Do NOT reupload this plugin (modified or otherwise) anywhere other than the 
 * RPG Maker MV main forums: https://forums.rpgmakerweb.com/index.php
 */

(function($) {
"use strict";

$.Params       = PluginManager.parameters('LordV_AnimatedFaces');
$.animPrefix   = $.Params['Animated Faces Prefix'];
$.animMinDelay = Number($.Params['Minimum Animation Delay']);
$.animMaxDelay = Number($.Params['Maximum Animation Delay']);
$.idleFrames   = Number($.Params['Maximum Idle Frames']);
$.speakFrames  = Number($.Params['Maximum Speak Frames']);

/**********************************************************************************
	rpg_objects.js
**********************************************************************************/

// --- GAME MESSAGE ---
$.gameMsg_init = Game_Message.prototype.initialize;
Game_Message.prototype.initialize = function() {
	$.gameMsg_init.call(this);
	this._minAnimDelay = $.animMinDelay;
	this._maxAnimDelay = $.animMaxDelay;
	this._animIdleFrames = $.idleFrames - 1;
	this._animSpeakFrames = $.speakFrames - 1;
};

// New - 
Game_Message.prototype.setAnimationDelay = function(min, max) {
	this._minAnimDelay = min;
	this._maxAnimDelay = max;
};

// New -
Game_Message.prototype.setAnimationFrames = function(idle, speak) {
	if (typeof idle === 'number' && idle > 0) {
		this._animIdleFrames = idle - 1;
	}
	if (typeof speak === 'number' && speak > 0) {
		this._animSpeakFrames = speak - 1;
	}
}

// New - 
Game_Message.prototype.animatedFace = function() {
	var length = $.animPrefix.length;
	return this._faceName.substring(0, length) === $.animPrefix;
};


// --- GAME INTERPRETER ---
$.gameInterpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    $.gameInterpreter_pluginCommand.call(this, command, args);
	if (command.toLowerCase() === "animface") {
		switch (args[0].toLowerCase()) {
			case 'delay': { // animface delay 60 180
				var min = Number(args[1]);
				var max = Number(args[2]);
				$gameMessage.setAnimationDelay(min, max);				
			} break;
			case 'set': { // animface set 2 4
				var idle = Number(args[1]);
				var speak = Number(args[2]);
				$gameMessage.setAnimationFrames(idle, speak);
			} break;
		}
	}
};

/**********************************************************************************
	rpg_scenes.js
**********************************************************************************/

$.sceneMap_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
	$.sceneMap_update.call(this);
	if ($gameMessage.hasText() && $gameMessage.animatedFace()) {
		this._messageWindow.updateFaceAnimation();
	}
};

/**********************************************************************************
	rpg_windows.js
**********************************************************************************/

$.windowMsg_init = Window_Message.prototype.initialize;
Window_Message.prototype.initialize = function() {
	$.windowMsg_init.call(this);
	this._animFaceSide = 'left';
	this._afIdleY		 = -1;
	this._afSpeakY 		 = -1;
	this._afMaxFrames    = 0;
	this._afSpeakFrames  = 0;
	this._afDelay 		 = [0,0];
	this._animFaceIndex	 = 0;
	this._afTick 		 = 0;
};

// New - Where the magic happens! (Credit: Fogomax for the original function I altered from)
Window_Message.prototype.updateFaceAnimation = function() {
	if (this._waitCount > 0) {
		this._animFaceSide = 'left';
		this._animFaceIndex = 0;
		this._animFaceWait = 0;
		this._afTick = 0;
		this.drawMessageFace();
	} else if (this._animFaceWait > 0) {
		this._animFaceWait--;
	} else {
		this._afTick++;
		if (this._afTick >= 6) {
			this._afTick = 0;
			if (this._animFaceSide == 'left') {
				this._animFaceIndex++;
				if ((this._animFaceIndex >= this._afMaxFrames && !this._textState) || (this._animFaceIndex >= this._afSpeakFrames && this._textState)) {
					this._animFaceSide = 'right';
				}
			} else {
				this._animFaceIndex--;
				if (this._animFaceIndex <= 0) {
					this._animFaceSide = 'left';
					if (this._afDelay[1] > 0 && (this._textState == null || this._afSpeakY < 0)) {
						var min = Math.ceil(this._afDelay[0]);
						var max = Math.floor(this._afDelay[1]);
						this._animFaceWait =  ~~(Math.random() * (max - min + 1) + min);
					}
				}
			}
			this.drawMessageFace();
		}
	}
};

// Alias - For each message, we ensure the values are updated so it is ongoing
$.windowMsg_start = Window_Message.prototype.startMessage;
Window_Message.prototype.startMessage = function() {
	$.windowMsg_start.call(this);
	if ($gameMessage.animatedFace()) {
		this._animFaceIndex = 0;
		this._animFaceWait = 0;
		this._afIdleY = 0;
		this._afSpeakY = 1;
		this._afDelay[0] = $gameMessage._minAnimDelay;
		this._afDelay[1] = $gameMessage._maxAnimDelay;
		this._afMaxFrames = $gameMessage._animIdleFrames;
		this._afSpeakFrames = $gameMessage._animSpeakFrames;
	}
};

// Alias - Animated faces update index by frame
$.windowMsg_drawMsgFace = Window_Message.prototype.drawMessageFace;
Window_Message.prototype.drawMessageFace = function() {
	if ($gameMessage.animatedFace()) {
		var faceName = $gameMessage.faceName();
		$gameMessage.setFaceImage(faceName, this._animFaceIndex);
	}
	$.windowMsg_drawMsgFace.call(this);
};

// Alias - Animated faces get drawn specifically
$.windowMsg_drawFace = Window_Message.prototype.drawFace;
Window_Message.prototype.drawFace = function(faceName, faceIndex, x, y, width, height) {
	var anim = $gameMessage.animatedFace();
	if (anim) {
		width = width || Window_Base._faceWidth;
		height = height || Window_Base._faceHeight;
		var bitmap = ImageManager.loadFace(faceName);
		var pw = Window_Base._faceWidth;
		var ph = Window_Base._faceHeight;
		var sw = Math.min(width, pw);
		var sh = Math.min(height, ph);
		var dx = Math.floor(x + Math.max(width - pw, 0) / 2);
		var dy = Math.floor(y + Math.max(height - ph, 0) / 2);
		var sx = faceIndex * pw;
		var sy;
		if (this._afSpeakY >= 0 && this._textState) {
			sy = ph * this._afSpeakY;
		} else if (anim && this._afIdleY >= 0 && !this._textState) {
			sy = ph * this._afIdleY;
		}
		this.contents.clearRect(dx, dy, pw, ph);
		this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy);		
	} else {
		$.windowMsg_drawFace.call(this, faceName, faceIndex, x, y, width, height);
	}
};

})(LordV.AnimFaces);