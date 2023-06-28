

setInterval(function() {
	
	if (state = "finding boss") {

	}
}, 1000 / 4); // Loops every 1/4 seconds.


function move_to_boss() {
	var monster
	if (group_mode) {
		state = "preparing group";	
		if (character.s.monsterhunt) {
			if (hunt_list.includes(character.s.monsterhunt.id)) {
				monster = character.s.monsterhunt.id;
				game_log(monster);
				smart_move(monster, function(done) {
					state = "attack";
				});
				return;
			} 
		}
		if (get_player("Gibson")) {
			if (get_player("Gibson").s.monsterhunt) {
				if (hunt_list.includes(get_player("Gibson").s.monsterhunt.id)) {
					monster = get_player("Gibson").s.monsterhunt.id;
					game_log(monster);
					smart_move(monster, function(done) {
						state = "attack";
					});
					return;
				}
			}
		}
		if (get_player("Carvin")) {
			if (get_player("Carvin").s.monsterhunt) {
				if (hunt_list.includes(get_player("Carvin").s.monsterhunt.id)) {
					monster = get_player("Carvin").s.monsterhunt.id;
					game_log(monster);
					smart_move(monster, function(done) {
						state = "attack";
					});
					return;
				}
			}
		 }
		 if (!monster) {
			monster = default_monster;
		}
	} else {
		monster = default_monster;
		state = "moving";
	}
	game_log(monster);
	smart_move(monster
		, function(done) {
			state = "attack";
		});
}


function send_location_to_group() {
	game_log(get("hunt_targets"));
	if (!smart.found && smart.searching) {
		send_cm(PARTYARRAY,{x:smart.x,y:smart.y,map:smart.map});
		state = "moving";
	}
}


function trip_to_town(send_message) {
	state = "moving"
	if (group_mode && send_message) {
		send_cm(PARTYARRAY, "meet at task");
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
					sell(i, character.items[i].q);
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
				meet_at_town("normal");
			} else {
				game_log("Got the potions!", "#4CE0CC");
				smart_move({
					x: x,
					y: y,
					map: map
				}, function(done) {
				state = "start"});
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
			if(get_player("Gibson")) {
				target = get_target_of(get_player("Gibson"));
				if (target) {
					change_target(target);
					return;
				}
			}
		} else {
			for(i in parent.entities) {
				var entity = parent.entities[i];
				if (special_targets.includes(entity.mtype)) {
					change_target(entity);
					return;
				}
			}
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
			if (!current_monster.includes(target.mtype) && !special_targets.includes(target.mtype)) {
				change_target(null);
				return;
			
		}
		if (!is_in_range(target)) {
			move(
				character.x + (target.x - character.x) / 2,
				character.y + (target.y - character.y) / 2
			);
			// Walk half the distance
		} else {
			if (can_attack(target)) {
				attack(target);
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
			if(get_distance_from("Gibson") > 250) {
			state = "moving"
			smart_move({
				x: leader.real_x,
				y: leader.real_y,
				map: leader.map
			}, function(done) {
				state = "attack"
			});
		} else if (get_distance_from("Gibson") > 160) {
			move(
				character.x + (leader.x - character.x) / 2,
				character.y + (leader.y - character.y) / 2
			);
		}
	}
}

function check_partyheal() {
	if (is_on_cooldown("partyheal") || character.mp < 400) {
		return;	
	}
	var gibson = get_player("Gibson");
	var carvin = get_player("Carvin");
	if (gibson) {
		if (gibson.max_hp - gibson.hp >1500) {
			use_skill("partyheal");
			return;
		}
	}
	if (carvin) {
		if (carvin.max_hp - carvin.hp >1500) {
			use_skill("partyheal");
			return;
		}
	}
	if (character.max_hp - character.hp > 1500) {
			use_skill("partyheal");
			return;
	}
	
	
}

function check_heal() {
	if (is_on_cooldown("heal") || character.mp == 0 ) {
		return;	
	}
	var gibson = get_player("Gibson");
	var carvin = get_player("Carvin");
	if (gibson) {
		if (gibson.max_hp - gibson.hp >1000) {
			use_skill("heal", gibson);
		}
	}
	if (carvin) {
		if (carvin.max_hp - carvin.hp >1000) {
			use_skill("heal", carvin);
		}
	}
	if (character.max_hp - character.hp > 1000) {
			use_skill("heal", character);
	}
}

function check_curse() {
	if(get_targeted_monster()) {
		if (character.mp > 400 && !is_on_cooldown("curse") && get_targeted_monster().hp > 3000) {
			use_skill("curse",get_targeted_monster());
		}
	}
}

function check_darkblessing() {
	if(get_player("Gibson")) {
	   if (!is_on_cooldown("darkblessing") && character.mp > 900) {
		   use_skill("darkblessing",get_player("Gibson"));
	   }
	}
}

function check_pots() {
	if (character.mp < 600 && !is_on_cooldown("use_mp")) {
		use("use_mp");
	} else if (character.hp < character.max_hp - 400 && !is_on_cooldown("use_hp")) {
		use("use_hp");
	} else if (character.mp < character.max_mp - 500 && !is_on_cooldown("use_mp")) {
		use("use_mp");
	}
}

function ready_check() {
	if (ready_counter >= 2) {
		state = "ready";
		ready_counter = 0;
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

function on_cm(name, data) {
	if (data == "return to town") {
		trip_to_town(false);
		message_received = true;
	} else if (data == "meet at task") {
		state = "start";
	} else if (data == "ready") {
		ready_counter++;
	} 
}

character.on("stacked",function(data){
	move(
		character.x + 5,
		character.y + 5
	);
});

function check_events() {
	if(parent.S.franky && !get_nearest_monster({type:'franky'})){
		join('franky');
		event_name = "franky";
		smart.moving = false;
		return;
	}
	if(parent.S.abtesting && character.map!="abtesting"){
		join('abtesting');
		event_name = "abtesting";
		smart.moving = false;
		return;
	}
	if(parent.S.snowman &&  !get_nearest_monster({type:'snowman'})){
		join('snowman');
		event_name = "snowman";
		state = "moving";
		smart_move("arcticbee",function(done) {
			state = "start";
		});
		return;
	}
	if(parent.S.goobrawl && character.map!="goobrawl"){
		join('goobrawl');
		event_name = "goobrawl";
		return;
	}
	if(parent.S.crabxx && !get_nearest_monster({type:'crabxx'})){
		join('crabxx');
		event_name = "crabxx";
	}
	
	
	if(event_name) {
		if(!parent.S.goobrawl && !parent.S.snowman && !parent.S.abtesting && !parent.S.franky && !parent.S.crabxx) {
		   	event_name = false;
			state = "start";
		}
	}
}



// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland