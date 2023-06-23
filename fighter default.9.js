
setInterval(function() {
	if (just_logged && group_mode && state == "start") {
		send_cm(PARTYARRAY,"meet at task");
		just_logged = false;
	}

	check_pots();
	loot();	
	set_message(state);
	get_global_variables();
	
	if (character.rip) {
		respawn()
		state = "start";
		return;
	}
		

	if (character.rip || state != "attack") return;
	if (character.items[0].q < 100 || character.items[1].q < 100 || character.esize == 0) {
		trip_to_town(true)
		return;
	}	
	
}, 1000 / 4); // Loops every 1/4 seconds.


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

function get_distance_from(entityName) {
	var entity = get_entity(entityName);
	if (entity) {
	var distance = Math.abs(entity.x - character.x) + Math.abs(entity.y - character.y)
	return distance;
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


// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland