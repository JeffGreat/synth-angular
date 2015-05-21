var listDirective = angular.module('synthAngular.syList', ['ngResource', 'ui.router', 'infinite-scroll']);
/*
 *
 * Features: list entities, set list title, set columns to display, set action column with states, set column template, set scroll url
 *
 */
listDirective.directive('syList', ['$state', function($state) {
    var defaultOptions = {
        title: 'list',
        fields: [],
        actions: [],
        headerActionsTitle: 'actions',
        headerActions: []
    };

    return {
        restrict: 'AE',
        transclude: true,
        scope: {
            listElements: '=',
            title: '@',
            options: "=syListOptions",
            customSearch: "=",
            scrollAction: "@",
        },
        templateUrl: 'syList/sy-list.tpl.html',
        controller: function($scope) {
            $scope.options = angular.extend({}, defaultOptions, $scope.options);
            $scope.listElements;
            $scope.scroll = function() {
                if ($scope.scrollAction)
                    $scope.$eval($scope.scrollAction);
            };
        },
    };
}]);

listDirective.directive('syListCell', ['$compile', '$state', '$templateCache',
    function($compile, $state, $templateCache) {
        return {
            restrict: 'A',
            require: ['^syList'],
            scope: {
                cell: "=syListCell",
            },
            link: function(scope, el, attrs, ctrl) {
                scope.item = scope.$parent.item;
                var propertyValue = scope.item[scope.cell.property];

                if (scope.cell.template) {
                    var html = scope.cell.template;
                    el.html($compile(html)(scope));
                }
                else if (scope.cell.templateUrl) {
                    //var html = '<div ng-include="'+scope.cell.templateUrl+'"></div>';
                    var html = $templateCache.get(scope.cell.templateUrl);
                    el.html($compile(html)(scope));
                }
                else if (propertyValue && scope.cell.url) {
                    var html = '<a ui-sref="' + scope.cell.url + '">{{item.' + scope.cell.property + '}}</a>';
                    el.html($compile(html)(scope));
                }
                else if (propertyValue) {
                    var html = '<span>{{item.' + scope.cell.property + '}}</span>';
                    el.html($compile(html)(scope));
                    //el.html($compile('{{item.' + scope.cell.property + '}}')(scope));
                }
            },
            controller: function($scope) {


            }

        }
    }
]);
