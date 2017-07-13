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
(function() {
  'use strict';

  describe('horizon.dashboard.admin.hypervisor_monitor.hypervisors.actions.export-metrics', function() {
    var labels = {
      title: gettext('Export Metrics'),
      body: gettext('Metrics of this host will be exported as csv format.' +
                'Do you want to continue?'),
      submit: gettext('Yes')
    };


    var simpleModalService = {
      modal: function () {
        return {
          result: {
            then: function (do_export) {
              do_export;
            }
          }
        };
      }
    };



    var monitorAPI, $q, service, csv_file;

    ///////////////////////
    beforeEach(module('horizon.framework.util'));
    beforeEach(module('horizon.framework.widgets'));
    beforeEach(module('horizon.dashboard.admin.hypervisor_monitor.hypervisors'));

    beforeEach(module(function ($provide) {
            $provide.value('$uibModal', {});
        }));
    beforeEach(module(function($provide) {
      $provide.value('horizon.framework.widgets.modal.simple-modal.service', simpleModalService);
    }));

    beforeEach(inject(function($injector) {
      $q = $injector.get('$q');
      service = $injector.get('horizon.dashboard.admin.hypervisor_monitor.hypervisors.actions.export-metrics');
    }));

    it('should open the modal with correct message', function() {
      var fakeModalService = {
        result: {
          then: function (do_export) {do_export()}
        }
      };

      var host =
        {hypervisor_hostname: 'host1',
         cpuUsage: [{x:'2017-06-12T11:36:48.593000',y:4.00},{x:'2017-06-12T11:36:48.593000',y:8.00}],
         ramUsage: [{x:'2017-06-12T11:36:48.593000',y:4.00},{x:'2017-06-12T11:36:48.593000',y:8.00}],
         diskUsage: [{x:'2017-06-12T11:36:48.593000',y:4.00},{x:'2017-06-12T11:36:48.593000',y:8.00}],
         incomingNetworkUsage: [{x:'2017-06-12T11:36:48.593000',y:4.00},{x:'2017-06-12T11:36:48.593000',y:8.00}],
         outgoingNetworkUsage: [{x:'2017-06-12T11:36:48.593000',y:4.00},{x:'2017-06-12T11:36:48.593000',y:8.00}]
        } ;

      spyOn(simpleModalService, 'modal').and.returnValue(fakeModalService);

      service.perform(host);
      expect(simpleModalService.modal).toHaveBeenCalled();
      var args = simpleModalService.modal.calls.argsFor(0)[0];
      expect(args.body).toEqual(labels.body);
    });


  });

  })();
