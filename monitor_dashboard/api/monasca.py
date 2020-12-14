# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

import logging

from monascaclient import client as monasca_client
from django.conf import settings  # noqa

from keystoneauth1 import loading
from keystoneauth1 import session

LOG = logging.getLogger(__name__)

def monascaclient(request):
    """ Initialization of Monasca client.
    """
    auth_endpoint = getattr(settings, 'OPENSTACK_KEYSTONE_URL', None)
    monasca_endpoint = getattr(settings, 'OPENSTACK_MONASCA_URL', None)

    loader = loading.get_plugin_loader('token')
    auth = loader.load_from_options(auth_url=auth_endpoint,
                                    token=request.user.token.id,
                                    project_id=request.user.project_id)
    sess = session.Session(auth=auth)

    LOG.debug('monascaclient connection created using token "%s" '
              'and endpoint "%s"' % (request.user.token.id, auth_endpoint))

    return monasca_client.Client(api_version='2_0', endpoint=monasca_endpoint, session=sess)

def metric_list(request):
    metrics = monascaclient(request).metric.list()
    return metrics

def get_resources(request):
    resources = monascaclient(request).metrics.list_dimension_values(
        dimension_name='resource_id')
    return resources

def get_measures(request, metric_name, dimensions, start=None, end=None):
    measures = monascaclient(request).metrics.list_measurements(
                name=metric_name,
                dimensions=dimensions,
                start_time=start,
                end_time=end)
    return measures

