'use strict';

var markdown = require('node-markdown').Markdown;

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // configurable paths
    var yeomanConfig = {
        src: 'src',
        dist: 'dist',
        demo: 'demo'
    };

    // Project configuration.
    grunt.initConfig({
        yeoman: yeomanConfig,
        pkg: grunt.file.readJSON('package.json'),
        modules: [], //to be filled in by buildmodules task
        moduleprefix: '<%= pkg.name %>.',
        filenamecustom: '<%= filename %>-custom',
        meta: {
            modules: 'angular.module("<%= pkg.name %>", [<%= srcModules %>]);',
            tplmodules: 'angular.module("<%= pkg.name %>.tpls", [<%= tplModules %>]);',
            all: 'angular.module("<%= pkg.name %>", ["<%= pkg.name %>.tpls", <%= srcModules %>]);',
            banner: '/**\n' +
                ' * <%= pkg.description %>\n' +
                ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                ' * @link <%= pkg.homepage %>\n' +
                ' * @author <%= pkg.author.name %>\n' +
                ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
                ' */\n\n'
        },

       
        copy: {
            demohtml: {
                options: {
//                  //process html files with gruntfile config
                  processContent: grunt.template.process
               },
                files: [{
                  expand: true,
                  cwd: 'misc/demo/',
                  src: ['**/*.html'],
                  dest: 'demo/'
                }]
              },
         },
        // Watches files for changes and runs tasks based on the changed files
        watch: {
            js: {
                files: [
                    '{.tmp,<%= yeoman.src %>}/**/*.js',
                    '!<%= yeoman.src %>/**/*.spec.js'
                ],
                tasks: [
                    'buildmodules',
                    'buildtasks:dist'
                ]
            },
            html: {
                files: [
                    '<%= yeoman.src %>/**/*.tpl.html'
                ],
                tasks: [
                    'buildmodules',
                    'buildtasks:tpls'
                ]
            },
            jsTest: {
                files: ['<%= yeoman.src %>/**/*.spec.js'],
                tasks: ['karma']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            }
            /*demo: {
                files: ['<%= yeoman.demo %>/*.html'],
                tasks: ['processhtml']
            }*/
            // livereload: {
            //     options: {
            //         livereload: '<%= connect.options.livereload %>'
            //     },
            //     files: [
            //         'demo/*.html',
            //         '<%= yeoman.src %>/**/*.html',
            //         '.tmp/styles/{,*/}*.css'
            //     ]
            // }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        '.tmp',
                        '<%= yeoman.src %>',
                        'demo',
                        ''
                    ]
                }
            },
            test: {
                options: {
                    port: 9001,
                    base: [
                        '.tmp',
                        '<%= yeoman.src %>'
                    ]
                }
            },
            dist: {
                options: {
                    base: [
                        '<%= yeoman.dist %>',
                        ''
                    ]
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/*',
                        '!<%= yeoman.dist %>/.git*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.src %>/{,*/}*.js'
            ],
            test: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: ['<%= yeoman.src %>/{,*/}*.spec.js']
            }
        },

        // Join scripts into a single file
        concat: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                options: {
                    // Replace all 'use strict' statements in the code with a single one at the top
                    banner: '(function(window, document, undefined) {\n\'use strict\';\n\n',
                    footer: '\n})(window, document);\n',
                    process: function(src, filepath) {
                        return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    }
                },
                files: {
                    '<%= yeoman.dist %>/<%= pkg.name %>.js': [
                        '<%= yeoman.src %>/{,*/}*.js',
                        '!<%= yeoman.src %>/{,*/}*.spec.js'
                    ]
                }
            },
        },

        // Allow the use of non-minsafe AngularJS files. Automatically makes it
        // minsafe compatible so Uglify does not destroy the ng references
        ngmin: {
            options: {
                stripBanners: true,
                banner: '<%= meta.banner %>'
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: '<%= pkg.name %>.js',
                    dest: '<%= yeoman.dist %>'
                }]
            },
            dist_tpls: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: '<%= pkg.name %>-tpls.js',
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },

        uglify: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/<%= pkg.name %>.min.js': [
                        '<%= yeoman.dist %>/<%= pkg.name %>.js'
                    ]
                }
            },
            dist_tpls: {
                files: {
                    '<%= yeoman.dist %>/<%= pkg.name %>-tpls.min.js': [
                        '<%= yeoman.dist %>/<%= pkg.name %>-tpls.js'
                    ]
                }
            }
        },

        html2js: {
            dist: {
                options: {
                    module: "synthAngular.templates", // no bundle module for all the html2js templates
                    base: 'src',
                    singleModule: true
                },
                src: ['src/**/*.tpl.html'],
                dest: '<%= yeoman.dist %>/<%= pkg.name %>-tpls.js'
            }
        },

        buildtasks: {
            dist: {
                options: {
                    tasks: [
                        'concat:dist',
                        'ngmin:dist',
                        'uglify:dist',
                    ]
                },
                src: ['src/**/*.tpl.html']
            },
            tpls: {
                options: {
                    tasks: [
                        'html2js',
                        'ngmin:dist_tpls',
                        'uglify:dist_tpls'
                    ]
                },
                src: ['src/**/*.tpl.html']
            }
        },

        /*processhtml: {
            dist: {
                files: {
                    'dist/index.html': ['demo/index.html']
                }
            }
        },*/

    });

    //findModule: Adds a given module to config
    var foundModules = {};

    function findModule(name) {
        if (foundModules[name]) {
            return;
        }
        foundModules[name] = true;

        function enquote(str) {
            return '"' + str + '"';
        }

        function removeroot(str) {
            return str.slice(str.indexOf('/') + 1, str.length);
        }

        var module = {
            name: name,
            moduleName: enquote(grunt.config('moduleprefix') + name),
            srcFiles: grunt.file.expand(['src/' + name + '/*.js', '!src/' + name + '/*.spec.js']),
            tplFiles: grunt.file.expand('src/' + name + '/*.tpl.html'),
            tplModules: grunt.file.expand('src/' + name + '/*.tpl.html').map(removeroot).map(enquote),
            dependencies: dependenciesForModule(name),
            docs: {
                md: grunt.file.expand('src/'+name+'/docs/*.md')
                  .map(grunt.file.read).map(markdown).join('\n'),
                js: grunt.file.expand('src/'+name+'/docs/*.js')
                  .map(grunt.file.read).join('\n'),
                html: grunt.file.expand('src/'+name+'/docs/*.html')
                  .map(grunt.file.read).join('\n')
              }
        };
        module.dependencies.forEach(findModule);
        grunt.config('modules', grunt.config('modules').concat(module));
    }

    function dependenciesForModule(name) {
        var deps = [];
        grunt.file.expand(['src/' + name + '/*.js', '!src/' + name + '/*.spec.js'])
            .map(grunt.file.read)
            .forEach(function(contents) {
                //Strategy: find where module is declared,
                //and from there get everything inside the [] and split them by comma
                var moduleDeclIndex = contents.indexOf('angular.module(');
                var depArrayStart = contents.indexOf('[', moduleDeclIndex);
                var depArrayEnd = contents.indexOf(']', depArrayStart);
                var dependencies = contents.substring(depArrayStart + 1, depArrayEnd);
                dependencies.split(',').forEach(function(dep) {
                    if (dep.indexOf(grunt.config('moduleprefix')) > -1) {
                        var depName = dep.trim().replace(grunt.config('moduleprefix'), '').replace(/['"]/g, '');
                        if (deps.indexOf(depName) < 0) {
                            deps.push(depName);
                            //Get dependencies for this new dependency
                            deps = deps.concat(dependenciesForModule(depName));
                        }
                    }
                });
            });
        return deps;
    }

    grunt.registerTask('demo', ['buildmodules', 'copy']);
    
    
    


    grunt.registerTask('buildmodules', function() {
        var _ = grunt.util._;
        
         //If arguments define what modules to build, build those. Else, everything
            if (this.args.length) {
              this.args.forEach(findModule);
              grunt.config('filename', grunt.config('filenamecustom'));
            } else {
              grunt.file.expand({
                filter: 'isDirectory', cwd: '.'
              }, 'src/*').forEach(function(dir) {
               
                findModule(dir.split('/')[1]);
              });
            }
            
        //Build all modules
        grunt.file.expand({
            filter: 'isDirectory',
            cwd: '.'
        }, 'src/*').forEach(function(dir) {
            findModule(dir.split('/')[1]);
        });

        var modules = grunt.config('modules');
   

        grunt.config('srcModules', _.pluck(modules, 'moduleName'));
        grunt.config('tplModules', _.pluck(modules, 'tplModules').filter(function(tpls) {return tpls.length > 0;}));
        grunt.config('demoModules', modules
            .filter(function(module) { 
                grunt.log.writeln(module.docs.md);
                //return module.srcFiles;
                return module.docs.md && module.docs.js && module.docs.html;
            })
            .sort(function(a, b) {
                if (a.name < b.name) { return -1; }
                if (a.name > b.name) { return 1; }
                return 0;
             })
       );
        
        var moduleFileMapping = _.clone(modules, true);
        moduleFileMapping.forEach(function (module) {
            delete module.docs;
        });
        grunt.config('moduleFileMapping', moduleFileMapping);
    
        grunt.task.run(['concat']);


    });

    grunt.registerMultiTask('buildtasks', 'Run task only if source files exists', function() {
        var options = this.options({
            tasks: []
        });

        var filesExist = false;
        this.files.forEach(function(f) {
            var src = f.src.filter(function(filepath) {
                if (!grunt.file.exists(filepath)) {
                    return false;
                }
                else {
                    filesExist = true;
                    return true;
                }
            });
        });

        if (filesExist) {
            console.log('true');
            options.tasks.forEach(function(task) {
                grunt.task.run(task);
            });
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'buildmodules',
        'buildtasks:tpls',
        'buildtasks:dist',
        //'processhtml'
    ]);

    grunt.registerTask('serve', function(target) {
        grunt.task.run([
            'clean:server',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('default', ['build']);
};