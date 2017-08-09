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
        '$uibModalInstance',
        'horizon.app.core.openstack-service-api.monitor',
        'alarms'
    ];

    /**
     * @ngdoc controller
     * @name DeleteAlarmModalController
     * @description
     * Controller used by the modal service for deleteing an alarm.
     *
     * @param $uibModalInstance The angular bootstrap $uibModalInstance service.
     * @param api The horizon monitor API service.
     * @param alarms Defined alarms.
     *
     * @returns The Delete Alarm modal controller.
     */

    function DeleteAlarmModalController($uibModalInstance, api, alarms) {
        var ctrl = this;

        ctrl.cancel = cancel;
        ctrl.save = save;
        ctrl.saving = false;

        ctrl.alarmlist = initAlarms();
        ctrl.selectedAlarm = ctrl.alarmlist.length === 1 ? ctrl.alarmlist[0] : null;

        function save() {
            ctrl.saving = true;

            var alarm = {};
            alarm.alarm_id =  ctrl.selectedAlarm.key;
            deleteAlarm(alarm);
        }

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

        function onSuccess() {
            $uibModalInstance.close();
        }

        function onFailure() {
            ctrl.saving = false;
        }

        function initAlarms() {
            var alarm_list = [];
            for (var key in alarms) {
              if (alarms.hasOwnProperty(key)) {
                  alarm_list.push({key: key, value: alarms[key]});
              }
            }
            return alarm_list;
        }

        function deleteAlarm(alarm) {
            return api.deleteAlarm(alarm).then(onSuccess, onFailure);
        }

    }
})();