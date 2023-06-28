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

var attack_mode=false
var leader_name = "Gibson"
var PARTYARRAY = ["Gibson","Yamaha"]
var SKILLARRAY = ["supershot","huntersmark","use_town"]
var state = "attack"
var SELLARRAY = ["ringsj","vitring","hpbelt","hpamulet","wshoes","wcap","wbreeches","wshoes","wshield","wattire"]
var message_received = false
var group_mode = false;
var step_counter = 0;

setInterval(function(){
	
	if(character.hp < character.max_hp-400) {
		use("use_hp");
	}
	if(character.mp < character.max_mp-400) {
		use("use_mp");
	}
	loot();

	if(character.rip || state != "attack") return;
	if(character.items[0].q < 100 || character.items[1].q<100 || character.esize == 0){
		trip_to_town()
		return;
	}
	if(group_mode) {
		follow_leader();
	}
	
		trip_to_town()

},1000/4); // Loops every 1/4 seconds.

function on_message_listener() {
	character.on("cm",function(m){
	if (m.message=="return to town") {
		game_log("test");
	} });
}
function trip_to_town() {
	state = "town"
	if(group_mode && !message_received) {
		send_cm(PARTYARRAY,"return to town");
	}
	use("town")
	var x=character.real_x,y=character.real_y,map=character.map;
	smart_move({to:"potions"},function(done){
		var hpots = character.items[0].q
		var mpots = character.items[1].q
		if(hpots < 2500) {
			buy("hpot1",2500 - hpots);
		}
		if(mpots < 2500) {
			buy("mpot1",2500 - mpots);
		}
		for(var i=2;i<43;i++){
		if(character.items[i]){
			if(SELLARRAY.includes(character.items[i].name)) {
		   		sell(i,1)
			}
		}
	}
		
	smart_move({to:"bank"},function(done){
		if(character.gold > 10000000) {
			bank_deposit(character.gold - 10000000);
		}
		for(var i=2;i<43;i++){
			if(character.items[i]){
				bank_store(i)
			}
		}
		
		game_log("Got the potions!","#4CE0CC");
		smart_move({x:x,y:y,map:map},function(done){
	});
	});
	});		
}

function attack_pattern() {
	if (group_mode == false) {
		
	}
	var target=get_targeted_monster();
	if(!target)
	{
		target=get_nearest_monster();
	}
	if(target.name == "Target Automatron"){
		log("fail");	
		change_target(get_nearest_monster({no_target:true}));
	}
	if(!is_in_range(target))
	{
		move(
			character.x+(target.x-character.x)/2,
			character.y+(target.y-character.y)/2
			);
		// Walk half the distance
	}
	else if(can_attack(target))
	{
		
		set_message("Attacking");
		attack(target);
	}
}

function get_distance_from(entityName) {
	var entity = get_entity(entityName);
	var distance = Math.abs(entity.x-character.x) + Math.abs(entity.y-character.y)
	return distance;
}

function follow_leader() {
	var leader = get_player(leader_name);
	if(get_distance_from(leader_name)>250) {
		state = "routing"
		smart_move({x:leader.real_x,y:leader.real_y,map:leader.map},function(done){
			state="attack"
		});
	} else if (get_distance_from(leader_name) > 40) {
		move(
			character.x+(leader.x-character.x)/2,
			character.y+(leader.y-character.y)/2
			);
	}
}	

function create_party() {
	for(var member in PARTYARRAY) {
	send_party_invite(member, false);
	}
}



// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland
