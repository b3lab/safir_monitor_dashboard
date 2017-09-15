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

from aodhclient.v2 import client as aodh_client
from django.conf import settings  # noqa

from keystoneauth1 import loading
from keystoneauth1 import session


LOG = logging.getLogger(__name__)


def aodhclient(request):
    """ Initialization of Gnocchi client.
    """
    auth_endpoint = getattr(settings, 'OPENSTACK_KEYSTONE_URL', None)

    loader = loading.get_plugin_loader('token')
    auth = loader.load_from_options(auth_url=auth_endpoint,
                                    token=request.user.token.id,
                                    project_id=request.user.project_id)
    sess = session.Session(auth=auth)

    LOG.debug('aodhclient connection created using token "%s" '
              'and endpoint "%s"' % (request.user.token.id, auth_endpoint))

    return aodh_client.Client(session=sess)


def alarm_list(request):
    alarms = aodhclient(request).alarm.list()
    return alarms


def create_alarm(request, alarm):
    return aodhclient(request).alarm.create(alarm)


def delete_alarm(request, alarm_id):
    return aodhclient(request).alarm.delete(alarm_id)
