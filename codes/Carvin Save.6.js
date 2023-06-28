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
-monsters that add int - bbpompom, squigtoad, 
frog, boar, ghost, gscorpion, pppompom, 
fireroamer, plantoid, phoenix


*/

var PARTYARRAY = ["Gibson", "Epiphone"]
var state = "start"//get("state");
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
	hunt_targets = get("hunt_targets");
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
		get_task();
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
	
	if (monster_hunting&& state != "awaiting orders") {
		
		check_monsterhunt();
	}
	
	
	
	check_speed();
	
	if (character.rip || state != "attack") return;
	
	//check_mental_burst(); requires int64
	
	if (state=="attack") {
		attack_pattern();
		if (group_mode) {
			follow_leader();
		}
	}	
	
}, 1000 / 4); // Loops every 1/4 seconds.

// Event Interval
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
		set("hunt_targets", [get("hunt_targets")[0], get("hunt_targets")[1], "completed"]);
		} else	if (character.s.monsterhunt.id != get("hunt_targets")[2]) {
			set("hunt_targets", [get("hunt_targets")[0], get("hunt_targets")[1], character.s.monsterhunt.id]);
		}
	} else if (get("hunt_targets")[2] != "none") {
		set("hunt_targets", [get("hunt_targets")[0], get("hunt_targets")[1], "none"]);
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
	if (no_hunt_count > 0 && !smart.moving) {
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
		set("hunt_targets", [get("hunt_targets")[0], get("hunt_targets")[1], character.s.monsterhunt.id]);
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
				set("hunt_targets", [get("hunt_targets")[0], get("hunt_targets")[1], "none"]);
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
			}
		}
	}
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
			move(character.x + (leader.x - character.x) / 2, character.y + (leader.y - character.y) / 2);
		}
	}
}

//requires int 64
function check_mental_burst() {
	if (is_on_cooldown("mentalburst") || character.mp < 180) {
		return;	
	}
	var target = get_targeted_monster();
	if (target) {
		if(is_in_range(target,"mentalburst")) {
				
		}
	}
}

function check_speed() {
	var gibson = get_player("Gibson");
	var epiphone = get_player("Epiphone");
	if (character.mp >= 320) {
		if (gibson) {
			if (!gibson.s.rspeed && is_in_range(gibson,"rspeed")) {
				
				use_skill("rspeed", gibson);
				return;
			}
		}
		if (epiphone) {
			if (!epiphone.s.rspeed && is_in_range(epiphone,"rspeed")) {
				use_skill("rspeed", epiphone);
				return;
			}
		}
		if (!character.s.rspeed) {
			use_skill("rspeed", character);
			return;
		}
	}
}

function on_cm(name, data) {
	if (data == "meet at task") {
		state = "start";
	}  else if (name == "Epiphone" && group_mode == true && get_player("Epiphone")) { 
		cruise(get_player("Epiphone").speed);
		state = "moving";
		smart_move(data,function(done) {
			state="attack";
			cruise(500);
		});
	}
}

character.on("stacked",function(data){
	move(character.x - 5,character.y - 5);
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
	
	
	if(event_name) {
		if(!parent.S.goobrawl && !parent.S.snowman && !parent.S.abtesting & !parent.S.franky) {
		   	event_name = false;
			state = "start";
		}
	}
}



// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland