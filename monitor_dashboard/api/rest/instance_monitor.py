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

"""monitor API over neutron
"""

from django.views import generic
from openstack_dashboard.api import nova
from openstack_dashboard.api.rest import urls
from openstack_dashboard.api.rest import utils as rest_utils

import uuid


def hashCode(str):
    """ Generate integer hash from the given string

    :param str: Input string
    :return: Integer hash
    """
    hash = 0
    i = 0
    while i < len(str):
        hash = ord(str[i]) + ((hash << 5) - hash)
        i += 1
    return hash


def intToRGB(i):
    """ Convert integer value to RGB color

    :param i: Input integer value
    :return: RGB Color
    """
    c = str(i & 0xFFFFFF).upper()
    if len(c) < 6:
        c = "00000"[0: 6 - len(c)] + c
    else:
        c = c[0: 6]
    return '#' + c


@urls.register
class InstanceMonitor(generic.View):
    """ API for instance list with current telemetry data
    """
    url_regex = r'instancemonitor/instances/' \
                r'(?P<project_id>[^/]+)/' \
                r'(?P<all_tenants>[^/]+)/$'

    @rest_utils.ajax()
    def get(self, request, project_id, all_tenants):
        """Get instance list with current telemetry data

        Example GET:
        http://localhost/api/ceilometer/instancemonitor
        """
        try:
            all_tenants = int(all_tenants)
        except:
            all_tenants = 0
        if project_id == '-1':
            servers = nova.server_list(request,
                                       all_tenants=all_tenants)[0]
        else:
            servers = nova.server_list(request,
                                       search_opts={'project_id': project_id},
                                       all_tenants=all_tenants)[0]

        items = []
        for s in servers:
            server = s.to_dict()

            server['tenant_name'] = ""
            server['instanceUsageState'] = ""
            server['cpuUsage'] = []
            server['ramUsage'] = []
            server['diskUsage'] = []
            server['incomingNetworkUsage'] = []
            server['outgoingNetworkUsage'] = []
            server['selected'] = True
            server['color'] = intToRGB(hashCode(server['id']))
            server['host'] = server['OS-EXT-SRV-ATTR:host']
            server['zone'] = server['OS-EXT-AZ:availability_zone']
            server['full_flavor'] = nova.flavor_get(
                request, server['flavor']['id']).to_dict()
            server['highestUsagePeriod'] = ""

            items.append(server)

        return {'items': items}

    @staticmethod
    def hashCode(str):
        """ Generate integer hash from the given string

        :param str: Input string
        :return: Integer hash
        """
        hash = 0
        i = 0
        while i < len(str):
            hash = ord(str[i]) + ((hash << 5) - hash)
            i += 1
        return hash

    @staticmethod
    def intToRGB(i):
        """ Convert integer value to RGB color

        :param i: Input integer value
        :return: RGB Color
        """
        c = str(i & 0xFFFFFF).upper()
        if len(c) < 6:
            c = "00000"[0: 6 - len(c)] + c
        else:
            c = c[0: 6]
        return '#' + c


@urls.register
class ListHosts(generic.View):
    """ API for listing hosts
    """
    url_regex = r'instancemonitor/hostlist/$'

    @rest_utils.ajax()
    def get(self, request):
        """get host list"""
        hypervisors = nova.hypervisor_list(request)
        items = []
        for h in hypervisors:
            hypervisor = h.to_dict()
            hypervisor['cpuUsage'] = []
            hypervisor['ramUsage'] = []
            hypervisor['diskUsage'] = []
            hypervisor['incomingNetworkUsage'] = []
            hypervisor['outgoingNetworkUsage'] = []
            hypervisor['selected'] = True
            # TODO(ecelik): Hosts do not have a uuid so I used
            # python uuid method to generate one,
            # this can be removed if we get hosts' uuid
            hypervisor['color'] = intToRGB(hashCode(str(uuid.uuid4())))
            items.append(hypervisor)
        return {'items': items}
