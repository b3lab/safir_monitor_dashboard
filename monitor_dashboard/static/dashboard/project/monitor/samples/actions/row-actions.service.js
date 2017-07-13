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

    angular
        .module('horizon.dashboard.project.monitor.samples')
        .factory('horizon.dashboard.project.monitor.samples.actions.rowActions',
            tableRowActions);

    tableRowActions.$inject = [
        '$location',
        'horizon.dashboard.project.monitor.samples.actions.launch-alarm',
        'horizon.dashboard.project.monitor.samples.actions.delete-alarm',
        'horizon.dashboard.project.monitor.samples.actions.export-metrics',
        'horizon.framework.util.i18n.gettext'
    ];

    /**
     * @ngdoc service
     * @ngname horizon.dashboard.project.monitor.samples.actions.rowActions
     *
     * @description
     * Provides the service for the Monitor row actions.
     *
     * @param $location The angular $location service.
     * @param basePath The sample module base path.
     * @param gettext The horizon gettext function for translation.
     * @param launchAlarmService The launch alarm service.
     * @param deleteAlarmService The delete alarm service.
     * @param exportMetricsService The export metrics service.
     * @returns Monitor table row actions service object.
     */

    function tableRowActions($location,
                             launchAlarmService,
                             deleteAlarmService,
                             exportMetricsService,
                             gettext) {

        var service = {
            actions: actions
        };

        return service;

        ///////////////

        function actions() {
            return [{
                service: launchAlarmService,
                template: {
                    text: gettext('Launch Alarm')
                }
            },{
                service: deleteAlarmService,
                template: {
                    text: gettext('Delete Alarm')
                }
            },{
                service: exportMetricsService,
                template: {
                    text: gettext('Export Metrics')
                }
            }];
        }
    }

})();
