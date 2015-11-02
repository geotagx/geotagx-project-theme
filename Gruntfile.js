module.exports = function(grunt){
    grunt.initConfig({
        pkg:grunt.file.readJSON("bower.json"),
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
            files:["test/**/*.html"]
        }
    });
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-qunit");

    grunt.registerTask("test",    ["jshint","qunit"]);
    grunt.registerTask("default", ["jshint","qunit"]);
};
