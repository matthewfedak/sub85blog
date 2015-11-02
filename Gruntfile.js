module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cssmin: {
            target: {
                files: [{
                    src: ['_site/css/main.css'],
                    dest: '_site/css/main.min.css'
                }]
            }
        },
        watch: {
            site: {
                files: ['_site/*.html'],
                tasks: ['default']
            }
        },
        htmlmin: {
            options: {
                removeComments: true,
                collapseWhitespace: true
            },
            files: {
                expand: true,
                src: '_site/*.html',
                dest: '_site/'
            }
        },
        'git-describe': {
            options: {
                template: '{%=object%}'
            },
            your_target: {
                files: 'data/commit',
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-git-describe');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.registerTask('saveRevision', function () {
        grunt.event.once('git-describe', function (rev) {
            grunt.file.write('data/commit', rev);
        });
        grunt.task.run('git-describe');
    });

    // the default task can be run just by typing 'grunt' on the command line
    grunt.registerTask('default', ['saveRevision', 'htmlmin', 'cssmin']);

};
