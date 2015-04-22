angular.module('synthAngular.syValidation', []);

angular.module('synthAngular.syValidation', []).provider('syValidatorSchema', function() {
    var validators = {
        required: {
            error: 'this field is required'
        },
        maxlength: {
            error: 'input field too long',
            attrname: 'ng-maxlength'
        },
        minlength: {
            error: 'input field too short',
            attrname: 'ng-minlength'
        }
    };

    this.add = function(name, validator) {
        validators[name] = validator;
    };

    this.get = function(name) {
        return validators[name];
    }
    
    this.getAttributeName = function(validator) {
        if(validators[validator] && validators[validator].attrname)
            return validators[validator].attrname;
        return validator;
    }

    this.$get = function() {
        return {
            set: this.set,
            get: this.get,
            getAttributeName: this.getAttributeName
        }
    }

});

angular.module('synthAngular.syValidation').provider('syEntitySchema', function() {

    var schemas = {};

    this.set = function(name, hash) {
        schemas[name] = hash;
    };

    this.get = function(name) {
        return schemas[name];
    }

    this.$get = function() {
        return {
            set: this.set,
            get: this.get
        }
    }
});


angular.module('synthAngular.syValidation').directive('syValidationSchema', ['syEntitySchema', 'syValidatorSchema',
    function(syEntitySchema, syValidatorSchema) {
        var defaultSchema = {
            // default validation is set to required
            $global: {
                success: 'your form has been successfully submitted.',
                error: 'An error occured, please review all fields and submit the form again.'
            },
            $default: { error: 'this field is not valid' }
        };

        return {
            restrict: 'A',
            require: ['form'],
            controller: function($scope, $element, $attrs) {
                var schema = syEntitySchema.get($attrs.syValidationSchema);
                schema = angular.extend({}, defaultSchema, schema);
                this.schema = schema;

                this.getFieldErrorMessage = function(fieldName, validator) {
                    var validator_info = this.schema[fieldName];
                    validator_info = angular.extend({}, this.schema.$default, syValidatorSchema.get(validator), validator_info[validator]);
                    return validator_info.error;

                }

            },
            compile: function(tElem, tAttrs) {

                var schema = syEntitySchema.get(tAttrs.syValidationSchema);

                if (schema) {
                    schema = angular.extend({}, defaultSchema, schema);

                    var formElements = tElem[0].querySelectorAll('input,select,textarea');
                    //Check all form field and setup angular validation
                    angular.forEach(formElements, function(input) {
                        var jqInput = angular.element(input);
                        var input_name = jqInput.attr('name');

                        if (schema[input_name]) {
                            angular.forEach(schema[input_name], function(validator_info, validator) {
                                //var input_validator_info = angular.extend({}, schema.$default, syValidatorSchema.get(validator), validator_info);
                                var attrname = syValidatorSchema.getAttributeName(validator);
                                if (validator_info.value)
                                    jqInput.attr(attrname, validator_info.value);
                                else
                                    jqInput.attr(attrname, true);
                            });
                        }
                    });
                }
                else {
                    console.warn('syValidationSchema: invalid entity schema');
                }
            }
        }
    }
]);