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
from monitor_dashboard.api import monasca
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils

import dateutil.parser

bps_to_mbps = 0.000001
network_bytes_max_value = 4294967295


@urls.register
class Metrics(generic.View):
    """ API for monasca metrics
    """
    url_regex = r'monasca/metrics/$'

    @rest_utils.ajax()
    def get(self, request):
        metrics = monasca.metric_list(request)
        return {'items': metrics}


@urls.register
class Measures(generic.View):
    """ API for monasca measures
    """
    url_regex = r'monasca/measures/' \
                r'(?P<metric_name>[^/]+)/' \
                r'(?P<instance_id>[^/]+)/' \
                r'(?P<project_id>[^/]+)/' \
                r'(?P<start>[^/]+)/' \
                r'(?P<end>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, metric_name, instance_id, project_id, start, end):
        measures = []
        measures.append(self.get_measures(request,
                                          metric_name,
                                          instance_id,
                                          start,
                                          end))

        return {'metric_name': metric_name,
                'project_id': project_id,
                'instance_id': instance_id,
                'measures': measures}


    def get_measures(self, request, metric_name, instance_id, start, end):
        measures = []
        dimensions = {'resource_id': instance_id}
        if metric_name == 'memory_util':
            # VM memory utilization calculation over allocated memory to the VM
            vm_mem_measurements = monasca.get_measures(request,
                                                       'vm.mem.free_perc',
                                                       dimensions,
                                                       start,
                                                       end)
            if vm_mem_measurements:
                for measurement in vm_mem_measurements[0]['measurements']:
                    operation for getting used mem perc, otherwise its free mem perc
                    measurement[1] = 100 - measurement[1]
                    measures.append(measurement)
        elif metric_name == 'disk_util':
            vm_disk_measurements = monasca.get_measures(request,
                                                        'disk.physical_total',
                                                        dimensions,
                                                        start,
                                                        end)
            if vm_disk_measurements:
                for measurement in vm_disk_measurements[0]['measurements']:
                    measures.append(measurement)
        elif metric_name == 'cpu_util':
            vm_cpu_measurements = monasca.get_measures(request,
                                                       'vm.cpu.utilization_norm_perc',
                                                       dimensions,
                                                       start,
                                                       end)
            if vm_cpu_measurements:
                for measurement in vm_cpu_measurements[0]['measurements']:
                    measures.append(measurement)
        elif metric_name == 'network.incoming.bytes.rate':
            vm_net_in_measurements = monasca.get_measures(request,
                                                          'vm.net.in_bytes_sec',
                                                          dimensions,
                                                          start,
                                                          end)
            if vm_net_in_measurements:
                for measurement in vm_net_in_measurements[0]['measurements']:
                    measures.append(measurement)
        elif metric_name == 'network.outgoing.bytes.rate':
            vm_net_out_measurements = monasca.get_measures(request,
                                                           'vm.net.out_bytes_sec',
                                                           dimensions,
                                                           start,
                                                           end)
            if vm_net_out_measurements:
                for measurement in vm_net_out_measurements[0]['measurements']:
                    measures.append(measurement)

        return measures


@urls.register
class HardwareMeasures(generic.View):
    """ API for monasca measures
    """
    url_regex = r'monasca/hardware_measures/' \
                r'(?P<metric_name>[^/]+)/' \
                r'(?P<hostname>[^/]+)/' \
                r'(?P<start>[^/]+)/' \
                r'(?P<end>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, metric_name, hostname, start, end):
        measures = []
        measures.append(self.get_measures(request,
                                          metric_name,
                                          hostname,
                                          start,
                                          end))

        return {'metric_name': metric_name,
                'hostname': hostname,
                'measures': measures}

    def get_measures(self, request, metric_name, hostname, start, end):

        measures = []
        dimensions = {'hostname': hostname}

        if metric_name == 'hardware.memory.util':
            host_mem_measurements = monasca.get_measures(request,
                                                         'mem.usable_perc',
                                                         dimensions,
                                                         start,
                                                         end)
            if host_mem_measurements:
                for measurement in host_mem_measurements[0]['measurements']:
                    measures.append(measurement)

        elif metric_name == 'hardware.disk.util':
            host_disk_total_used_space_mb = monasca.get_measures(request,
                                                                 'disk.total_used_space_mb',
                                                                 dimensions,
                                                                 start,
                                                                 end)
            host_disk_total_space_mb = monasca.get_measures(request,
                                                            'disk.total_space_mb',
                                                            dimensions,
                                                            start,
                                                            end)
            measurements_len = len(host_disk_total_space_mb)
            if host_disk_total_used_space_mb and host_disk_total_space_mb:
                for i in range(measurements_len):
                    host_disk_total_used_space_perc = (host_disk_total_used_space_mb[0]['measurements'][i][1] /
                                                       host_disk_total_space_mb[0]['measurements'][i][1]) * 100
                    host_disk_total_used_space_mb[0]['measurements'][i][1] = host_disk_total_used_space_perc
                    measures.append(host_disk_total_used_space_mb[0]['measurements'][i])

        elif metric_name == 'hardware.network.incoming.bytes.rate':
            dimensions = {"hostname": hostname, "device": "br-ext"}
            host_net_in_bytes_sec = monasca.get_measures(request,
                                                         'net.in_bytes_sec',
                                                         dimensions,
                                                         start,
                                                         end)
            if host_net_in_bytes_sec:
                for measurement in host_net_in_bytes_sec[0]['measurements']:
                    measures.append(measurement)

        elif metric_name == 'hardware.network.outgoing.bytes.rate':
            dimensions = {"hostname": hostname, "device": "br-ext"}
            host_net_out_bytes_sec = monasca.get_measures(request,
                                                          'net.out_bytes_sec',
                                                          dimensions,
                                                          start,
                                                          end)
            if host_net_out_bytes_sec:
                for measurement in host_net_out_bytes_sec[0]['measurements']:
                    measures.append(measurement)

        elif metric_name == 'hardware.cpu.util':
            host_cpu_measurements = monasca.get_measures(request,
                                                         'cpu.percent',
                                                         dimensions,
                                                         start,
                                                         end)
            if host_cpu_measurements:
                for measurement in host_cpu_measurements[0]['measurements']:
                    measures.append(measurement)

        return measures

