var listDirective = angular.module('listDirective', ['ngResource']);
/*
 * 
 * Features: list entities, set list title, set columns to display, set action column with states, set column template, set scroll url
 * 
 */
listDirective.directive('syList', ['$uiManager', 'dialogs', '$state', function($uiManager, $dialogs, $state) {
        return {
            restrict: 'AE',
            transclude: true,
            scope: {
                listElement: '=',
                title: '@',
                titleElement: '=',
                bindElement: '=',
                nameElement: '@',
                nameIdentifiant: '@',
                options: "=options",
                createState: "@",
                updateState: "@",
                deleteUrl: "@",
                customSearch: "=",
                scrollAction: "@",
            },
            templateUrl: '/syList/sy-list.tpl.html',
            controller: function($scope) {
                $scope.listElement;
                $scope.elementToRemove = {};
                $scope.confirmed = "";
                if (!$scope.deleteUrl)
                    $scope.deleteUrl = ".delete({ id: item.id })";

                $scope.setElementToRemove = function(element) {
                    $scope.elementToRemove = element;
                }

                $scope.deleteElement = function() {
                    $uiManager.deleteItem($scope.nameElement, {collection: $scope.listElement}, $scope.elementToRemove).then(function(data) {
                        $('#modalDelete').modal('close');
                    });
                };

                $scope.launch = function(which) {
                    var dlg = null;
                    switch (which) {
                        case 'create':
                            var stateCreate = $state.get($scope.createState);
                            var dlg = $dialogs.create(stateCreate.views['content@'].templateUrl, stateCreate.views['content@'].controller, {}, 'lg');
                            dlg.result.then(function(element) {
                                $scope.confirmed = "L'élément a bien été ajouté";
                                $scope.listElement.push(element);
                                $("#alert-message").alert();
                                window.setTimeout(function() {
                                    $("#alert-message").alert('close');
                                }, 3000);
                            }, function() {

                            });
                            break;
                    }
                };
            },
        };
    }]);

listDirective.directive('syListCell', ['$compile', 'dialogs', '$uiManager', '$state',
    function($compile, $dialogs, $uiManager, $state) {
        return {
            restrict: 'A',
            require: ['^syList'],
            scope: {
                girelleListCell: "=",
            },
            link: function(scope, el, attrs) {
                scope.item = scope.$parent.element;

                if (!scope.girelleListCell.content && scope.girelleListCell.property != "actions")
                    el.html(scope.item[scope.girelleListCell.property]);
                else if (!scope.girelleListCell.content && scope.girelleListCell.property == "actions") {
                    scope.deleteUrl = scope.$parent.$parent.$parent.deleteUrl;
                    var html = ('<div ng-include src="\'/syList/sy-list-actions-actions.tpl.html\'" ></div>');
                    el.html($compile(html)(scope));
                }
                else if (typeof scope.girelleListCell.content == "string")
                    el.html(scope.item[scope.girelleListCell.content]);
                else if (typeof scope.girelleListCell.content == "function" && scope.girelleListCell.property == "actions")
                    el.html(scope.girelleListCell.content(scope));
                else if (typeof scope.girelleListCell.content == "function" && scope.girelleListCell.property != "actions")
                    el.html(scope.girelleListCell.content(scope.item));

                // end launch
            },
            controller: function($scope) {
                $scope.launch = function(which) {
                    var dlg = null;
                    switch (which) {
                        case 'confirm':
                            dlg = $dialogs.confirm('Demande de confirmation', 'Etes-vous sûr de vouloir supprimer l\'élément suivant: <h3>' + $scope.item[$scope.$parent.$parent.$parent.nameIdentifiant] + '</h3>');
                            dlg.result.then(function(btn) {
                                $scope.deleteElement($scope.item);
                                $scope.$parent.$parent.$parent.confirmed = 'L\'élément a bien été supprimé';
                            }, function(btn) {
                                $scope.$parent.$parent.$parent.confirmed = 'La suppression a été avortée';
                            });
                            break;
                        case 'edit':
                            var stateEdit = $state.get($scope.$parent.$parent.$parent.updateState);
                            var dlg = $dialogs.create(stateEdit.views['content@'].templateUrl, stateEdit.views['content@'].controller, $scope.item, 'lg');
                            dlg.result.then(function(element) {
                                //$scope.$parent.$parent.$parent.listElement.push(element);
                                var i = $scope.$parent.$parent.$parent.listElement.indexOf($scope.item);
                                if (i != -1) {
                                    $scope.$parent.$parent.$parent.listElement[i] = element.element;
                                }
                                $scope.$parent.$parent.$parent.confirmed = element.msg;
                                $("#alert-message").alert();
                                window.setTimeout(function() {
                                    $("#alert-message").alert('close');
                                }, 3000);
                                //dlg.close();
                            }, function() {
                            });
                            break;
                    }
                };

                $scope.deleteElement = function(el) {
                    if ($scope.$parent.$parent.$parent.customSearch)
                        $scope.$parent.$parent.$parent.customSearch.sub_id = el.id;

                    $uiManager.deleteItem($scope.$parent.$parent.$parent.nameElement,
                            {collection: $scope.$parent.$parent.$parent.listElement,
                                search: $scope.$parent.$parent.$parent.customSearch
                            },
                    el)
                    .then(function(data) {
                        $('#modalDelete').modal('close');
                    });
                };
            }

        }
    }]);
