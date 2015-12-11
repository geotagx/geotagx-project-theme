module.exports = function(grunt){
    grunt.initConfig({
        pkg:grunt.file.readJSON("bower.json"),
        dir:{
            css:"assets/css",
            js:"assets/js",
            bundles:"assets/bundles",
            translations:"assets/js/translations",
            tests:"test",
            vendors:"vendor"
        },
        concat:{
            options:{
                stripBanners:true
            },
            // Concatenate uncompressed files to create a bundle. Adding already
            // compressed files to this step greatly slows down the minification
            // step (that follows concatenation), without providing any benefits.
            uncompressed:{
                files:{
                    "<%= dir.bundles %>/asset.bundle.core.css":[
                        "<%= dir.css %>/geotagx-questionnaire-image.css",
                        "<%= dir.css %>/geotagx-questionnaire-status-panel.css",
                        "<%= dir.css %>/geotagx-template.css"
                    ],
                    "<%= dir.bundles %>/asset.bundle.core.js":[
                        "<%= dir.js %>/geotagx-project.js",
                        "<%= dir.js %>/geotagx-questionnaire.js",
                        "<%= dir.js %>/geotagx-image.js",
                        "<%= dir.js %>/geotagx-tour.js",
                        "<%= dir.js %>/geotagx-analytics.js",
                        "<%= dir.js %>/geotagx-pybossa.js",
                        "<%= dir.js %>/geotagx-tutorial.js"
                    ],
                    "<%= dir.bundles %>/asset.bundle.geolocation.css":[
                        "<%= dir.css %>/geotagx-ol.css"
                    ],
                    "<%= dir.bundles %>/asset.bundle.geolocation.js":[
                        "<%= dir.js %>/geotagx-ol.js"
                    ],
                    "<%= dir.bundles %>/asset.bundle.i18n.js":[
                        "<%= dir.js %>/geotagx-project-i18n.js",
                        "<%= dir.translations %>/geotagx-project-translation-en.js"
                    ],
                    "<%= dir.bundles %>/asset.bundle.i18n-translation-fr.js":[
                        "<%= dir.translations %>/geotagx-project-translation-fr.js"
                    ]
                }
            },
            // Concatenate the already compressed files to their respective bundles.
            compressed:{
                files:{
                    "<%= dir.bundles %>/asset.bundle.core.css":[
                        "<%= dir.vendors %>/bootstrap-tour/build/css/bootstrap-tour.min.css",
                        "<%= dir.bundles %>/asset.bundle.core.css"
                    ],
                    "<%= dir.bundles %>/asset.bundle.core.js":[
                        "<%= dir.vendors %>/bootstrap-tour/build/js/bootstrap-tour.min.js",
                        "<%= dir.bundles %>/asset.bundle.core.js"
                    ],
                    "<%= dir.bundles %>/asset.bundle.datetime.css":[
                        "<%= dir.vendors %>/bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css"
                    ],
                    "<%= dir.bundles %>/asset.bundle.datetime.js":[
                        "<%= dir.vendors %>/moment/min/moment.min.js",
                        "<%= dir.vendors %>/bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js"
                    ],
                    "<%= dir.bundles %>/asset.bundle.geolocation.css":[
                        "<%= dir.vendors %>/openlayers/ol.css",
                        "<%= dir.bundles %>/asset.bundle.geolocation.css"
                    ],
                    "<%= dir.bundles %>/asset.bundle.geolocation.js":[
                        "<%= dir.vendors %>/openlayers/ol.js",
                        "<%= dir.bundles %>/asset.bundle.geolocation.js"
                    ],
                    "<%= dir.bundles %>/asset.bundle.i18n.js":[
                        "<%= dir.vendors %>/i18next/i18next.min.js",
                        "<%= dir.bundles %>/asset.bundle.i18n.js"
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
                "assets/js/*.js",
                "assets/js/translations/*.js",
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
    grunt.registerTask("bundle",  ["concat:uncompressed","cssmin","uglify","concat:compressed"]);
    grunt.registerTask("default", ["test","bundle"]);
};
