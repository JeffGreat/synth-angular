/**
 * Angular tools made by Apsynth
 * @version v1.1.0 - 2015-04-22
 * @link https://github.com/JeffGreat/synth-angular
 * @author 
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

(function (window, document, undefined) {
  'use strict';
  angular.module('synthAngular.syForm', ['ngResource']);
  angular.module('synthAngular.syForm', []).provider('syFormDefaultValue', function () {
    var default_options = {
        horizontal: true,
        inline: false,
        form_message_container: undefined,
        form_message_error: {
          enabled: false,
          message: 'Your form contains errors'
        },
        form_message_success: { message: 'operation successful' },
        input_message: {
          enabled: true,
          error: 'invalid input'
        }
      };
    this.get = function () {
      return default_options;
    };
    this.$get = function () {
      return { get: this.get };
    };
  });
  angular.module('synthAngular.syForm').directive('syForm', [
    '$q',
    'syFormDefaultValue',
    '$compile',
    function ($q, syFormDefaultValue, $compile) {
      return {
        restrict: 'A',
        require: ['form'],
        scope: {
          syForm: '=?syForm',
          sySubmit: '&'
        },
        controller: [
          '$scope',
          '$element',
          '$attrs',
          function ($scope, $element, $attrs) {
            this.options = angular.extend(syFormDefaultValue.get(), $scope.syForm);
            if (this.options.horizontal)
              $element.addClass('form-horizontal');
            if (this.options.inline)
              $element.addClass('form-inline');
          }
        ],
        link: function (scope, element, attrs, ctrls) {
          var form = ctrls[0];
          var default_options = { data_loading_text: 'loading...' };
          var options = angular.extend(syFormDefaultValue.get(), scope.syForm);
          function setButtonState(state) {
            var btn = $('[type=submit]', element);
            if (state == true) {
              scope.text = btn[0].textContent;
              btn[0].textContent = options.data_loading_text;
              btn[0].disabled = true;
            }
            if (state == false) {
              btn[0].textContent = scope.text;
              btn[0].disabled = false;
            }
          }
          scope.resetFormError = function () {
            form.$error = {};
          };
          scope.setServerErrors = function (serverResponse) {
            var form_errors = scope.compileErrors(serverResponse);
            angular.forEach(form_errors, function (field_errors, fieldName) {
              if (angular.isDefined(form[fieldName])) {
                angular.forEach(field_errors, function (field_error, key) {
                  form[fieldName].$error[key] = field_error;
                });
              }
            });
          };
          scope.compileErrors = function (data) {
            var errors = {};
            angular.forEach(data, function (error, name) {
              if (typeof error === 'string') {
                if (errors[name] == undefined)
                  errors[name] = [error];
                else
                  errors[name].push(error);
              } else if (typeof error === 'object') {
                var suberrors = scope.compileErrors(error);
                angular.forEach(suberrors, function (suberror, subname) {
                  if (errors[subname] == undefined)
                    errors[subname] = suberror;
                  else
                    errors[subname].concat(suberror);
                });
              }
            });
            return errors;
          };
          scope.showFormMessage = function (type) {
            var container = {};
            if (options.form_message_container == undefined)
              container = angular.element('form[name="' + form.$name + '"]');
            else
              container = angular.element(options.form_message_container);
            var html = '';
            if (type == 'success')
              html = '<br/><alert type="' + type + '" close="close()" >' + options.form_message_success.message + '</alert>';
            else
              html = '<br/><alert type="' + type + '" close="close()" >' + options.form_message_error.message + '</alert>';
            container.after($compile(html)(scope));
          };
          function submitForm(ev) {
            scope.$apply(function () {
              if (!form.$submitting) {
                setButtonState(true);
                var res = $q.when(scope.$parent.$eval(scope.sySubmit));
                res.then(function (data) {
                  scope.showFormMessage('success');
                }, function (data) {
                  scope.resetFormError();
                  scope.setServerErrors(data);
                  scope.showFormMessage('danger');
                }).finally(function (data) {
                  setButtonState(false);  //form.$setPristine();
                });
              }
              ev.preventDefault();
            });
          }
          element.on('submit', submitForm);
          scope.$on('destroy', function () {
            element.off('submit', submitForm);
          });
        }
      };
    }
  ]);
  angular.module('synthAngular.syForm').directive('syFormGroup', [function () {
      return {
        restrict: 'AE',
        transclude: true,
        replace: true,
        require: ['^syForm'],
        scope: {
          inputLabel: '@',
          inputClass: '@',
          labelClass: '@'
        },
        templateUrl: 'syForm/sy-form-group.tpl.html',
        controller: [
          '$scope',
          function ($scope) {
            $scope.hasError = false;
            this.setError = function (hasError) {
              $scope.hasError = hasError;
            };
          }
        ],
        link: function (scope, element, attrs, ctrls) {
          scope.syForm = ctrls[0];
          if (scope.syForm.options.horizontal) {
            attrs.inputClass = attrs.inputClass || 'col-sm-9';
            attrs.labelClass = attrs.labelClass || 'col-sm-3';
          } else if (scope.syForm.options.inline) {
            attrs.inputClass = attrs.inputClass || 'form-group';
            attrs.labelClass = attrs.labelClass || '';
          } else if (!scope.syForm.options.inline && !scope.syForm.options.multiline) {
            attrs.inputClass = attrs.inputClass || '';
            attrs.labelClass = attrs.labelClass || '';
          }
        }
      };
    }]);
  angular.module('synthAngular.syForm').directive('syFormInput', [
    '$compile',
    function ($compile) {
      return {
        restrict: 'A',
        require: [
          '^syForm',
          '^syFormGroup',
          '^form',
          '?^syValidationSchema'
        ],
        priority: 1000,
        link: function (scope, element, attrs, ctrls) {
          scope.syForm = ctrls[0];
          scope.syformGroup = ctrls[1];
          scope.form = ctrls[2];
          scope.syValidationSchema = ctrls[3];
          scope.showErrors = function () {
            if (!scope.syForm.options.input_message.enabled)
              return false;
            if (!scope.inputVar.$dirty)
              return false;
            else
              return true;
          };
          element.addClass('form-control');
          var inputName = attrs.name;
          scope.inputVar = scope.form[inputName];
          var errblock = '<span ng-if="showErrors()" class="help-block" ng-repeat="(validator, error) in inputVar.$error" ng-bind="getErrorMessage(validator)"></span>';
          element.after(errblock);
          $compile(element.next())(scope);
          scope.getErrorMessage = function (error) {
            if (angular.isString(scope.inputVar.$error[error]))
              return scope.inputVar.$error[error];
            if (scope.syValidationSchema) {
              return scope.syValidationSchema.getFieldErrorMessage(inputName, error);
            }
            return scope.syForm.options.input_message.error;
          };
          scope.$watch('inputVar.$error', function (value) {
            if (scope.showErrors() && value != undefined && Object.keys(value).length > 0)
              scope.syformGroup.setError(true);
            else
              scope.syformGroup.setError(false);
          }, true);
        }
      };
    }
  ]);
  angular.module('synthAngular.syValidation', []);
  angular.module('synthAngular.syValidation', []).provider('syValidatorSchema', function () {
    var validators = {
        required: { error: 'this field is required' },
        maxlength: {
          error: 'input field too long',
          attrname: 'ng-maxlength'
        },
        minlength: {
          error: 'input field too short',
          attrname: 'ng-minlength'
        }
      };
    this.add = function (name, validator) {
      validators[name] = validator;
    };
    this.get = function (name) {
      return validators[name];
    };
    this.getAttributeName = function (validator) {
      if (validators[validator] && validators[validator].attrname)
        return validators[validator].attrname;
      return validator;
    };
    this.$get = function () {
      return {
        set: this.set,
        get: this.get,
        getAttributeName: this.getAttributeName
      };
    };
  });
  angular.module('synthAngular.syValidation').provider('syEntitySchema', function () {
    var schemas = {};
    this.set = function (name, hash) {
      schemas[name] = hash;
    };
    this.get = function (name) {
      return schemas[name];
    };
    this.$get = function () {
      return {
        set: this.set,
        get: this.get
      };
    };
  });
  angular.module('synthAngular.syValidation').directive('syValidationSchema', [
    'syEntitySchema',
    'syValidatorSchema',
    function (syEntitySchema, syValidatorSchema) {
      var defaultSchema = {
          $global: {
            success: 'your form has been successfully submitted.',
            error: 'An error occured, please review all fields and submit the form again.'
          },
          $default: { error: 'this field is not valid' }
        };
      return {
        restrict: 'A',
        require: ['form'],
        controller: [
          '$scope',
          '$element',
          '$attrs',
          function ($scope, $element, $attrs) {
            var schema = syEntitySchema.get($attrs.syValidationSchema);
            schema = angular.extend({}, defaultSchema, schema);
            this.schema = schema;
            this.getFieldErrorMessage = function (fieldName, validator) {
              var validator_info = this.schema[fieldName];
              validator_info = angular.extend({}, this.schema.$default, syValidatorSchema.get(validator), validator_info[validator]);
              return validator_info.error;
            };
          }
        ],
        compile: function (tElem, tAttrs) {
          var schema = syEntitySchema.get(tAttrs.syValidationSchema);
          if (schema) {
            schema = angular.extend({}, defaultSchema, schema);
            var formElements = tElem[0].querySelectorAll('input,select,textarea');
            //Check all form field and setup angular validation
            angular.forEach(formElements, function (input) {
              var jqInput = angular.element(input);
              var input_name = jqInput.attr('name');
              if (schema[input_name]) {
                angular.forEach(schema[input_name], function (validator_info, validator) {
                  //var input_validator_info = angular.extend({}, schema.$default, syValidatorSchema.get(validator), validator_info);
                  var attrname = syValidatorSchema.getAttributeName(validator);
                  if (validator_info.value)
                    jqInput.attr(attrname, validator_info.value);
                  else
                    jqInput.attr(attrname, true);
                });
              }
            });
          } else {
            console.warn('syValidationSchema: invalid entity schema');
          }
        }
      };
    }
  ]);
  var synthAngular = angular.module('synthAngular', [
      'ngResource',
      'angularFileUpload'
    ]);
  synthAngular.provider('$apiManager', function () {
    var baseApiUrl = 'api/rest/:service/:id/:sub_service/:sub_id';
    var apiParams = {
        id: '@id',
        service: '@service',
        sub_id: '@sub_id',
        sub_service: '@service'
      };
    this.setApiParams = function (value) {
      apiParams = value;
    };
    this.setBaseApiUrl = function (value) {
      baseApiUrl = value;
    };
    this.$get = [
      '$resource',
      function ($resource) {
        return $resource(baseApiUrl, apiParams, {
          list: {
            method: 'GET',
            isArray: true
          },
          save: { method: 'POST' },
          update: { method: 'POST' },
          remove: { method: 'POST' },
          get: {
            method: 'GET',
            isArray: false
          }
        });
      }
    ];
  });
  synthAngular.service('$uiManager', [
    '$apiManager',
    '$filter',
    '$collectionManager',
    '$sockets',
    'syTools',
    '$q',
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
        }, function (err) {
          defer.reject(err);
        });
        return defer.promise;
      };
      this.createItem = function (service, params, model) {
        var defer = $q.defer();
        var finalParams = angular.extend({}, this.defaults, params);
        var finalQuery = angular.extend({}, this.queryParams, { service: service }, finalParams.search);
        if (!finalParams.socket_service)
          finalParams.socket_service = service ? service : '';
        $apiManager.save(finalQuery, model, function (data) {
          $collectionManager.addItem(finalParams.collection, data);
          if (finalParams.publish_to_socket)
            $sockets.publish(finalParams.socket_service, finalParams.socket_operation || 'add', data);
          defer.resolve(data);
        }, function (err) {
          delete model._method;
          defer.reject(err);
        });
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
        model._method = 'put';
        $apiManager.update(finalQuery, model, function (data) {
          delete model._method;
          syTools.mergeResourceProperties(model, data);
          if (finalParams.publish_to_socket)
            $sockets.publish(finalParams.socket_service, finalParams.socket_operation || 'update', data);
          defer.resolve(data);
        }, function (err) {
          delete model._method;
          defer.reject(err);
        });
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
        model._method = 'delete';
        $apiManager.remove(finalQuery, model, function (data) {
          delete model._method;
          $collectionManager.deleteItem(finalParams.collection, oldId);
          if (finalParams.publish_to_socket)
            $sockets.publish(finalParams.socket_service, finalParams.socket_operation || 'delete', oldId);
          defer.resolve(data);
        }, function (err) {
          defer.reject(err);
        });
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
  synthAngular.filter('findItem', [
    '$filter',
    function ($filter) {
      return function (collection, id) {
        var doublons = $filter('filter')(collection, { id: id }, true);
        if (doublons.length > 0)
          return doublons[0];
        return null;
      };
    }
  ]);
  synthAngular.factory('syTools', function () {
    var fcts = {
        mergeResourceProperties: function (resourceObj, Obj) {
          for (var attrname in Obj) {
            if (attrname.substr(0, 1) != '$')
              resourceObj[attrname] = Obj[attrname];
          }
          for (var attrname in resourceObj) {
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
      this.clank.on('socket/connect', function (session) {
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
  synthAngular.service('$collectionManager', [
    '$filter',
    'syTools',
    function ($filter, syTools) {
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
      };
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
    }
  ]);
  synthAngular.factory('uploadFile', [
    '$upload',
    '$sockets',
    function ($upload, $sockets) {
      return $upload;
    }
  ]);
}(window, document));