// Hey there!
// This is CODE, lets you control your character with code.
// If you don't know how to code, don't worry, It's easy.
// Just set attack_mode to true and ENGAGE!
// To Do:
/*
show dps
show_json(character.attack * character.frequency * damage_multiplier(500 - (2 * character.apiercing)) * (1 + (character.crit / 100) * (1 + (character.critdamage) / 100)))

event times: 
1 - eastland
7 - europas 1
8 - eastland
11 - eastland
13 - us 1
14 - europas 1
17 - europas 1
20 - us 1
23 - us 1
	if(parent.S.franky && !get_nearest_monster({type:'franky'}))
		join('franky');
		if(parent.S.abtesting && character.map!="abtesting")
		join('abtesting');
		
JSON.parse(localStorage.sell_array)
remove get_global_variables from all defaults and put in each one.
test
*/


var PARTYARRAY = ["Gibson", "Carvin"];
var state = "start";
var SELLARRAY = ["ringsj", "vitring", "hpbelt", "hpamulet", "wgloves","wshoes", "wcap", "wbreeches", "wshoes", "wshield", "wattire","beewings","frogt","vitscroll","smush","sstinger","carrot","lspores","mushroomstaff","swifty","rattail","dstones","vitearring"];
var group_mode = true;
var default_monster = "bbpompom";
var current_monster = ["bbpompom"];
var special_targets = ["mvampire","phoenix","goldenbat","tinyp","crabxx","cutebee","frog","greenjr","jr","snowman","franky","rgoo","pinkgoo","bgoo"];
var step_counter = 0;
var ready_counter = 0;
var monster_hunting = true;
var hunt_targets = ["none","none","none"];
var hunt_list = ["goo","bee","crab","crabx","minimush","snake","rat","squig","arcticbee","armadillo","bat","croc","iceroamer","poisio","tortoise","squigtoad","spider","scorpion","bbpompom","ghost","frog","stoneworm","gscorpion","boar","cgoo","plantoid","xscorpion","greenjr","jr","mvampire","phoenix","gscorpion","wolfie"];
var did_set_global_variables = false;
var just_logged = true;
var bossing = false;
var waiting_delay = 0;
var event_name = false;


function set_global_variables() {
	set("sell_array", SELLARRAY);
	set("group_mode", group_mode);
	set("default_monster", default_monster);
	set("current_monster", current_monster);
	set("special_targets", special_targets);
	set("monster_hunting", monster_hunting);
	set("hunt_targets", hunt_targets);
	set("hunt_list", hunt_list);
	set("bossing", bossing);
	
	did_set_global_variables = true
}

function get_global_variables() {
	SELLARRAY = get("sell_array");
	group_mode = get("group_mode");
	default_monster = group_mode ? get("default_monster") : default_monster
	current_monster = group_mode ? get("current_monster") : current_monster
	special_targets = group_mode ? get("special_targets") : special_targets
	monster_hunting = get("monster_hunting");
	hunt_targets = get("hunt_targets");;
	hunt_list = get("hunt_list"); //can also do frog
}

load_code("fighter default"); // standard functions and interval

setInterval(function() {
	
	if (event_name) {
		return;
	}
	
	check_events();
	
	if (!did_set_global_variables) {
		set_global_variables();
		return;
	} 

	get_global_variables();
	
	check_heal();
	check_partyheal();
	
	if (state == "ready") {
		move_to_monster();
		return;
	}
	
	if (state == "waiting for team" && !smart.moving) {
		waiting_delay++
		if (waiting_delay > 500) {//roughly 2 min
			just_logged = true;
			state = "start";
			return;
		}
		ready_check();
		set_hunt();
		return;
	}
	
	if (state == "preparing group") {
		send_location_to_group();
		return;
	}

	if (state == "start") {
		waiting_delay = 0;
		if (group_mode) {
			if(!monster_hunting){
				meet_at_town("normal");
			} else {
				meet_at_town("hunt");
				return;
			}
		} else {
			move_to_monster();
		}
	}
	
	if(state == "meet_at_task") {
		get_task()
		return;
	}
	
	if (monster_hunting) {
		check_monsterhunt();
	} 

	if (character.rip || state != "attack") return;
		
	if (state=="attack") {
		attack_pattern();
		if (group_mode) {
			follow_leader();
		}
	}
	
	check_curse();
	//check_darkblessing(); requires lvl 70
	
	
}, 1000 / 4); // Loops every 1/4 seconds.

//Event Interval
setInterval(function() {
	if (!event_name)	return;
	if (state == "moving") {
		return;
	}
	follow_leader();
	attack_pattern()
	state = "start";
	check_events();
}, 1000/4);

function check_monsterhunt() {
	var no_hunt_count = 0;
	if (character.s.monsterhunt) {
		if (character.s.monsterhunt.c == 0) {
		set("hunt_targets", ["completed", get("hunt_targets")[1], get("hunt_targets")[2]]);
		} else if (character.s.monsterhunt.id != get("hunt_targets")[0]) {
			set("hunt_targets", [character.s.monsterhunt.id, get("hunt_targets")[1], get("hunt_targets")[2]]);
		}
	} else if (get("hunt_targets")[0] != "none") {
		set("hunt_targets", ["none", get("hunt_targets")[1], get("hunt_targets")[2]]);
	} for (var i in get("hunt_targets")) {
		if (get("hunt_targets")[i] == "completed" && !smart.moving ){
			state = "start";
			return;
		}
	}
	for (var i in get("hunt_targets")) {
		if (get("hunt_targets")[i] == "none") {
			no_hunt_count++;
		}
		if (hunt_list.includes(get("hunt_targets")[i])) {
			current_monster[0] = get("hunt_targets")[i]
			set("current_monster",[get("hunt_targets")[i]]);
			return;
		}
	}
	if (no_hunt_count > 0 && !smart.moving && state != "waiting for team") {
		state = "start";
		game_log(state)
	} else if (no_hunt_count == 0) {
		if (current_monster[0] != default_monster) {
			current_monster[0] = default_monster;
			set("current_monster",[default_monster]);
			state = "start";
		}
	}
}

function set_hunt() {
	if(character.s.monsterhunt) {
		set("hunt_targets", [character.s.monsterhunt.id, get("hunt_targets")[1], get("hunt_targets")[2]]);
	}
}

function meet_at_town(task) {
	state = "moving";
	smart_move({to:"exchange"}, function(done) {
		if (task == "hunt") {
			interact("monsterhunt");
		} if (character.s.monsterhunt) {
			if (character.s.monsterhunt.c == 0 ) {
				state = "meet_at_task";
				set("hunt_targets", ["none", get("hunt_targets")[1], get("hunt_targets")[2]]);
				return;
			}
		}
		state = "waiting for team";
	});
}

function get_task() {
	interact("monsterhunt");
	state = "ready";
}

function move_to_monster() {
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

function follow_leader() {
	var leader = get_player("Gibson");
		if (leader) {
			if(get_distance_from("Gibson") > 250 && !smart.moving) {
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

function ready_check() {
	if (ready_counter >= 2) {
		state = "ready";
		ready_counter = 0;
	}
}

function on_cm(name, data) {
	if (data == "meet at task") {
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
	if (smart.moving) return;
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