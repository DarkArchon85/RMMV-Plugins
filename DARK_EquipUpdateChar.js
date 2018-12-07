/*:
 * @plugindesc Runs a specific common event when an item is equpped or unequpped from a certain slot (Default slot is 4 = Body) [v1.0]
 *
 * @author DarkSorcerer
 *
 * @param CommonEventID
 * @desc This is the Common Event ID to run when an item is changed
 * @default 1
 *
 * @param SlotID
 * @desc This is the Equipment Type ID of the item to be effected
 * @default 4
 *
 * @param VariableID
 * @desc The variable to save the actor ID to - use in your common event 
 *  These are typically the ActorIDs, so keep track of this number somehwere
 * @default 1
 *
 * @param ActorID
 * @desc The actor(s) who equip the item defined by SlotID will trigger the 
 *  plugin. IDs: Single(2), Multi(1,3,5), or All(0)
 * @default 0
 *
 *
 * @help
 * 
 * THE SETUP:
 * First create all the different character sprites you wish to use; For example 
 *  one with clothes, one with light armor, medium armor, and heavy armor. These
 *  will be the charsets the common event (see below) will change to if the 
 *  conditions are met. Make sure to also make the 4 armors (Equipment Type: Body)
 *  as well of course..
 * Next we create a variable. Let's call it "ActorSelector". When this plugin
 *  runs, it will assign the variable the ActorID at the time of the call, so 
 *  your common event (next step) needs to check for this ID first! Example:
 *  If : ActorSelector = 1 // Harold by default 
 *    If: Harold has equipped Cloth 
 *      Set Movement Route : Player (wait)
 *      :                  : <>Image: whatever here
 *    Else
 *      Set Movement Route : Player (wait)
 *      :                  : <>Image: default image
 *    End
 *  End
 * Then create the common event (corrisponding with the ID above) to swap out the 
 *  character set based on which item was equipped. Using our default SlotID (4) 
 *  which is the Body equipment type, then if [Clothing] was equipped, we change 
 *  the appearance to charset 'clothed'; If [LightArmor] was equipped, we change 
 *  the appearance to charset 'light'; and so on.
 * Finally place the common event ID into the plugin parameter, and ensure the 
 *  SlotID parameter (for this example) is set to 4 (Body).
 *
 * SLOTS:
 * By default this plugin runs a common event based on the Body(Slot 4) item slot, whether an item was equipped or unequipped there. You can change this to which ever number you desire. The item slots depend on your database's information under TYPES > Equipment Types
 *
 * How to Use:
 * This Plugin simply updates the actor's charset when an item is (un)equipped in slot [SlotID Parameter]
 * Setup the common event to be run and place that common event ID into the parameter 
 */

(function() {
	var DARK = DARK || {};
	DARK.params = PluginManager.parameters('DARK_EquipUpdateChar');
	DARK.CommEv = Number(DARK.params['CommonEventID'] || 1);
	DARK.EquipType = Number(DARK.params['SlotID'] || 4);
	DARK.VarID = Number(DARK.params['VariableID'] || 1);
	DARK.ActorID = String(DARK.params['ActorID']).split(',');
	
	var _alias_changeEquip = Game_Actor.prototype.changeEquip;
	Game_Actor.prototype.changeEquip = function(slotId, item) {
		if (Number(DARK.ActorID[0]) === 0 || this.isActorInMyArray(this._actorId)) {
			if (this.equipSlots()[slotId] == DARK.EquipType) {
				$gameVariables.setValue(DARK.VarID, this._actorId);
				$gameTemp.reserveCommonEvent(DARK.CommEv);
			}
		}
		_alias_changeEquip.call(this, slotId, item);
	};
	
	Game_Actor.prototype.isActorInMyArray = function(actorId) {
		for (var i = 0; i < DARK.ActorID.length; i++) {
			if (Number(DARK.ActorID[i]) == actorId) return true;
		}
		return false;
	}
})();