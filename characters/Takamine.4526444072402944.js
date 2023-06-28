//Merchant Code
//Finish Compounding the other times
//Store scrolls correctly by checking again with storing compoundable
var PARTYARRAY = [] //"Gibson", "Fender", "Yamaha"]
var shop_open = true
var state = "start"
var max_compound = 3;
var max_upgrade = 6;
var deposit_count = 0;
var do_not_upgrade_list = ["firestaff","ololipop","glolipop","throwingstars","basher","angelwings","rod","pickaxe","maceofthedead","basher","bowofthedead","staffofthedead","swordofthedead","pmaceofthedead","spearofthedead"];
var exchange_list = ["gem0","gem1","armorbox","weaponbox","mistletoe","candy1","candy0","candycane","gift0","gift1"];
var upgrade_single_item = false;
//var all_functions(bank_check(),deposit_merch_items(),store_items(),grab_compound(0),compound_items(0),grab_compound(1),compound_items(1),grab_compound(2),compound_items(2),
if (!upgrade_single_item) {
setInterval(() => {

	use_pots();
	
	if (state == "start") {
		bank_check();
		return;
	}
	
	if (state == "deposit_merch") {
		deposit_merch_items();
		return;
	}
	
	if (state == "deposit_items") {
		store_items();
		return;
	}
	
	if (state == "grab_compound0") {
		grab_compound(0);
		return;
	}
	
	if (state == "compound0") {
		compound_items(0);
		return;
	}
	
	if (state == "grab_compound1") {
		grab_compound(1);
		return;
	}
	
	if (state == "compound1") {
		compound_items(1);
		return;
	}
	
	if (state == "grab_compound2") {
		grab_compound(2);
		return;
	}
	
	if (state == "compound2") {
		compound_items(2);
		return;
	}
	
	if (state == "grab_armour0") {
		grab_upgrade("armour",0);
		return;
	}
	
	if (state == "upgrade_armour0") {
		upgrade_items("armour",0);
		return;
	}
	
	if (state == "grab_armour1") {
		grab_upgrade("armour",1);
		return;
	}
	
	if (state == "upgrade_armour1") {
		upgrade_items("armour",1);
		return;
	}
	
	if (state == "grab_weapon0") {
		grab_upgrade("weapon",0);
		return;
	}
	
	if (state == "upgrade_weapon0") {
		upgrade_items("weapon",0);
		return;
	}
	
	if (state == "grab_weapon1") {
		grab_upgrade("weapon",1);
		return;
	}
	
	if (state == "upgrade_weapon1") {
		upgrade_items("weapon",1);
		return;
	}
	
	if (state == "grab_exchange") {
		grab_exchange();
	}
	
	if (state == "exchange_items") {
		exchange_items();
	}
	
	if (state == "sorting1") {
		sort_all_banks_alphabetically();
		return;
	}
	
	if (state == "sorting2") {
		sort_all_banks_by_level();
		return;
	}
	
	if (state == "retrieving") {
		retrieve_merch_items();	
		return;
	}
	
	if (state == "check_scrolls") {
		state = "selling";//check_scrolls();
	}
	
	if (state != "selling") return;
	character.tax = 0;
	//check_scrolls();
}, 1000); // Loops every 1 seconds.

// Hourly bank check
setInterval(() => {
	bank_check();
}, 3600000); // Loops every hour.
} else {
setInterval(() => {
	if(character.items[0].q < 100) {
		buy("scroll0", 250 - character.items[0].q);
	}
	if(character.items[2].q < 100) {
		buy("scroll1", 10);	
	}
	
	if(!character.s.massproduction) {
		use_skill("massproduction");
	}
	use_pots();
	if(character.q.upgrade) {
		return;
	}
	if (character.items[5]) {
		var coat = character.items[5];
		if (coat.level < 7) {
			upgrade(5,0);
		} else if (coat.level == 7) {
			upgrade(5,2);
		} else if (coat.level > 7) {
			if (character.items[6]) {
				var pants = character.items[6];
				if (pants.level < 7) {
					upgrade(6,0);
				} else if (pants.level == 7) {
					upgrade(6,2);
				} else if (pants.level > 7) {
					return;
				}
			} else {
				buy("gloves");
			}
		}
	} else {
		buy("gloves");
	}
}, 1000/2);
}
function bank_check() {
	close_stand();
	state = "moving"
		smart_move({
			to: "bank"
		}, function(done) {	
			state="deposit_merch";
		});
}


function use_pots() {
	if (character.hp < character.max_hp && !is_on_cooldown("use_hp")) {
		use("use_hp");
	}
	if (character.mp < character.max_mp && !is_on_cooldown("use_mp")) {
		use("use_mp");
	}
}

function deposit_merch_items(change_state = true) {
	var merch_items = [locate_item("scroll0"), locate_item("cscroll0"), locate_item("scroll1"), locate_item("cscroll1"), locate_item("stand0")];
	for (i in merch_items) {
		bank_store(merch_items[i], "items5", i);
	}
	if (change_state) {
		state = "deposit_items";
	}
}

function store_items() {
	var merch_item_names = ["scroll0","cscroll0","scroll1","cscroll1","stand0"];
	for (var i = 0; i < character.isize; i++) {
		if (character.items[i]) {
			if (merch_item_names.includes(character.items[i].name)) {
				deposit_merch_items(false);
			} else {
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
	switch (deposit_count) {
		case 0:
			state = "grab_compound0";
			deposit_count++;
			break;
		case 1:
			state = "grab_compound1";
			deposit_count++;
			break;
		case 2:
			state = "grab_compound2";
			deposit_count++;
			break;
		case 3:
			state = "grab_armour0";		
			deposit_count++;
			break;
		case 4:
			state = "grab_armour1";
			deposit_count++;
			break;
		case 5:
			state = "grab_weapon0";
			deposit_count++;
			break;
		case 6:
			state = "grab_weapon1";
			deposit_count++;
			break;
		case 7:
			state = "grab_exchange";
			deposit_count++;
			break;
		case 8:
			state = "sorting1";
			deposit_count = 0;
			break;	
	}
}
function grab_compound(level) {
	bank_retrieve("items5",1,0);
	for(var i in character.bank["items3"]) {
		if (character.bank["items3"][i]) {
			if (character.bank["items3"][i].level == level && item_grade(character.bank["items3"][i]) == 0) {
				bank_retrieve("items3",i);
			}
		}
	}
	for(var i in character.bank["items4"]) {
		if (character.bank["items4"][i]) {
			if (character.bank["items4"][i].level == level && G.items[character.bank["items4"][i].name].compound && item_grade(character.bank["items4"][i]) == 0) {
				bank_retrieve("items4",i);
			}
		}
	}
	state = "moving";
	smart_move({
			to: "potions"
		}, function(done) {
			state = `compound${level}`;
		});
}

function compound_items(level) {
	if(!character.s.massproduction) {
		use_skill("massproduction");
	}
	if(character.q.compound) {
		return;
	}
	const item_array = [];
	for(var i in character.items) {
		if (character.items[i]) {
			item_array.push(character.items[i].name + character.items[i].level)	
		} else { 
			item_array.push("null_value");
		}
	}
	var sorted_name_list = [...new Set(item_array)];
	const index = sorted_name_list.indexOf("null_value");
	if (index > -1) { // only splice array when item is found
 		sorted_name_list.splice(index, 1); // 2nd parameter means remove one item only
	}
	for(var i in sorted_name_list) {		
		var index_count = get_all_indexes(item_array, sorted_name_list[i]);
		if (index_count.length >= 3 && sorted_name_list[i].slice(-1) < level+1) {
			if(!character.q.compound) { 	
				compound(index_count[0], index_count[1], index_count[2], locate_item("cscroll0"));
			}					 
			return;
		}
	}
	state="moving"
	smart_move({
			to: "bank"
		}, function(done) {
			state = "deposit_merch";
		});	
}

function grab_upgrade(type="armour",grade=0) {
	bank_retrieve("items5",grade*2,0);
	
	if (type=="armour") {
		for(var i in character.bank["items2"]) {
			if (character.bank["items2"][i]) {
				if (item_grade(character.bank["items2"][i]) == grade && !character.bank["items2"][i].p && !character.bank["items2"][i].l && !do_not_upgrade_list.includes(character.bank["items2"][i].name) && (G.items[character.bank["items2"][i].name].tier ? G.items[character.bank["items2"][i].name].tier < 3 : true)) {
					bank_retrieve("items2",i);
				}
			}
		}
	} else {
		for(var i in character.bank["items0"]) {
			if (character.bank["items0"][i]) {
				if (item_grade(character.bank["items0"][i]) == grade && !character.bank["items0"][i].p && !character.bank["items0"][i].l && !do_not_upgrade_list.includes(character.bank["items0"][i].name) && G.items[character.bank["items0"][i].name].tier < 3) {
					bank_retrieve("items0",i);
				}
			}
		}
	}
	for(var i in character.bank["items4"]) {
		if (character.bank["items4"][i]) {
			if (item_grade(character.bank["items4"][i]) == grade && G.items[character.bank["items4"][i].name].upgrade && !character.bank["items4"][i].p && !character.bank["items4"][i].l && !do_not_upgrade_list.includes(character.bank["items4"][i].name) && (G.items[character.bank["items4"][i].name].tier ? G.items[character.bank["items4"][i].name].tier < 3 : true)) {
				if((type == "weapon" && type == G.items[character.bank["items4"][i].name].type) || (type == "armour" && G.items[character.bank["items4"][i].name].type != "weapon") || (type == "armour" && character.bank["items4"][i].name == "tshirt1")) {
				bank_retrieve("items4",i);
				}
			}
		}
	}
	state = "moving";
	smart_move({
			to: "potions"
		}, function(done) {
			state = `upgrade_${type + grade}`;
		});
}

function upgrade_items(type,grade) {
	if(!character.s.massproduction) {
		use_skill("massproduction");
	}
	if(character.q.upgrade) {
		return;
	} if (type == "armour") {
		max_upgrade = 7;
	} else {
		max_upgrade = 6;
	} 
	for(var i=1; i < character.isize; i++) {
		if (character.items[i]) {
			if(((character.items[i].name == "cclaw" && character.items[i].level < 8) || character.items[i].level) < max_upgrade && character.items[0].q > 0 && item_grade(character.items[i]) == grade) {
				if(character.items[i].p) {
					
				} else if (character.items[i].l) {
				} else {
				upgrade(i,0);
				return;
				}
			}
		} 
	}
	state="moving"
	smart_move({
			to: "bank"
		}, function(done) {
			state = "deposit_merch";
						/*execute_asynchronously([deposit_merch_items(), store_items()], 10);

			if (grade < 1) {
				state = `grab_${type + 1}`;
			} else if (type == "armour") {
				state = "grab_weapon0";
			} else {
				state = "sorting1";
			}*/
		});
	
}

function grab_exchange() {
	for(var i in character.bank["items1"]) {
		if (character.bank["items1"][i]) {
			if (exchange_list.includes(character.bank["items1"][i].name)) {
				bank_retrieve("items1",i);
			}
		}
	}
	for(var i in character.bank["items4"]) {
		if (character.bank["items4"][i]) {
			if (exchange_list.includes(character.bank["items4"][i].name)) {
				bank_retrieve("items4",i);
			}
		}
	}
	
	state="moving"
	smart_move({
			to: "exchange"
		}, function(done) {
			state = "exchange_items";
						/*execute_asynchronously([deposit_merch_items(), store_items()], 10);

			if (grade < 1) {
				state = `grab_${type + 1}`;
			} else if (type == "armour") {
				state = "grab_weapon0";
			} else {
				state = "sorting1";
			}*/
		});
}

function exchange_items() {
	if(character.q.exchange) {
		return;
	}
	
	
	for(var i=0; i < character.isize; i++) {
		if (character.items[i]) {
			if(exchange_list.includes(character.items[i].name) && character.esize > 0) {
				
				exchange(i);
				return;
			}
		} 
	}
	
	if (character.esize == 0) {
		deposit_count--;
	}
	state = "moving";
	smart_move({
		to: "bank"
	}, function(done) {
		state = "deposit_merch";		
	});
	

	
}

function sort_all_banks_alphabetically() {
	sort_bank_alphabetically();
	sort_bank_alphabetically("items2");
	sort_bank_alphabetically("items3");

}

//bank_retrieve(pack,pack_num,num)
function sort_bank_alphabetically(pack = "items0") {
	state = "sorting2";
	var bank_slot = 0;
	var unsorted_array = []
	for (var i in character.bank[pack]) {
		if (character.bank[pack][i]) {
			unsorted_array.push(character.bank[pack][i].name);
		} else {
			unsorted_array.push("zzznullfiller") //adds 'null' items to make sure the array is still 42 characters
		}
	}
	var sorted_name_list = [...new Set(unsorted_array)];
	sorted_name_list.sort();
	for (var name in sorted_name_list) {
		for (var item in unsorted_array) {
			if (character.bank[pack][item]) {
				if (sorted_name_list[name] == unsorted_array[item]) {
					const temp = unsorted_array[item];
					unsorted_array[item] = unsorted_array[bank_slot];
					unsorted_array[bank_slot] = temp;
					bank_swap(pack, item, bank_slot);
					bank_slot++;
				}
			}
		}
	}
}

function sort_all_banks_by_level() {
	sort_bank_by_level();
	sort_bank_by_level("items2");
	sort_bank_by_level("items3");
}

function sort_bank_by_level(pack = "items0") {
	var unsorted_array = []
	for (var i in character.bank[pack]) {
		if (character.bank[pack][i]) {
			unsorted_array.push(character.bank[pack][i].name);
		} else {
			unsorted_array.push("zzznullfiller") 
		}
	}

	var sorted_array = unsorted_array.sort();
	var sorted_name_list = [...new Set(sorted_array)];
	for (var n in sorted_name_list) {
		var current_name_array = get_all_indexes(sorted_array, sorted_name_list[n])
		
		var level_array = [];
		for (var each in current_name_array) {
			if (character.bank[pack][current_name_array[each]]) {
				level_array.push(character.bank[pack][current_name_array[each]].level);
			}
		}
		for (var j = 0; j < current_name_array.length - 1; j++) {
			for (var i = 0; i < current_name_array.length - 1; i++) {

				if (character.bank[pack][current_name_array[i]]) {
					if (level_array[i] < level_array[i + 1]) {
						bank_swap(pack, current_name_array[i], current_name_array[i + 1]);
						const temp = level_array[i];
						level_array[i] = level_array[i + 1];
						level_array[i + 1] = temp;
					}
				}
			}

		}
	}
	state = "retrieving";
}

function retrieve_merch_items() {
	for (i=0; i<5; i++) {
		bank_retrieve("items5",i);
	}
	
	if (character.gold < 30000000) {
		bank_withdraw(30000000-character.gold);
	}
	
	state = "moving";
	smart_move({
			to: "town"
		}, function(done) {
			move(-30,30)
			open_stand();
			state = "check_scrolls";
		});
}

function check_scrolls() {
	var cscroll0 = quantity("cscroll0")
	var scroll0 = quantity("scroll0")
	var cscroll1 = quantity("cscroll1")//add line to buy this if I start using it.
	var scroll1 = quantity("scroll1")
	state = "selling";
	if (cscroll0 < 40 || scroll0 < 200 || scroll1 < 200) {
		state = "restock"
		close_stand();

		var x = character.real_x,
			y = character.real_y,
			map = character.map;
		smart_move({
			to: "scrolls"
		}, function(done) {
			buy("cscroll0", 80 - cscroll0);
			buy("scroll0", 250 - scroll0);
			buy("scroll1", 250 - scroll1);
			
			smart_move({
				x: x,
				y: y,
				map: map
			}, function(done) {
				state = "selling";
				open_stand();
			});
		});
	}
}

function get_all_indexes(arr, val) {
	var indexes = [],
		i = -1;
	while ((i = arr.indexOf(val, i + 1)) != -1) {
		indexes.push(i);
	}
	return indexes;
}

function is_compoundable(invSlot) {
	let compItem = character.items[invSlot];
	return G.items[compItem.name].compound;
}

function is_upgradeable(invSlot) {
	let compItem = character.items[invSlot];
	return G.items[compItem.name].upgrade;
}



function find_duplicates(arr) {
	var index = 0;
    for (let i = 0; i < arr.length - 1; i++) {
       for (let j = i + 1; j < arr.length; j++) {
       if (arr[i] === arr[j]) {
             newArr[index] = arr[i];
             index++;
          }
       }
    }
    return newArr;
}

function on_party_invite(name) {
	if (PARTYARRAY.includes(name)) {
		accept_party_invite(name);
	}
}

function execute_asynchronously(functions, timeout) {
  for(var i = 0; i < functions.length; i++) {
    setTimeout(functions[i], timeout);
  }
}
// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland