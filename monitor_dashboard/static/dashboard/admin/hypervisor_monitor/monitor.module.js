/* Copyright 2017 TUBITAK, BILGEM, B3LAB
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use self file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
(function () {
  'use strict';

  /**
   * @ngdoc overview
   * @name horizon.dashboard.admin.hypervisor_monitor
   * @description
   * A monitor module.
   */

  angular
    .module('horizon.dashboard.admin.hypervisor_monitor', [
      'ngRoute',
      'horizon.dashboard.admin.hypervisor_monitor.hypervisors'

    ])
    .config(config);
    // this is the right place to add .constant() declarations for
    // the module

  config.$inject = [
    '$provide',
    '$windowProvider',
    '$routeProvider'
  ];

  function config($provide, $windowProvider, $routeProvider) {
    var basePath = $windowProvider.$get().STATIC_URL + 'dashboard/admin/hypervisor_monitor/';
    $provide.constant('horizon.dashboard.admin.hypervisor_monitor.basePath', basePath);

    var samples = '/admin/hypervisor_monitor';

    $routeProvider.when(samples, {
        templateUrl: basePath + 'hypervisors/hypervisor_monitor.html'
      });
  }

}());