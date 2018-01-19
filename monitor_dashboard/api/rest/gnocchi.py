# Copyright 2017 TUBITAK, BILGEM, B3LAB
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""monitor API over ceilometer
"""

from django.conf import settings
from django.views import generic
from monitor_dashboard.api import gnocchi
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils

import dateutil.parser


bps_to_mbps = 0.000001
network_bytes_max_value = 4294967295


@urls.register
class Metrics(generic.View):
    """ API for gnocchi metrics
    """
    url_regex = r'gnocchi/metrics/$'

    @rest_utils.ajax()
    def get(self, request):
        metrics = gnocchi.metric_list(request)
        return {'items': metrics}


@urls.register
class Measures(generic.View):
    """ API for gnocchi measures
    """
    url_regex = r'gnocchi/measures/' \
                r'(?P<metric_name>[^/]+)/' \
                r'(?P<instance_id>[^/]+)/' \
                r'(?P<project_id>[^/]+)/' \
                r'(?P<start>[^/]+)/' \
                r'(?P<end>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, metric_name, instance_id, project_id, start, end):

        resource_ids = self.find_resource_id(request, metric_name, instance_id)

        measures = []
        for resource in resource_ids:
            resource_id = resource['id']
            g_measures = self.get_measures(request,
                                           metric_name,
                                           resource_id,
                                           start,
                                           end)
            utils = {'resource_id': resource['original_id'],
                     'utils': g_measures}
            measures.append(utils)

        return {'metric_name': metric_name,
                'project_id': project_id,
                'instance_id': instance_id,
                'measures': measures}

    def get_measures(self, request, metric_name, resource_id, start, end):

        if metric_name == 'memory_util' or metric_name == 'disk_util':
            # TODO(ecelik): we should check if memory_util or disk_util
            # is already in gnocchi metrics
            measures = []
            if metric_name == 'memory_util':
                capacity_measures = gnocchi.get_measures(request,
                                                         'memory',
                                                         resource_id,
                                                         start,
                                                         end)
                # TODO(ecelik): we need memory.usage
                usage_measures = gnocchi.get_measures(request,
                                                      'memory.resident',
                                                      resource_id,
                                                      start,
                                                      end)

            else:  # if metric_name == 'disk_util':
                capacity_measures = gnocchi.get_measures(request,
                                                         'disk.capacity',
                                                         resource_id,
                                                         start,
                                                         end)
                usage_measures = gnocchi.get_measures(request,
                                                      'disk.allocation',
                                                      resource_id,
                                                      start,
                                                      end)

            if len(capacity_measures) > 0 and len(usage_measures) > 0:
                cap_idx = 0
                cap = capacity_measures[cap_idx][2]
                for data in usage_measures:
                    if cap_idx + 1 < len(capacity_measures):
                        if data[0] <= capacity_measures[cap_idx + 1][0]:
                            cap = capacity_measures[cap_idx][2]
                        else:
                            cap_idx += 1
                            cap = capacity_measures[cap_idx][2]
                    if cap > 0:
                        measures.append([data[0],  # timestamp
                                         data[1],  # granularity
                                         "{0:.2f}".format(data[2] / cap * 100.)
                                         ])
        else:
            measures = gnocchi.get_measures(request,
                                            metric_name,
                                            resource_id,
                                            start,
                                            end)

            for data in measures:
                if 'network' in metric_name:
                    data[2] = "{0:.2f}".format(data[2] * 8.0 * bps_to_mbps)
                else:
                    data[2] = "{0:.2f}".format(data[2])

        return measures

    def find_resource_id(self, request, metric_name, instance_id):
        resource_ids = []
        if 'network' in metric_name:
            resources = gnocchi.get_resources(request,
                                              'instance_network_interface')
            for res in resources:
                if res['instance_id'] == instance_id:
                    resource_ids.append(
                        {'id': res['id'],
                         'original_id': res['original_resource_id']})
        # disk.capacity and disk.allocation with instance_id gives total
        # disk usage, otherwise we can get all disk devices independently
        # elif 'disk' in metric_name:
        #     resources = gnocchi.get_resources(request,
        #                                       'instance_disk')
        #     for res in resources:
        #         if res['instance_id'] == instance_id:
        #             resource_ids.append({
        #                 'id': res['id'],
        #                 'original_id': res['original_resource_id']})
        else:
            resource_ids.append({'id': instance_id,
                                 'original_id': instance_id})
        return resource_ids


@urls.register
class HardwareMeasures(generic.View):
    """ API for gnocchi measures
    """
    url_regex = r'gnocchi/hardware_measures/' \
                r'(?P<metric_name>[^/]+)/' \
                r'(?P<hostname>[^/]+)/' \
                r'(?P<start>[^/]+)/' \
                r'(?P<end>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, metric_name, hostname, start, end):

        resource_ids = self.find_resource_id(request, metric_name, hostname)

        measures = []
        for resource in resource_ids:
            resource_id = resource['id']
            g_measures = self.get_measures(request,
                                           metric_name,
                                           resource_id,
                                           start,
                                           end)
            utils = {'resource_id': resource['original_id'],
                     'utils': g_measures}
            measures.append(utils)

        return {'metric_name': metric_name,
                'hostname': hostname,
                'measures': measures}

    def get_measures(self, request, metric_name, resource_id, start, end):

        if metric_name == 'hardware.memory.util' or \
           metric_name == 'hardware.disk.util':
            measures = []
            if metric_name == 'hardware.memory.util':
                capacity_measures = gnocchi.get_measures(
                    request,
                    'hardware.memory.total',
                    resource_id,
                    start,
                    end)
                usage_measures = gnocchi.get_measures(
                    request,
                    'hardware.memory.used',
                    resource_id,
                    start,
                    end)

            else:  # if metric_name == 'hardware.disk.util':
                capacity_measures = gnocchi.get_measures(
                    request,
                    'hardware.disk.size.total',
                    resource_id,
                    start,
                    end)
                usage_measures = gnocchi.get_measures(
                    request,
                    'hardware.disk.size.used',
                    resource_id,
                    start,
                    end)

            if len(capacity_measures) > 0 and len(usage_measures) > 0:
                cap_idx = 0
                cap = capacity_measures[cap_idx][2]
                for data in usage_measures:
                    if cap_idx + 1 < len(capacity_measures):
                        if data[0] <= capacity_measures[cap_idx + 1][0]:
                            cap = capacity_measures[cap_idx][2]
                        else:
                            cap_idx += 1
                            cap = capacity_measures[cap_idx][2]
                    if cap > 0:
                        measures.append([data[0],  # timestamp
                                         data[1],  # granularity
                                         "{0:.2f}".format(data[2] / cap * 100.)
                                         ])
        elif metric_name == 'hardware.network.incoming.bytes.rate' or \
                metric_name == 'hardware.network.outgoing.bytes.rate':
            if metric_name == 'hardware.network.incoming.bytes.rate':
                cumulative_measures = gnocchi.get_measures(
                    request,
                    'hardware.network.incoming.bytes',
                    resource_id,
                    start,
                    end)
            else:
                cumulative_measures = gnocchi.get_measures(
                    request,
                    'hardware.network.outgoing.bytes',
                    resource_id,
                    start,
                    end)
            measures = []

            for index in range(len(cumulative_measures)):
                if index > 0:
                    t1 = dateutil.parser.parse(
                        cumulative_measures[index][0])
                    t2 = dateutil.parser.parse(
                        cumulative_measures[index - 1][0])
                    delta = t1 - t2
                    diff = (cumulative_measures[index][2] -
                            cumulative_measures[index - 1][2])
                    if diff < 0:
                        diff += network_bytes_max_value
                    if delta.total_seconds() > 0:
                        data = [cumulative_measures[index][0],  # timestamp
                                cumulative_measures[index][1],  # granularity
                                "{0:.2f}".format(
                                    diff / delta.total_seconds() *
                                    8. * bps_to_mbps)
                                ]
                        measures.append(data)

        else:
            measures = gnocchi.get_measures(request,
                                            metric_name,
                                            resource_id,
                                            start,
                                            end)

            for data in measures:
                data[2] = "{0:.2f}".format(data[2])

        return measures

    def find_resource_id(self, request, metric_name, hostname):
        resource_ids = []
        if 'hardware.network' in metric_name:
            # NOT(ecelik): This seems slow when there are a lot of network
            # interface, we can limit resources with configuration
            resources = gnocchi.get_resources(request,
                                              'host_network_interface')
            for res in resources:
                if res['host_name'] == 'snmp://' + hostname:
                    if hasattr(settings, 'MONITORING_INTERFACES'):
                        for interface in settings.MONITORING_INTERFACES:
                            if interface in res['original_resource_id']:
                                resource_ids.append(
                                    {'id': res['id'],
                                     'original_id': res['original_resource_id']})
                    else:
                        resource_ids.append(
                            {'id': res['id'],
                             'original_id': res['original_resource_id']})
        elif metric_name == 'hardware.disk.util':
            resources = gnocchi.get_resources(request,
                                              'host_disk')
            for res in resources:
                if res['host_name'] == 'snmp://' + hostname:
                    resource_ids.append({
                        'id': res['id'],
                        'original_id': res['original_resource_id']})
        else:
            resources = gnocchi.get_resources(request,
                                              'host')
            for res in resources:
                if res['host_name'] == 'snmp://' + hostname:
                    resource_ids.append(
                        {'id': res['id'],
                         'original_id': res['original_resource_id']})
        return resource_ids
