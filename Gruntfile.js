module.exports = function(grunt){
    grunt.initConfig({
        pkg:grunt.file.readJSON("bower.json"),
        dir:{
            css:"assets/css",
            js:"assets/js",
            bundles:"assets/bundles",
            tests:"test",
            vendors:"vendor"
        },
        concat:{
            options:{
                separator:";"
            },
            bundles:{
                files:{
                    "<%= dir.bundles %>/asset.bundle.core.css":[
                        "<%= dir.css %>/*.css",
                        "!<%= dir.css %>/geotagx-ol.css"
                    ],
                    "<%= dir.bundles %>/asset.bundle.core.js":[
                        "<%= dir.js %>/*.js",
                        "!<%= dir.js %>/geotagx-ol.js"
                    ],
                    "<%= dir.bundles %>/asset.bundle.geolocation.css":[
                        "<%= dir.css %>/geotagx-ol.css"
                    ],
                    "<%= dir.bundles %>/asset.bundle.geolocation.js":[
                        "<%= dir.js %>/geotagx-ol.js"
                    ]
                }
            },
            vendors:{
                files:{
                    "<%= dir.bundles %>/asset.bundle.geolocation.css":[
                        "<%= dir.vendors %>/openlayers/ol.css",
                        "<%= dir.bundles %>/asset.bundle.geolocation.css"
                    ],
                    "<%= dir.bundles %>/asset.bundle.geolocation.js":[
                        "<%= dir.vendors %>/openlayers/ol.js",
                        "<%= dir.bundles %>/asset.bundle.geolocation.js"
                    ]
                }
            }
        },
        cssmin:{
            bundles:{
                files:[{
                    expand:true,
                    src:"<%= dir.bundles %>/*.css"
                }]
            }
        },
        uglify:{
            bundles:{
                files:[{
                    expand:true,
                    src:"<%= dir.bundles %>/*.js"
                }]
            }
        },
        jshint:{
            files:[
                "Gruntfile.js",
                "static/js/*.js",
                "test/**/*.js"
            ],
            options:{
                globals:{
                    console:true,
                    module:true,
                    document:true
                }
            }
        },
        qunit:{
            options:{
                force:true //TODO Remove when at least one test is implemented.
            },
            testsuite:"<%= dir.tests %>/**/*.html"
        }
    });
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("test",    ["jshint","qunit"]);
    grunt.registerTask("bundle",  ["concat:bundles","cssmin","uglify","concat:vendors"]);
    grunt.registerTask("default", ["test","bundle"]);
};
