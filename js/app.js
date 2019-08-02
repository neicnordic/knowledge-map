'use strict';

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
    var skills = [];
    for (var person of persons) {
        for (var skill of person.skills) {
            if (!skills.includes(skill)) {
                skills.push(skill);
            }
        }
    }
    return skills;
}

var app = new Vue({
    el: '#app',
    data: {
        skills_input: "",
        skills_all: [],
        skills_found: [],
        persons: null,
        data_is_loaded: false,
        map: null,
        markers: null,
    },
    watch: {
        skills_input: function(val) {
            this.debounced_update_markers(val);
        },
    },
    methods: {
        update_markers(val) {
            var options = {
                threshold: 0.2,
                keys: ['skills']
            }

            var fuse = new Fuse(this.skills_all, options)
            var indices = fuse.search(val)
            this.skills_found = [];
            for (var i of indices) {
                this.skills_found.push(this.skills_all[i]);
            }

            var fuse = new Fuse(this.persons, options)
            var persons_found = fuse.search(val)
            if (this.markers != null) {
                this.map.removeLayer(this.markers);
            }
            this.markers = draw_markers(this.map, persons_found);
        },
    },
    created: function() {
        let url = 'https://raw.githubusercontent.com/neicnordic/knowledge-map/gh-pages/data/example.yml';
        var _this = this;
        axios.get(url)
            .then(function(response) {
                var _data = jsyaml.load(response.data);
                _this.persons = _data.persons;
                _this.skills_all = extract_skills(_this.persons);
                _this.map = draw_map();
                _this.data_is_loaded = true;
            })

        // delay updating by 200 ms to prevent it from computing "while typing"
        this.debounced_update_markers = _.debounce(this.update_markers, 200);
    },
})
