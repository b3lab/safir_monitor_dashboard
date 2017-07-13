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

    describe('Monitor API', function () {
        var testCall, service, today, lastweek;
        var apiService = {};
        var toastService = {};

        beforeEach(
            module('horizon.mock.openstack-service-api',
                function ($provide, initServices) {
                    testCall = initServices($provide, apiService, toastService);
                })
        );

        beforeEach(module('horizon.app.core.openstack-service-api'));

        beforeEach(inject(['horizon.app.core.openstack-service-api.monitor', function (monitorAPI) {
            service = monitorAPI;
        }]));

        it('defines the service', function () {
            expect(service).toBeDefined();
        });

        it("mocks the Date object and sets it to today", function () {
            today = new Date();
            jasmine.clock().install()
            jasmine.clock().mockDate(today);

            jasmine.clock().tick(50);
            expect(new Date().getTime()).toEqual(today.getTime() + 50);
        });

        it("mocks the Date object and sets it to lastweek", function () {
            lastweek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

            jasmine.clock().mockDate(lastweek);

            jasmine.clock().tick(50);
            expect(new Date().getTime()).toEqual(lastweek.getTime() + 50);
        });

        var tests = [
            {
                func: 'getSamples',
                method: 'get',
                path: '/api/ceilometer/samples/hardware.cpu.util/undefined/undefined/undefined/100/',
                error: 'Unable to retrieve telemetry samples.',
                testInput: ['hardware.cpu.util', 'undefined', 'undefined', 'undefined', 100]
            },
            {
                func: 'getInstanceCPUUtilization',
                method: 'get',
                path: '/api/ceilometer/instance/cpuutilization/undefined/undefined/100/undefined/',
                error: 'Unable to retrieve instance CPU utilizations.',
                testInput: ['undefined', 'undefined', 100, 'undefined']
            },
            {
                func: 'getInstanceRamUtilization',
                method: 'get',
                path: '/api/ceilometer/instance/ramutilization/undefined/undefined/100/undefined/',
                error: 'Unable to retrieve instance RAM utilizations.',
                testInput: ['undefined', 'undefined', 100, 'undefined']
            },
            {
                func: 'getInstanceDiskUtilization',
                method: 'get',
                path: '/api/ceilometer/instance/diskutilization/undefined/undefined/100/undefined/',
                error: 'Unable to retrieve instance disk utilizations.',
                testInput: ['undefined', 'undefined', 100, 'undefined']
            },
            {
                func: 'getInstanceNetworkUtilization',
                method: 'get',
                path: '/api/ceilometer/instance/networkutilization/undefined/undefined/100/undefined/',
                error: 'Unable to retrieve instance network utilizations.',
                testInput: ['undefined', 'undefined', 100, 'undefined']
            },
            {
                func: 'getHostCPUUtilization',
                method: 'get',
                path: '/api/ceilometer/host/cpuutilization/undefined/undefined/100/undefined/',
                error: 'Unable to retrieve host CPU utilizations.',
                testInput: ['undefined', 'undefined', 100, 'undefined']
            },
            {
                func: 'getHostRAMUtilization',
                method: 'get',
                path: '/api/ceilometer/host/ramutilization/undefined/undefined/100/undefined/',
                error: 'Unable to retrieve host RAM utilizations.',
                testInput: ['undefined', 'undefined', 100, 'undefined']
            },
            {
                func: 'getHostDiskUtilization',
                method: 'get',
                path: '/api/ceilometer/host/diskutilization/undefined/undefined/100/undefined/',
                error: 'Unable to retrieve host disk utilizations.',
                testInput: ['undefined', 'undefined', 100, 'undefined']
            },
            {
                func: 'getHostNetworkUtilization',
                method: 'get',
                path: '/api/ceilometer/host/networkutilization/undefined/undefined/100/undefined/',
                error: 'Unable to retrieve host network utilizations.',
                testInput: ['undefined', 'undefined', 100, 'undefined']
            },
            {
                func: 'getHosts',
                method: 'get',
                path: '/api/instancemonitor/hostlist/',
                error: 'Unable to retrieve host list.'
            },
            {
                func: 'getInstances',
                method: 'get',
                path: '/api/instancemonitor/instances/de1ca16c579242b58dc1a07871a04189/1/',
                error: 'Unable to retrieve instance list.',
                testInput: ['de1ca16c579242b58dc1a07871a04189', 1]
            },
            {
                func: 'getAlarms',
                method: 'get',
                path: '/api/ceilometer/alarms/',
                error: 'Unable to retrieve alarm list.'
            },

            {
                func: 'launchAlarm',
                method: 'put',
                path: '/api/ceilometer/alarms/',
                data: {alarm: 'alarm'},
                error: 'Unable to launch alarm.',
                testInput: [
                    {
                        alarm: 'alarm'
                    }
                ]
            },
            {
                func: 'deleteAlarm',
                method: 'put',
                path: '/api/ceilometer/deletealarm/',
                data: {alarm: 'alarm'},
                error: 'Unable to delete alarm.',
                testInput: [
                    {
                        alarm: 'alarm'
                    }
                ]
            }

        ];

        // Iterate through the defined tests and apply as Jasmine specs.
        angular.forEach(tests, function (params) {
            it('defines the ' + params.func + ' call properly', function () {
                var callParams = [apiService, service, toastService, params];
                testCall.apply(this, callParams);
            });
        });

    });

})();
