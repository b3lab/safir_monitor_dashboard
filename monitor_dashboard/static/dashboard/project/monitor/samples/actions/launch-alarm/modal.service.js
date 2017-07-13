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
        .factory('horizon.dashboard.project.monitor.samples.actions.launch-alarm', launchAlarmService);

    launchAlarmService.$inject = [
        '$q',
        '$modal',
        'horizon.dashboard.project.monitor.basePath',
        'horizon.framework.widgets.toast.service',
        'horizon.framework.util.i18n.gettext',
        'horizon.framework.util.q.extensions'
    ];

    /**
     * @ngdoc service
     * @ngname horizon.dashboard.project.monitor.samples.actions.launch-alarm.modal.service
     *
     * @description
     * Provides the service to launch an alarm.
     *
     * @param $q The angular service for promises.
     * @param $modal The angular bootstrap $modal service.
     * @param basePath The Monitor module base path.
     * @param toastService The horizon toast service.
     * @param gettext The horizon gettext function for translation.
     * @param qExtensions Horizon extensions to the $q service.
     *
     * @returns The Launch Alarm modal service.
     */
    function launchAlarmService($q,
                                $modal,
                                basePath,
                                toastService,
                                gettext,
                                qExtensions) {

        var service = {
            perform: open,
            allowed: allowed
        };

        return service;

        //////////////

        function allowed(instance) {
            return $q.all([
                qExtensions.booleanAsPromise(true)  // ?
            ]);
        }

        function open(instance) {
            var spec = {
                backdrop: 'static',
                controller: 'LaunchAlarmModalController as modal',
                templateUrl: basePath + 'samples/actions/launch-alarm/modal.html',
                resolve: {
                    instance_id: function () {
                        return instance.id;
                    }
                }
            };
            $modal.open(spec).result.then(onModalClose);
        }

        function onModalClose() {
            toastService.add('success', gettext('Launching alarm.'));
        }
    }
})();