angular.module('demoApp', ['synthAngular', 'synthAngular.templates', 'synthAngular.syForm', 'synthAngular.syValidation', 'synthAngular.syList', 'ui.bootstrap']).controller('FormCtrl', function($scope, $q) {
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
});
    