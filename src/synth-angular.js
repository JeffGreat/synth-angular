var synthAngular = angular.module('synthAngular', ['ngResource', 'angularFileUpload']);

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

synthAngular.service('$uiManager', ['$apiManager', '$filter', '$collectionManager', '$sockets', 'syTools', '$q',
    function ($apiManager, $filter, $collectionManager, $sockets, syTools, $q) {
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


            $apiManager.save(finalQuery, model,
                    function (data) {
                        $collectionManager.addItem(finalParams.collection, data);

                     
                        if (finalParams.publish_to_socket)
                            $sockets.publish(finalParams.socket_service, finalParams.socket_operation || 'add', data);

                        defer.resolve(data);
                    },
                    function (err) {
                        delete model._method;
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

            
            //synfony trick
            model._method = "put";
            $apiManager.update(finalQuery, model,
                    function (data) {
                        delete model._method;
                        
                        syTools.mergeResourceProperties(model, data);

                        if (finalParams.publish_to_socket)
                            $sockets.publish(finalParams.socket_service, finalParams.socket_operation || 'update', data);

                        defer.resolve(data);
                    },
                    function (err) {
                        delete model._method;
                        
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

synthAngular.factory('uploadFile', ['$upload', '$sockets', function ($upload, $sockets) {
        return $upload;
    }]);

