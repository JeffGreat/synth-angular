var synthAngular = angular.module('synthAngular', ['ngResource', 'angularFileUpload', 'mgcrea.ngStrap.modal', 'mgcrea.ngStrap.alert']);

synthAngular.provider('$apiManager', function () {
    var baseApiUrl = 'api/rest/:service/:id/:sub_service/:sub_id';
    var apiParams = {
        id: '@id',
        service: '@service',
        sub_id: '@sub_id',
        sub_service: '@service'
    };

    this.setApiParams = function (value) {
        apiParams = value
    };

    this.setBaseApiUrl = function (value) {
        baseApiUrl = value
    };

    this.$get = ['$resource', function ($resource) {
            return $resource(baseApiUrl, apiParams, {
                list: {
                    method: 'GET',
                    isArray: true
                },
                save: {
                    method: 'POST'
                },
                update: {
                    method: 'POST'
                },
                remove: {
                    method: 'POST'
                },
                get: {
                    method: 'GET',
                    isArray: false
                }
            });
        }];
});

synthAngular.service('$uiManager', ['$apiManager', '$filter', '$collectionManager', '$formManager', '$sockets', 'syTools', '$q',
    function ($apiManager, $filter, $collectionManager, $formManager, $sockets, syTools, $q) {
        this.defaults = {
            collection: undefined,
            form: undefined,
            search: {},
            publish_to_socket: false,
            show_form_message: false
        };

        this.queryParams = {};

        this.getItems = function (service, params) {
            var defer = $q.defer();
            var finalParams = angular.extend({}, this.defaults, params);
            var finalQuery = angular.extend({}, this.queryParams, {
                offset: 0,
                service: service
            }, finalParams.search);

            $apiManager.list(finalQuery, function (response) {
                if (finalParams.collection)
                    $collectionManager.addItems(params.collection, response);

                defer.resolve(response);
            },
                    function (err) {
                        defer.reject(err);
                    });
            return defer.promise;
        };

        this.createItem = function (service, params, model) {
            var defer = $q.defer();
            var finalParams = angular.extend({}, this.defaults, params);
            var finalQuery = angular.extend({}, this.queryParams, {
                service: service
            }, finalParams.search);
            if (!finalParams.socket_service)
                finalParams.socket_service = service ? service : '';


            if (!$formManager.submitState(finalParams.form))
                return defer.reject('aucune modification apportée');

            $apiManager.save(finalQuery, model,
                    function (data) {
                        $formManager.endSubmitState(finalParams.form);
                        $formManager.resetFormError(finalParams.form);
                        $collectionManager.addItem(finalParams.collection, data);

                        if (finalParams.show_form_message)
                            $formManager.showMessage(finalParams.form, 'success');

                        if (finalParams.publish_to_socket)
                            $sockets.publish(finalParams.socket_service, finalParams.socket_operation || 'add', data);

                        defer.resolve(data);
                    },
                    function (err) {
                        delete model._method;
                        $formManager.endSubmitState(finalParams.form);
                        $formManager.resetFormError(finalParams.form);
                        $formManager.setFormErrors(finalParams.form, err);
                        if (finalParams.show_form_message)
                            $formManager.showMessage(finalParams.form, 'error');

                        defer.reject(err);
                    }
            );

            return defer.promise;
        };

        this.updateItem = function (service, params, model) {
            var defer = $q.defer();
            var finalParams = angular.extend({}, this.defaults, params);
            var finalQuery = angular.extend({}, this.queryParams, {
                service: service,
                'id': model.id
            }, finalParams.search);
            if (!finalParams.socket_service)
                finalParams.socket_service = service ? service : '';

            if (!$formManager.submitState(finalParams.form))
                return defer.reject('aucune modification apportée');

            //synfony trick
            model._method = "put";
            $apiManager.update(finalQuery, model,
                    function (data) {
                        delete model._method;
                        $formManager.endSubmitState(finalParams.form);
                        $formManager.resetFormError(finalParams.form);

                        if (finalParams.show_form_message)
                            $formManager.showMessage(finalParams.form, 'success');

                        syTools.mergeResourceProperties(model, data);

                        if (finalParams.publish_to_socket)
                            $sockets.publish(finalParams.socket_service, finalParams.socket_operation || 'update', data);

                        defer.resolve(data);
                    },
                    function (err) {
                        delete model._method;
                        $formManager.endSubmitState(finalParams.form);
                        $formManager.resetFormError(finalParams.form);
                        $formManager.setFormErrors(finalParams.form, err);
                        if (finalParams.show_form_message)
                            $formManager.showMessage(finalParams.form, 'error');

                        defer.reject(err);
                    }
            );

            return defer.promise;
        };

        this.deleteItem = function (service, params, model) {
            var defer = $q.defer();

            var finalParams = angular.extend({}, this.defaults, params);
            var finalQuery = angular.extend({}, this.queryParams, {
                service: service,
                'id': model.id
            }, finalParams.search);
            if (!finalParams.socket_service)
                finalParams.socket_service = service ? service : '';

            var oldId = model.id;

            //synfony trick
            model._method = "delete";
            $apiManager.remove(finalQuery, model,
                    function (data) {
                        delete model._method;
                        $collectionManager.deleteItem(finalParams.collection, oldId);

                        if (finalParams.publish_to_socket)
                            $sockets.publish(finalParams.socket_service, finalParams.socket_operation || 'delete', oldId);

                        defer.resolve(data);
                    },
                    function (err) {
                        defer.reject(err);
                    }
            );

            return defer.promise;
        };

        /* ITEM */
        this.getScrollItems = function (service, params) {
            var defer = $q.defer();
            var finalParams = angular.extend({}, this.defaults, params);
            var finalQuery = angular.extend({}, this.queryParams, {
                offset: $filter('filter')(params.collection, finalParams.search, true).length,
                service: service
            }, finalParams.search);

            $collectionManager.disableLoading(finalParams.collection, finalParams.tag);

            $apiManager.list(finalQuery, function (response) {
                $collectionManager.disableLoading(finalParams.collection, finalParams.tag);
                $collectionManager.addItems(finalParams.collection, response);

                defer.resolve(response);
            }, function (err) {
                defer.reject(err);
            });

            return defer.promise;
        };

    }
]);

synthAngular.filter('findItem', ['$filter', function ($filter) {
        return function (collection, id) {
            var doublons = $filter('filter')(collection, {
                id: id
            }, true);
            if (doublons.length > 0)
                return doublons[0];
            return null;
        }
    }]);

synthAngular.factory('syTools', function () {
    var fcts = {
        mergeResourceProperties: function (resourceObj, Obj) {
            for (var attrname in Obj)
            {
                if (attrname.substr(0, 1) != '$')
                    resourceObj[attrname] = Obj[attrname];
            }
            for (var attrname in resourceObj)
            {
                if (attrname.substr(0, 1) != '$' && Obj[attrname] == undefined)
                    delete resourceObj[attrname];
            }
        },
        
        generateRoute: function (route, params, absolute) {
            absolute = absolute == true ? absolute : false;
            return Routing.generate(route, params, absolute);
        }
    };
    return fcts;

});

synthAngular.service('$sockets', function () {
    this.session = undefined;
    this.clank = undefined;

    this.connect = function (clank_uri) {
        this.clank = Clank.connect(clank_uri);
        this.clank.parent = this;
        this.clank.on("socket/connect", function (session) {
            this.parent.session = session;
        });
    };
    this.unsubscribeAll = function () {
        if (!this.session)
            return;
        for (index in this.session._subscriptions)
            this.session.unsubscribe(index);
    };
    this.subscribeSocket = function (services, topic, callback) {
        this.topic = topic;
        if (!this.session)
            return;
        for (index = 0; index < services.length; ++index) {
            this.session.subscribe(this.topic + services[index], function (uri, payload) {
                callback(payload);
            });
        }
    };

    this.publish = function (service, operation, data) {
        if (!angular.isDefined(this.session) || !angular.isDefined(service))
            return;
        this.session.publish(this.topic + service, {
            operation: operation,
            data: data,
            service: service
        });
    };
});

synthAngular.service('$collectionManager', ['$filter', 'syTools', function ($filter, syTools) {
        this.addItem = function (collection, item) {
            if (!collection || !item)
                return;
            var element = $filter('findItem')(collection, item.id);
            if (element == null)
                collection.push(item);
            else
                syTools.mergeResourceProperties(element, item);
        };

        this.addItems = function (collection, items) {
            if (!collection || !items)
                return;
            var manager = this;
            angular.forEach(items, function (item) {
                manager.addItem(collection, item);
            });
        };

        this.deleteItem = function (collection, itemId) {
            if (!collection || !itemId)
                return;
            var item = $filter('findItem')(collection, itemId);
            if (item != null)
                collection.splice(collection.indexOf(item), 1);
        }

        this.disableLoading = function (collection, tag) {
            if (!collection || !tag)
                return;
            if (!angular.isDefined(collection.scroll) && tag)
                collection.scroll = [];
            if (tag && collection.scroll[tag] == true)
                return;
            if (tag)
                collection.scroll[tag] = true;
        };

        this.enableLoading = function (collection, tag) {
            if (!collection || !tag)
                return;
            if (angular.isDefined(collection.scroll) && angular.isDefined(angular.scroll[tag]))
                collection.scroll[tag] = false;
        };

        this.isLoading = function (collection, tag) {
            if (!collection || !tag)
                return false;
            if (angular.isDefined(collection.scroll) && collection.scroll[tag] == true)
                return true;
            return false;
        };
    }]);

synthAngular.service('$formManager', ['$alert', function ($alert) {
        this.alert_options = {
            error: {
                title: 'Info',
                content: 'Votre formulaire contient des erreurs',
                type: 'danger',
                duration: 5,
                placement: undefined,
                container: undefined,
                show: true
            },
            success: {
                title: 'Info',
                content: 'Les modifications ont été enregistrées',
                type: 'success',
                duration: 5,
                placement: undefined,
                container: undefined,
                show: true
            }
        };

        this.submitState = function (form) {
            if (!form)
                return true;
            if (form.$invalid || !form.$dirty)
                return false;
            var btn = $('form[name="' + form.$name + '"] [type="submit"][data-loading-text]');
            btn.button('loading');
            return true;
        };

        this.endSubmitState = function (form, errors) {
            if (!form)
                return;
            var btn = $('form[name="' + form.$name + '"] [type="submit"][data-loading-text]');
            btn.button('reset');

            //if(!errors)
            form.$setPristine();

        };

        this.setFormErrors = function (form, serverResponse) {
            if (!angular.isDefined(form))
                return;
            var errors = compileErrors(serverResponse.data);
            angular.forEach(errors, function (error, fieldName) {
                if (angular.isDefined(form[fieldName]))
                    form[fieldName].errors = error;
            });
        };

        compileErrors = function (data) {
            var errors = {};
            angular.forEach(data, function (error, name) {
                if (typeof (error) === 'string') {
                    if (errors[name] == undefined)
                        errors[name] = [error];
                    else
                        errors[name].push(error);
                }
                else if (typeof (error) === 'object') {
                    var suberrors = compileErrors(error);
                    angular.forEach(suberrors, function (suberror, subname) {
                        if (errors[subname] == undefined)
                            errors[subname] = [suberror];
                        else
                            errors[subname].push(suberror);
                    });
                }
            });
            return errors;
        };

        this.resetFormError = function (form) {
            if (!angular.isDefined(form))
                return;
            for (var attrname in form)
            {
                if (attrname == 'errors' && Array.isArray(form.errors)) {
                    form.errors = [];
                    return;
                }
                else if (attrname.substr(0, 1) != '$' && typeof (form[attrname]) === 'object')
                    this.resetFormError(form[attrname]);
            }
        }

        this.showMessage = function (form, msg) {
            if(form.$formOptions)
                var options = angular.extend({}, this.alert_options[msg], form.$formOptions[msg]);
            else
                var options = angular.extend({}, this.alert_options[msg]);
            if (options.container == undefined)
                options.container = angular.element('form[name="' + form.$name + '"]');
            $alert(options);
        }

    }]);

synthAngular.factory('uploadFile', ['$upload', '$sockets', function ($upload, $sockets) {
        return $upload;
    }]);

synthAngular.directive('formOptions', [function () {
        return{
            restrict: 'A',
            require: ['form'],
            scope: {
                formOptions: "="
            },
            link: function (scope, element, attrs, ctrls) {
                if (scope.formOptions == undefined)
                    scope.formOptions = {};
                ctrls[0].$formOptions = scope.formOptions;
            }
        };
    }]);

synthAngular.directive('formGroup', [function () {
        return {
            restrict: 'AE',
            transclude: true,
            scope: {
                inputLabel: '@',
                inputClass: '@',
                labelClass: '@'
            },
            template: '<div class="form-group" ng-class="{\'has-error\' : hasError}"><label class="control-label" ng-class="labelClass" ng-bind-html="inputLabel"></label><div ng-class="inputClass" ng-transclude></div></div>',
            controller: function ($scope) {
                $scope.hasError = false;
                this.setError = function (hasError) {
                    $scope.hasError = hasError;
                }
            },
            link: function (scope, element, attrs, ctrls) {
                if (attrs.inputClass == undefined)
                    attrs.inputClass = 'col-sm-9';
                if (attrs.labelClass == undefined)
                    attrs.labelClass = 'col-sm-3';
            }

        };
    }]);

synthAngular.directive('formInput', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            require: ['^form', '^form-group'],
            link: function (scope, element, attrs, ctrls) {
                scope.form = ctrls[0];
                scope.group = ctrls[1];
                var inputName = attrs.name;
                scope.inputVar = scope.form[inputName];
                var errblock = '<span class="help-block" ng-repeat="error in inputVar.errors" ng-bind="error"></span>';
                element.after(errblock);
                $compile(element.next())(scope);

                scope.$watch('inputVar.errors', function (value) {
                    if (value && value.length > 0)
                        scope.group.setError(true);
                    else
                        scope.group.setError(false);
                });
            }
        }
    }]);
