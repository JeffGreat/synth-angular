angular.module('synthAngular.syForm', ['ngResource']);

angular.module('synthAngular.syForm', []).provider('syFormDefaultValue', function() {
    var default_options = {
        horizontal: true,
        inline: false,
        form_message_container: undefined,
        form_message_error: {
            enabled: false,
            message: "Your form contains errors",
        },
        form_message_success: {
            enabled: false,
            message: "operation successful"
        },
        input_message: {
            enabled: true,
            error: "invalid input"
        },
        data_loading_text: 'saving...'

    };
    
    this.get = function() {
        return default_options;
    }
    
    this.set = function(options) {
        default_options = angular.extend({}, default_options, options);
        return default_options;
    }
    
    this.$get = function() {
        return {
            get: this.get,
            set: this.set
        }
    }
    
});

angular.module('synthAngular.syForm').directive('syForm', ['$q', 'syFormDefaultValue', '$compile', function($q, syFormDefaultValue, $compile) {
    return {
        restrict: 'A',
        require: ['form'],
        scope: {
            syForm: "=?syForm",
            sySubmit: "&"
        },
        controller: function($scope, $element, $attrs) {
            

            this.options = angular.extend(syFormDefaultValue.get(), $scope.syForm);

            if (this.options.horizontal)
                $element.addClass('form-horizontal');
            if (this.options.inline)
                $element.addClass('form-inline');

        },
        link: function(scope, element, attrs, ctrls) {
            var form = ctrls[0];
            var options = angular.extend(syFormDefaultValue.get(), scope.syForm);

            function setButtonState(state) {
                var btn = $("[type=submit]", element);
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

            scope.resetFormError = function() {
                form.$error = {};
                scope.$broadcast('resetFormErrors', form);
            }

            scope.setServerErrors = function(serverResponse) {
                var form_errors = scope.compileErrors(serverResponse);
                angular.forEach(form_errors, function(field_errors, fieldName) {
                    if (angular.isDefined(form[fieldName])){
                        angular.forEach(field_errors, function(field_error, key){
                            form[fieldName].$error[key] = field_error;    
                        });
                    }
                });
            };

            scope.compileErrors = function(data) {
                var errors = {};
                angular.forEach(data, function(error, name) {
                    if (typeof(error) === 'string') {
                        if (errors[name] == undefined)
                            errors[name] = [error];
                        else
                            errors[name].push(error);
                    }
                    else if (typeof(error) === 'object') {
                        var suberrors = scope.compileErrors(error);
                        angular.forEach(suberrors, function(suberror, subname) {
                            if (errors[subname] == undefined)
                                errors[subname] = suberror;
                            else
                                errors[subname].concat(suberror);
                        });
                    }
                });
                return errors;
            };

            scope.showFormMessage = function(type){
                var container = {};
                if (options.form_message_container == undefined)
                    container = angular.element('form[name="' + form.$name + '"]');
                else
                    container = angular.element(options.form_message_container);
                var html = "";
                if(type == "success" && options.form_message_success.enabled)
                    html = '<br/><alert type="'+ type +'" close="close()" >' + options.form_message_success.message + '</alert>';
                else if(options.form_message_error.enabled)
                    html = '<br/><alert type="'+ type +'" close="close()" >' + options.form_message_error.message + '</alert>';
                container.after($compile(html)(scope)); 
            };

            function submitForm(ev) {
                scope.$apply(function() {
                    if (!form.$submitting) {
                        setButtonState(true);
                        var res = $q.when(scope.$parent.$eval(scope.sySubmit));

                        res.then(function(data) {
                            scope.showFormMessage('success');
                        }, function(data) {
                            scope.resetFormError();
                            scope.setServerErrors(data.data);
                            scope.showFormMessage('danger');
                        }).finally(function(data) {
                            setButtonState(false);
                            //form.$setPristine();
                        });
                    }

                    ev.preventDefault();
                });
            }

            element.on('submit', submitForm);
            scope.$on('destroy', function() {
                element.off('submit', submitForm);
            });
        }
    }
}]);

angular.module('synthAngular.syForm').directive('syFormGroup', [function() {
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
        controller: function($scope) {
            $scope.hasError = false;
            this.setError = function(hasError) {
                $scope.hasError = hasError;
            }
        },
        link: function(scope, element, attrs, ctrls) {
            scope.syForm = ctrls[0];
            if (scope.syForm.options.horizontal) {
                attrs.inputClass = attrs.inputClass || 'col-sm-9';
                attrs.labelClass = attrs.labelClass || 'col-sm-3';
            }
            else if (scope.syForm.options.inline) {
                attrs.inputClass = attrs.inputClass || 'form-group';
                attrs.labelClass = attrs.labelClass || '';
            }
            else if (!scope.syForm.options.inline && !scope.syForm.options.multiline) {
                attrs.inputClass = attrs.inputClass || '';
                attrs.labelClass = attrs.labelClass || '';
            }
        }

    };
}]);

angular.module('synthAngular.syForm').directive('syFormInput', ['$compile', function($compile) {
    return {
        restrict: 'A',
        require: ['^syForm', '^syFormGroup', '^form', '?^syValidationSchema'],
        priority: 1000,
        link: function(scope, element, attrs, ctrls) {
            scope.syForm = ctrls[0];
            scope.syformGroup = ctrls[1];
            scope.form = ctrls[2];
            scope.syValidationSchema = ctrls[3];

            scope.showErrors = function() {
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

            scope.getErrorMessage = function(error) {
                if (angular.isString(scope.inputVar.$error[error]))
                    return scope.inputVar.$error[error];
                if (scope.syValidationSchema) {
                    return scope.syValidationSchema.getFieldErrorMessage(inputName, error);
                }
                return scope.syForm.options.input_message.error;
            };

            scope.$watch('inputVar.$error', function(value) {
                if (scope.showErrors() && value != undefined && Object.keys(value).length > 0)
                    scope.syformGroup.setError(true);
                else
                    scope.syformGroup.setError(false);
            }, true);

            scope.$on('resetFormErrors', function(event, form){
                inputVar.$error = {};
            });


        }
    };
}]);