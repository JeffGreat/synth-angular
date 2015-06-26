angular.module('demoApp', ['synthAngular', 'synthAngular.templates', 'synthAngular.syForm', 'synthAngular.syValidation', 'synthAngular.syList', 'ui.bootstrap']).controller('ListCtrl', function($scope, $q) {
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