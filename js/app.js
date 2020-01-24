'use strict';

/*
const jsyaml = require('js-yaml');
const _ = require('lodash');
//const L = require('leaflet');
const axios = require('axios');
const Vue = require('vue');
const Fuse = require('fuse');
*/

function draw_map() {
    var _map = L.map('mapid').setView([64.0, 2.0], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(_map);
    return _map;
}


function draw_markers(map, persons) {
    var _layer = L.layerGroup().addTo(map);
    for (var person of persons) {
        L.marker([person.lat, person.lon]).addTo(_layer)
            .bindPopup('<a href="' + person.url + '" target="_blank">' + person.name + '</a>');
    }
    return _layer;
}



function extract_skills(persons) {
    var skills = {};
    for (var person of persons) {

	let person_skills = person.skills;
	let lentypes = person_skills.length;
	
	for(let i = 0; i < lentypes; i++){

	    var skill_key = Object.keys(person_skills[i])[0]
	    var skill_list = Object.values(person_skills[i])[0]

	    for(let skill_idx = 0; skill_idx < skill_list.length; skill_idx++){
	
		let skill = skill_list[skill_idx]
		
		if (skills[skill_key] == undefined) {
		    skills[skill_key] = [];
		}
		if(!skills[skill_key].includes(skill)){
		    skills[skill_key].push(skill);
		}
	    }
	}
    }
    return skills;
}


var app = new Vue({
    el: '#app',
    data: {
	persons_found: [],
        skills_input: "",
        skills_all: [],
        skills_found: {},
        persons: null,
        data_is_loaded: false,
        map: null,
        markers: null,
	hit: false
    },
    watch: {
        skills_input: function(val) {
            this.debounced_update_markers(val);
        },
    },
    methods: {
        update_markers(val) {
            var options = {
                threshold: 0.2
            }


	    var skill_dict = this.skills_all[0]
	    //console.log('Skill dict: ', JSON.stringify(skill_dict))
	    var skill_categories = Object.keys(skill_dict);
	    //console.log('skill categories', skill_categories);
	    for (let idx = 0; idx < skill_categories.length; idx++){

		var skill_key = skill_categories[idx]
		this.skills_found[skill_key] = [];
		//console.log('Skill category ', skill_key)
		//console.log('Skill list in loop',skill_dict[skill_key])

		var skill_list = skill_dict[skill_key]
		var fuse = new Fuse(skill_list, options);
		//console.log('Fuse search on ', JSON.stringify(skill_list))
		var indices = fuse.search(val);
		//console.log('Search result: ',JSON.stringify(indices));
		
		for (var i of indices) {
		    var skill_found = skill_list[i];
		    //console.log(i)
		    //console.log('Adding skill to skills found ', skill_found)
		    this.skills_found[skill_key].push(skill_found)
		    this.hit= true;
		    
		}
	    }
	    

	    /*Finding the people with these skills and setting the poin on the map */
	    options = {
                threshold: 0.2,
		keys: ['skills.prog_lang','skills.skilltype2']
            }
	    this.persons_found = [];
            var fuse = new Fuse(this.persons, options);
            var persons_found = fuse.search(val);
	    for (let idx in persons_found){
		//console.log('This person found is ', JSON.stringify(this.persons[idx].name))
		this.persons_found.push(this.persons[idx].name)
	    }
            if (this.markers != null) {
                this.map.removeLayer(this.markers);
            }
            this.markers = draw_markers(this.map, persons_found);
	    
	    
        },
    },
    created: function() {
	let url = 'https://raw.githubusercontent.com/maikenp/maikenp.github.io/master/data/example_nested.yml'
        //let url = 'https://raw.githubusercontent.com/neicnordic/knowledge-map/gh-pages/data/example.yml';
        var _this = this;
        axios.get(url)
            .then(function(response) {
                var _data = jsyaml.load(response.data);
                _this.persons = _data.persons;
                _this.skills_all = [extract_skills(_this.persons)];
                _this.map = draw_map();
                _this.data_is_loaded = true;
		_this.skill_categories = Object.keys(_this.skills_all);
            })

        // delay updating by 200 ms to prevent it from computing "while typing"
        this.debounced_update_markers = _.debounce(this.update_markers, 200);
    },
})

