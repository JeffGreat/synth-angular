angular.module('synthAngular.templates', []).run(['$templateCache', function($templateCache) {
  $templateCache.put("syForm/sy-form-group.tpl.html",
    "<div class=\"form-group\" ng-class=\"{'has-error' : hasError}\">\n" +
    "    <label ng-if=\"inputLabel\" class=\"control-label\" ng-class=\"labelClass\" ng-bind-html=\"inputLabel\"></label>\n" +
    "    <div ng-class=\"inputClass\" ng-transclude></div>\n" +
    "</div>");
  $templateCache.put("syList/sy-list.tpl.html",
    "<div class=\"wrapper wrapper-content animated fadeInRight\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-lg-12\">\n" +
    "            <div class=\"ibox float-e-margins\">\n" +
    "                <div class=\"ibox-title\">\n" +
    "                    <h5>{{ options.title }}</h5>\n" +
    "                    <div class=\"ibox-tools\">\n" +
    "                        <span ng-repeat=\"action in options.headerActions\" class=\"{{options.headerClass}}\">\n" +
    "                            <a class=\"collapse-link\" ui-sref=\"{{action.url}}\">\n" +
    "                                <i class=\"fa fa-{{action.icon}}\" ></i>{{action.title}}\n" +
    "                            </a>\n" +
    "                        </span>\n" +
    "                    </div> \n" +
    "                </div>\n" +
    "                \n" +
    "                <div class=\"ibox-content table-responsive\" infinite-scroll='scroll()' infinite-scroll-distance=\"0\" ng-if=\"listElements.length > 0\">\n" +
    "                    <table class=\"table table-striped table-hover\" >\n" +
    "                        <thead>\n" +
    "                            <tr role=\"row\" >\n" +
    "                                <th ng-repeat=\"field in options.fields\" class=\"sorting_asc\"  rowspan=\"1\" colspan=\"1\">\n" +
    "                                    {{ field.title }}\n" +
    "                                </th>\n" +
    "                                <th ng-if=\"options.actionColumn.length > 0\" class=\"text-right\">\n" +
    "                                    {{ options.actionColumnTitle }}\n" +
    "                                </th>\n" +
    "                            </tr>\n" +
    "                        </thead>\n" +
    "                        <tbody>\n" +
    "                            <tr ng-repeat=\"item in listElements\" role=\"row\">\n" +
    "                                <td ng-repeat=\"field in options.fields\" sy-list-cell=\"field\" ng-class=\"field.class\">\n" +
    "                                    \n" +
    "                                </td>\n" +
    "                                <td ng-if=\"options.actionColumn.length > 0\" class=\"text-right\">\n" +
    "                                    <span ng-repeat=\"field in options.actionColumn\" sy-list-cell=\"field\"><a ui-sref=\"{{field.url}}\"><i class=\"fa fa-{{field.icon}}\"></i></a>&nbsp;</span>\n" +
    "                                </td>\n" +
    "                            </tr>\n" +
    "                        </tbody>\n" +
    "                    </table>\n" +
    "                    \n" +
    "                    <div class=\"alert alert-success\" id=\"alert-message\" ng-show=\"confirmed\">\n" +
    "                        <button type=\"button\" class=\"close\" data-dismiss=\"alert\">x</button>\n" +
    "                        {[{ confirmed }]}\n" +
    "                    </div>\n" +
    "                    \n" +
    "                </div>\n" +
    "                <div ng-show=\"listElement.length == 0\" class=\"alert alert-danger\">\n" +
    "                    <span >Il n'existe aucun éléments pour l'instant.</span><br/>\n" +
    "                    <span >Vous pouvez en ajouter un <button class=\"btn btn-primary btn-xs\" ng-click=\"launch('create')\"><i class=\"fa fa-plus\"></i> ici</button></span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>");
}]);
