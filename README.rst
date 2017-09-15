Safir Monitor Dashboard
=======================

Safir Monitor Dashboard is an Openstack Horizon plugin developed to visualize the collected utilization data
of the physical and virtual machines in the clouds. Safir Monitor Dashboard currently visualizes  CPU, RAM, disc,
incoming network and outgoing network utilization. Openstack Telemetry Service (Ceilometer) is used to collect the
data from the cloud. Safir Monitor Dashboard uses Gnocchi api to get the collected data as of release v2.0.

Installation
============
  
How To Use With Devstack
------------------------

.. sourcecode:: console  

    $ git clone http://github.com/openstack-dev/devstack -b stable/ocata
    $ cd devstack
    $ wget -O local.conf https://github.com/b3lab/safir_monitor_dashboard/blob/master/local.conf?raw=true

Configure local.conf with host IP and set an admin password

.. sourcecode:: console

    $ ./stack.sh

Then follow the Configuration steps
  
How To Use With Existing Openstack Installation
-----------------------------------------------

At least the following Openstack services are needed to use Safir Monitor Dashboard; Keystone, Nova, Glance, Neutron,
Ceilometer, Aodh and Horizon.  
  
* Clone Safir Monitor Dashboard from github and install it with pip  
  
.. sourcecode:: console  
  
    $ git clone https://github.com/b3lab/safir_monitor_dashboard.git  
    $ cd safir_monitor_dashboard  
    $ sudo pip install .
  
* Copy Safir Monitor Dashboard enabled files to Horizon's local enabled files directory  
  
.. sourcecode:: console  
  
    $ cp monitor_dashboard/enabled/_*  {HORIZON_DIR}/openstack_dashboard/local/enabled/

Then follow the Configuration steps

Configuration
=============

* Set the following configuration settings in {HORIZON_DIR}/openstack_dashboard/local/local_settings.py  
  
.. sourcecode:: cfg

    AODH_ALARM_ACTIONS = ['<ALARM-SERVICE-URL>']
    AODH_OK_ACTIONS = ['<ALARM-SERVICE-URL>']
  
* Collect Safir Monitor Dashboard static files on Horizon and restart Apache2 server  
  
.. sourcecode:: console

    $ python {HORIZON_DIR}/manage.py collectstatic  
    $ python {HORIZON_DIR}/manage.py compress  # if compress enabled  
    $ sudo service apache2 restart  
  
* Configure Nova service to monitor compute instances like the following example and restart the service  
  
.. sourcecode:: cfg

    notify_on_state_change = vm_and_task_state  
    instance_usage_audit_period = hour  
    instance_usage_audit = True  
    compute_monitors = nova.compute.monitors.cpu.virt_driver  
  
* Configure Ceilometer service to collect utilization data as shown in the 
  {SAFIR_MONITOR_DASHBOARD_DIR}/polling.yaml.example file

  
* Install SNMP server to compute nodes to monitor them.  


