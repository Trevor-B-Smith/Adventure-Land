// Hey there!
// This is CODE, lets you control your character with code.
// If you don't know how to code, don't worry, It's easy.
// Just set attack_mode to true and ENGAGE!
// To Do:
/*
- finish interaction for attacking
- set up merchant
- Group tp to home and run back
- Auto add party
- Follow leader (done)


*/

var leader_name = "Gibson"
var PARTYARRAY = ["Gibson", "Yamaha"]
var SKILLARRAY = ["supershot", "huntersmark", "use_town"]
var state = "moving"
var SELLARRAY = ["ringsj", "vitring", "hpbelt", "hpamulet", "wshoes", "wcap", "wbreeches", "wshoes", "wshield", "wattire","crabclaw"]
var group_mode = false;
var default_monster = "minimush";
var current_monster = ["bat"];
var step_counter = 0;
var monster_hunting = true;
var hunt_active = false;
var helping = false;
var hunt_list = ["hen","goo","bee","crab","crabx","minimush","osnake","snake","rat","squig","arcticbee","armadillo","bat","croc","iceroamer","poisio","porcupine","tortoise","squigtoad","spider","scorpion"];

setInterval(function() {
	if (monster_hunting && state != "moving") {
		if(!character.s.monsterhunt) {
			get_monsterhunt();
			return;
		} else {
			hunt();
		}
	}
	
	if (state == "start") {
		if (group_mode) {
			state = "attack";
		} else {
			move_to_monster();	
		}
	}
	
	if (character.hp < character.max_hp - 400 && !is_on_cooldown("use_hp")) {
		use("use_hp");
	}
	if (character.mp < character.max_mp - 500 && !is_on_cooldown("use_mp")) {
		use("use_mp");
	}
	loot();

	if (character.rip || state != "attack") return;
	if (character.items[0].q < 100 || character.items[1].q < 100 || character.esize == 0) {
		trip_to_town(true)
		return;
	}
	
	if (state=="attack") {
		attack_pattern();
		if (group_mode) {
			follow_leader();
			stun();
		}
	}
	


}, 1000 / 4); // Loops every 1/4 seconds.

setInterval(function() {
	request_hunt_help()
}, 60000);

function move_to_monster() {
	state = "moving"
	smart_move(current_monster[0]
		, function(done) {
			state = "attack";
		});
}

function get_monsterhunt() {
	helping = null;
	state = "moving";
	smart_move({to:"exchange"}, function(done) {
		interact("monsterhunt");
		state = "start";
	});
}

function hunt() {
	if (hunt_list.includes(character.s.monsterhunt.id) && current_monster[0] != character.s.monsterhunt.id) {
		current_monster[0] = character.s.monsterhunt.id;
		hunt_active = true;
		state="start";
	} else if (!hunt_list.includes(character.s.monsterhunt.id) && current_monster[0] != default_monster && !helping) {
		current_monster[0] = default_monster;
		hunt_active = false;
		state = "start";
	} else if (character.s.monsterhunt.c == 0) {
		state = "moving";
		send_cm(PARTYARRAY,"hunt finished");
		smart_move({to:"exchange"}, function(done) {
			interact("monsterhunt");
			get_monsterhunt();
		});
	}
}

function trip_to_town(send_message) {
	state = "moving"
	if (group_mode && send_message) {
		send_cm(PARTYARRAY, "return to town");
	}
	var x = character.real_x,
		y = character.real_y,
		map = character.map;
	smart_move({
		to: "potions"
	}, function(done) {
		var hpots = character.items[0].q
		var mpots = character.items[1].q
		if (hpots < 8000) {
			buy("hpot1", 8000 - hpots);
		}
		if (mpots < 8000) {
			buy("mpot1", 8000 - mpots);
		}
		for (var i = 3; i < 43; i++) {
			if (character.items[i]) {
				if (SELLARRAY.includes(character.items[i].name)) {
					sell(i, 1);
				}
			}
		}

		smart_move({
			to: "bank"
		}, function(done) {
			if (character.gold > 2000000) {
				bank_deposit(character.gold - 2000000);
			}
			store_items();
			if (group_mode) {
				smart_move({to: "potions"
				}, function(done) {
					message_received = false;
				});
			} else {
				game_log("Got the potions!", "#4CE0CC");
				smart_move({
					x: x,
					y: y,
					map: map
				}, function(done) {
				state = "start";
				});
			}
		});
	});
}

function store_items() {
	for (var i = 3; i < character.isize; i++) {
		if (character.items[i]) {
			let current_item = character.items[i];
			if (current_item.q) {
				bank_store(i, "items1");
			} else if (is_compoundable(i)) {
				bank_store(i, "items3");
			} else if (is_upgradeable(i)) {
				if (G.items[current_item.name].type == "weapon") {
					bank_store(i, "items0");
				} else {
					bank_store(i, "items2");
				}
			}
			bank_store(i, "items4");
		}
	}
}

function attack_pattern() {
	var target = get_targeted_monster();
	
	if (!target) {
		if (group_mode) {
			if (group_mode) {
				if(get_player("Gibson")) {
					target = get_target_of(get_player("Gibson"));
					if (target) {
						change_target(target);
						return;
					}
				}
			}
		} else {
			for (i in current_monster){
				target = get_nearest_monster({type: current_monster[i]});
				if (target) {
					change_target(target);
					break;
				}
			}
		}
	} else {
		if (target.name == "Target Automatron") {
			log("Target Automatron found, changing targets");
			change_target(null);
		}
		if (!group_mode) {
			if (!current_monster.includes(target.mtype)) {
				change_target(null);
				return;
			} 
		}
		if (!is_in_range(target)) {
			move(
				character.x + (target.x - character.x) / 2,
				character.y + (target.y - character.y) / 2
			);
			// Walk half the distance
		} else {
			if (can_attack(target)) {
				set_message("Attacking");
				if (G.skills.huntersmark.mp < character.mp && !target.s.marked && !is_on_cooldown("huntersmark")) {
						use_skill("huntersmark", target);
					} else if (G.skills.supershot.mp < character.mp && !is_on_cooldown("supershot")) {
						use_skill("supershot", target);
					} else {
						attack(target);
					}
				if(!group_mode) {
					strafe();
				}
			}
		}
	}
}

function strafe() {
	if (step_counter < 2) { 
		move(character.x + 80,character.y + 80);
	} else if (step_counter < 4) {
		move(character.x - 80,character.y + 80);
	} else if (step_counter < 6) {
		move(character.x - 80,character.y - 80);
	} else {
		move(character.x + 80,character.y - 80);
	}
	if (step_counter >= 7) step_counter = -1;
	
	step_counter++;
}

function get_distance_from(entityName) {
	var entity = get_entity(entityName);
	if (entity) {
	var distance = Math.abs(entity.x - character.x) + Math.abs(entity.y - character.y)
	return distance;
	}
}

function follow_leader() {
	var leader = get_player("Gibson");
		if (leader) {
			if(get_distance_from("leader_name") > 250) {
			state = "moving"
			smart_move({
				x: leader.real_x,
				y: leader.real_y,
				map: leader.map
			}, function(done) {
				state = "attack"
			});
		} else if (get_distance_from(leader_name) > 100) {
			move(
				character.x + (leader.x - character.x) / 2,
				character.y + (leader.y - character.y) / 2
			);
		}
	}
}

function stun() {
	if (is_on_cooldown("4fingers")) {
		return;	
	}
	var gibson = get_player("Gibson");
	
	if (gibson) {
		if (gibson.max_hp - gibson.hp > 2000 && gibson.target) {
			use_skill("4fingers",gibson.target)
		}
	}
}

function request_hunt_help() {
	if (hunt_active) {
		send_cm(PARTYARRAY, character.s.monsterhunt.id);
	}
}

function is_compoundable(invSlot) {
	let compItem = character.items[invSlot];
	return G.items[compItem.name].compound;
}

function is_upgradeable(invSlot) {
	let compItem = character.items[invSlot];
	return G.items[compItem.name].upgrade;
}

function on_party_invite(name) {
	if (PARTYARRAY.includes(name)) {
		accept_party_invite(name);
	}
}

function on_magiport(name) {
	if (name == "Yamaha") {
		state="attack"
		accept_magiport("Yamaha");
	}
}

function on_cm(name, data) {
	if (data == "return to town") {
		trip_to_town(false);
		message_received = true;
	} else if (data == "ready to return") {
		ready_counter++;
	} else if (G.monsters[data] && !hunt_active && current_monster[0] != data && state != "moving") {
		current_monster[0] = data;
		helping = name;
		state = "start";
	} else if (helping) {
		if (data == "hunt finished" && name == helping) {
			helping = null;
			current_monster[0 ]= default_monster;
			state = "start";
		}
	}
}



// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland