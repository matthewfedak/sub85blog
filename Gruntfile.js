module.exports = function (grunt) {

    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cssmin: {
            target: {
                files: [{
                    src: ['site/_site/css/main.css'],
                    dest: 'site/css/main.min.css'
                }]
            }
        },
        'git-describe': {
            options: {
                template: '{%=object%}'
            },
            your_target: {
                files: 'site/_includes/data/commit',
            },
        },
    });

    grunt.loadNpmTasks('grunt-git-describe');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('saveRevision', function () {
        grunt.event.once('git-describe', function (rev) {
            grunt.file.write('site/_includes/data/commit', rev);
        });
        grunt.task.run('git-describe');
    });

    // the default task can be run just by typing 'grunt' on the command line
    grunt.registerTask('default', ['cssmin']);

};
