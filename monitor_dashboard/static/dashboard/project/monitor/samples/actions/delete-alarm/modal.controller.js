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
        .controller('DeleteAlarmModalController', DeleteAlarmModalController);

    DeleteAlarmModalController.$inject = [
        '$modalInstance',
        'horizon.app.core.openstack-service-api.monitor',
        'horizon.framework.util.i18n.gettext',
        // Dependencies injected with resolve by $modal.open
        'alarms'
    ];

    /**
     * @ngdoc controller
     * @name DeleteAlarmModalController
     * @description
     * Controller used by the modal service for deleteing an alarm.
     *
     * @param $modalInstance The angular bootstrap $modalInstance service.
     * @param api The horizon monitor API service.
     * @param gettext The horizon gettext function for translation.
     * @param alarms Defined alarms.
     *
     * @returns The Delete Alarm modal controller.
     */

    function DeleteAlarmModalController($modalInstance, api, gettext, alarms) {
        var ctrl = this;

        ctrl.cancel = cancel;
        ctrl.save = save;
        ctrl.saving = false;

        ctrl.alarmlist = initAlarms(alarms);
        ctrl.selectedAlarm = ctrl.alarmlist.length === 1 ? ctrl.alarmlist[0] : null;

        function save() {
            ctrl.saving = true;

            var alarm = {};
            alarm.alarm_id =  ctrl.selectedAlarm.key;
            deleteAlarm(alarm);
        }

        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        function onSuccess() {
            $modalInstance.close();
        }

        function onFailure() {
            ctrl.saving = false;
        }

        function initAlarms(alarmlist) {
            var alarm_list = [];
            for (var key in alarmlist) {
              if (alarmlist.hasOwnProperty(key)) {
                  alarm_list.push({key: key, value: alarmlist[key]});
              }
            }
            return alarm_list;
        }

        function deleteAlarm(alarm) {
            return api.deleteAlarm(alarm).then(onSuccess, onFailure);
        }

    }
})();