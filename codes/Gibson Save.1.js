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

var PARTYARRAY = ["Carvin", "Epiphone"]
var state = "start"
var SELLARRAY
var group_mode
var default_monster
var current_monster
var special_targets
var monster_hunting 
var hunt_targets 
var hunt_list 
var just_logged = true;
var waiting_delay = 0;
var event_name = false;

function get_global_variables() {
	SELLARRAY = get("sell_array");
	group_mode = get("group_mode");
	default_monster = group_mode ? get("default_monster") : "franky";
	current_monster = group_mode ? get("current_monster") : ["franky"];
	special_targets = group_mode ? get("special_targets") : ["squigtoad"];
	monster_hunting = get("monster_hunting");
	hunt_targets = get("hunt_targets");;
	hunt_list = get("hunt_list"); //can also do frog
}

load_code("fighter default"); // standard functions and interval

setInterval(function() {
	
	get_global_variables();
	
	if (event_name) {
		return;
	}
	
	check_events();
	
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
	if (state == "waiting for team") {
		ready_check();
		return;
	}
	if (state == "ready") {
		set_hunt();	
		return;
	}
	
	if(state == "meet_at_task") {
		get_task()
		return;
	}
	
	if (state == "awaiting orders") {
		waiting_delay++
		if (waiting_delay > 500) {//roughly 2 min
			just_logged = true;
			state = "start";
			return;
		}
	}
	
	if (monster_hunting && state != "awaiting orders") {
		check_monsterhunt();
	}
	
	
	
	if(state == "town" && !is_on_cooldown("charge")) {
		//use_skill("charge");
	}

	if (character.rip || state != "attack") return;
	
	attack_pattern();
	if (group_mode) {
		//check_warcry();
	}
	check_taunt();
	//check_cleave();
	check_charge();
	check_hardshell();
	
	
}, 1000 / 4); // Loops every 1/4 seconds.

// Event Interval
setInterval(function() {
	if (!event_name)	return;
	if (state == "moving") 	return;
	attack_pattern()
	state = "start";
	check_events();
}, 1000/4);

setInterval(function() {
	send_party_invites();
}, 60000); // Loops every minute

function check_monsterhunt() { //get hunt targets as var and set targets[i] then set the localstorage
	var no_hunt_count = 0;
	if (character.s.monsterhunt) {
		if (character.s.monsterhunt.c == 0) {
		set("hunt_targets", [get("hunt_targets")[0], "completed", get("hunt_targets")[2]]);
		} else if (character.s.monsterhunt.id != get("hunt_targets")[1]) {
		set("hunt_targets", [get("hunt_targets")[0], character.s.monsterhunt.id, get("hunt_targets")[2]]);
		}
	} else if (get("hunt_targets")[1] != "none") {
		set("hunt_targets", [get("hunt_targets")[0], "none", get("hunt_targets")[2]]);
	} for (var i in get("hunt_targets")) {
		if (get("hunt_targets")[i] == "completed" && !smart.moving  ){
			game_log("completed");
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
		game_log(state);
	} else if (no_hunt_count == 0) {
		if (current_monster[0] != default_monster) {
			current_monster[0] = default_monster;
			state = "start";
		}
	}
}

function set_hunt() {
	if(character.s.monsterhunt) {
		set("hunt_targets", [get("hunt_targets")[0], character.s.monsterhunt.id, get("hunt_targets")[2]]);
	} 
	state = "waiting for team";
}

function meet_at_town(task) {
	state = "moving";
	smart_move({to:"exchange"}, function(done) {
		if (task == "hunt") {
			interact("monsterhunt");
		} if (character.s.monsterhunt) {
			if (character.s.monsterhunt.c == 0 ) {
				state = "meet_at_task";
				set("hunt_targets", [get("hunt_targets")[0], "none", get("hunt_targets")[2]]);
			} else {
				state = "ready";
			}
		} else {
			state = "ready";
		}
	});
}

function get_task() {
	interact("monsterhunt");
	state = "ready";
}

function ready_check() {
	send_cm("Epiphone","ready");
	state = "awaiting orders";
}

function move_to_monster() {
	state = "moving";

	smart_move(current_monster[0]
		, function(done) {
			state = "attack";
		});
}

function attack_pattern() {
	
	var target = get_targeted_monster();
	
	if (!target) {
		if (group_mode) {
			for(i in parent.entities) {
				entity = parent.entities[i];
				if (entity.target) {
					if (PARTYARRAY.includes(entity.target) || entity.target == "Gibson") {
						if (current_monster.includes(entity.name)) {
							target = entity
							change_target(target);
							return;
						}
					}
				}
			}
			for(i in parent.entities) {
				entity = parent.entities[i];
				if (special_targets.includes(entity.mtype)) {
					change_target(entity);
					state = "moving";
					smart_move({x:entity.x, y:entity.y}, function (done) {
						state = "attack";
					});
					return;
				}
			}
		}
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
	} else {
		if (target.name == "Target Automatron") {
			log("Target Automatron found, changing targets");
			change_target(null);
		}
		
		if (!current_monster.includes(target.mtype) && !special_targets.includes(target.mtype)) {
			change_target(null);
		} else {
			if (!is_in_range(target)) {
				move(
					character.x + (target.x - character.x) / 2,
					character.y + (target.y - character.y) / 2
				);
				// Walk half the distance
			} else {
				if (can_attack(target)) {
					attack(target);
				}
			}
		}
	}
}

function check_taunt() {
	if (group_mode) {
			for(i in parent.entities) {
				entity = parent.entities[i];
				if (entity.target) {
					if (PARTYARRAY.includes(entity.target)) {
						if (entity.type == "monster" && !is_on_cooldown("taunt")) {
							target = entity
							change_target(target);
							if (is_in_range(entity,"taunt")) {
								use_skill("taunt",entity);
							}
							return;
						}
					}
				}
			}
		}
}

function send_party_invites() {
  if(!get_party()["Draxious"]) {
    //send_party_request("earthWar");
  }
  if(!get_party()["Epiphone"]) {
    send_party_invite("Epiphone",false);
  }

  if(!get_party()["Carvin"]) {
    send_party_invite("Carvin");
  }
}

function check_hardshell() {
	if (character.max_hp - character.hp > 1000 && !is_on_cooldown("hardshell")) {
		if (character.mp > 480) {
			use_skill("hardshell");
		} else {
			use("use_mp");	
		}
	}
}

function check_cleave() {
	if(!is_on_cooldown("cleave") && character.mp > 720) {
		if(can_attack(get_targeted_monster())) {
			use_skill("cleave");	
		}
	}
}

function check_charge() {
	if(!is_on_cooldown("charge")) {
		use_skill("charge");	
	}
}

function check_warcry() {
	if (!is_on_cooldown("warcry")) {
		use_skill("warcry");
	}
}

function on_cm(name, data) {
	game_log("message received");
	if (data == "meet at task") {
		state = "start";
	} else if (name == "Epiphone" && group_mode == true && get_player("Epiphone")) { 
		cruise(get_player("Epiphone").speed + 1);
		state = "moving";
		smart_move(data,function(done) {
			state="attack";
			cruise(500);
		});
	}
}

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
	
	
	if(event_name) {
		if(!parent.S.goobrawl && !parent.S.snowman && !parent.S.abtesting & !parent.S.franky) {
		   	event_name = false;
			state = "start";
		}
	}
}



// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland