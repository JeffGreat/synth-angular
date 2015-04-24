/**
 * Angular tools made by Apsynth
 * @version v1.1.0 - 2015-04-16
 * @link https://github.com/JeffGreat/synth-angular
 * @author 
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

angular.module('synthAngular.templates', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('syForm/sy-form-group.tpl.html', '<div class="form-group" ng-class="{\'has-error\' : hasError}">\n' + '    <label class="control-label" ng-class="labelClass" ng-bind-html="inputLabel"></label>\n' + '    <div ng-class="inputClass" ng-transclude></div>\n' + '</div>');
  }
]);