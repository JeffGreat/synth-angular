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
        $scope.listOptions = {
            title: 'My list',
            fields: [{
                property: 'title',
                libelle: 'Title',
                url: 'editItem({id: item.title})'
            }, {
                property: 'author',
                libelle: 'Author'
            }, {
                template: '<p>available scope : <pre>"cell" => cell definition defined by user</pre><pre>"item" => item from the collection</pre></p>',
                libelle: 'column with template'
            }, {
                templateUrl: 'columnTemplate.html',
                libelle: 'column with template url'
            }],
            actionColumn: [{
                icon: 'pencil',
                url: 'editItem({id: item.title})'
            }, {
                icon: 'times',
                url: 'removeItem({id: item.title})'
            }],
            headerActions: [{
                url: 'addItem',
                libelle: ' add',
                icon: 'plus'
            }]
        };
    });