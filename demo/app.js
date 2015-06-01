angular.module('demoApp', ['synthAngular', 'synthAngular.templates', 'synthAngular.syForm', 'synthAngular.syValidation', 'synthAngular.syList', 'ui.bootstrap'])
    .config(['$sceProvider', function($sceProvider) {
        $sceProvider.enabled(false);
    }])
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        //$urlRouterProvider.otherwise("/production");
        $stateProvider
            .state('addItem', {
                url: "/addItem",
                views: {
                    'editZone@': {
                        template: "<div>add a book template is empty</div>",
                    }
                }
            })
            .state('editItem', {
                url: "/editItem/:id",
                views: {
                    'editZone@': {
                        template: "<div>book to edit: {{book}}</div>",
                        controller: function($scope, $stateParams) {
                            $scope.book = $stateParams.id;
                        }
                    }
                }
            })
            .state('removeItem', {
                url: "/removeItem/:id",
                views: {
                    'editZone@': {
                        template: "<div>book to remove: {{book}}</div>",
                        controller: function($scope, $stateParams) {
                            $scope.book = $stateParams.id;
                        }
                    }
                }
            });
    }])
    .config(function(syEntitySchemaProvider) {
        var userSchema = {
            name: {
                required: {},
                maxlength: {
                    value: 5,
                    error: 'too long'
                },
                minlength: {
                    value: 2,
                    error: 'too short!'
                }
            }
        };
        syEntitySchemaProvider.set("User", userSchema);
    })
    .config(function(syFormDefaultValueProvider) {
        syFormDefaultValueProvider.set({
            horizontal: true,
            inline: false,
            form_message_container: undefined,
            form_message_error: {
                enabled: false,
                message: "Votre formulaire contient des erreurs",
            },
            form_message_success: {
                enabled: false,
                message: "Enregistrement effectué"
            },
            input_message: {
                enabled: true,
                error: "saisie incorrecte"
            },
            data_loading_text: 'enregistrement...'
        });
    })
.controller('FormCtrl', function($scope, $q) {
        $scope.user = {};
        $scope.users = [];

        $scope.addUser = function() {
            //$scope.form1.name.$error.slug= "L'url de l'événement est déjà utilisée pour la date sélectionnée";
            /*$scope.users.push($scope.user);
            $scope.user = {};*/
            var defer = $q.defer();
            //defer.reject({"global":[],"fields":{"email":"L'url de l'\u00e9v\u00e9nement est d\u00e9j\u00e0 utilis\u00e9e pour la date s\u00e9lectionn\u00e9e"}});
            defer.resolve("Bien joué")
            return defer.promise;
        };


    })
    .controller('ListCtrl', function($scope, $q) {
        $scope.books = [{
            title: "Manon Lescaut",
            author: "Abbé Prévost"
        }, {
            title: "Le Compte de Monte Cristo",
            author: "Dumas"
        }];
        
        $scope.getContent = function(item){
            return item.author.toUpperCase();
        };
        
        $scope.listOptions = {
            title: 'My list',
            fields: [{
                property: 'title',
                title: 'Title',
                url: 'editItem({id: item.title})',
                class: 'title-class'
            }, {
                property: 'author',
                title: 'Author'
            }, {
                template: '<p>available scope : <pre>"cell" => cell definition defined by user</pre><pre>"item" => item from the collection</pre></p>',
                title: 'column with template'
            }, {
                templateUrl: 'columnTemplate.html',
                title: 'column with template url'
            }, {
                expression: $scope.getContent,
                title: 'column with content function'
            }, {
                expression: $scope.getContent,
                title: 'column with content function wrapped in a link',
                url: 'editItem({id: item.title})'
            }],
            actionColumn: [{
                icon: 'pencil',
                url: 'editItem({id: item.title})'
            }, {
                icon: 'times',
                url: 'removeItem({id: item.title})',
                
            }],
            actionColumnTitle: 'actions',
            headerActions: [{
                url: 'addItem',
                title: ' add',
                icon: 'plus'
            }]
        };
    });