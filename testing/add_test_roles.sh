#!/bin/bash

curl -sk -o /dev/null/ -X PUT "https://elastic:changeme@localhost:9200/_security/user/kibana_user?pretty" -H 'Content-Type: application/json' -d'
{
  "password" : "changeme",
  "roles" : [ "kibana" ],
  "full_name" : "Jack Nicholson",
  "email" : "jacknich@example.com"
}
'

curl -sk -o /dev/null/ -X PUT "https://elastic:changeme@localhost:9200/_security/role/uptime_read?pretty" -H 'Content-Type: application/json' -d'
{
  "indices": [
    {
      "names": [ "heartbeat-*"],
      "privileges": ["read"]
    }
  ],
  "applications": [
    {
      "application": "uptime",
      "privileges": [ "read" ],
      "resources": [ "*" ]
    }
  ],
  "run_as": [ "other_user" ], // optional
  "metadata" : { // optional
    "version" : 1
  }
}
'

curl -sk -o /dev/null/ -X PUT "https://elastic:changeme@localhost:9200/_security/user/uptime_read?pretty" -H 'Content-Type: application/json' -d'
{
  "password" : "changeme",
  "roles" : [ "uptime_read" ],
  "full_name" : "Jack Nicholson",
  "email" : "jacknich@example.com"
}
'

curl -sk -o /dev/null/ -X PUT "https://elastic:changeme@localhost:9200/_security/role/uptime_all?pretty" -H 'Content-Type: application/json' -d'
{
  "indices": [
    {
      "names": [ "heartbeat-*"],
      "privileges": ["read"]
    }
  ],
  "applications": [
    {
      "application": "uptime",
      "privileges": [ "all", "read" ],
      "resources": [ "*" ]
    }
  ],
  "run_as": [ "other_user" ], // optional
  "metadata" : { // optional
    "version" : 1
  }
}
'

curl -sk -o /dev/null/ -X PUT "https://elastic:changeme@localhost:9200/_security/user/uptime_all?pretty" -H 'Content-Type: application/json' -d'
{
  "password" : "changeme",
  "roles" : [ "uptime_all" ],
  "full_name" : "Jack Nicholson",
  "email" : "jacknich@example.com"
}
'


curl -sk -o /dev/null/ -X PUT "https://elastic:changeme@localhost:9200/_security/role/heartbeat?pretty" -H 'Content-Type: application/json' -d'
{
  "cluster": ["monitor", "manage_ilm"],
  "indices": [
    {
      "names": [ "heartbeat-*"],
      "privileges": ["manage", "create_doc", "view_index_metadata", "create_index"]
    }
  ],
  "applications": [
    {
      "application": "uptime",
      "privileges": [ "all", "read" ],
      "resources": [ "*" ]
    }
  ],
  "run_as": [ "other_user" ], // optional
  "metadata" : { // optional
    "version" : 1
  }
}
'

curl -sk -o /dev/null/ -X PUT "https://elastic:changeme@localhost:9200/_security/user/heartbeat?pretty" -H 'Content-Type: application/json' -d'
{
  "password" : "changeme",
  "roles" : [ "heartbeat", "ingest_admin" ],
  "full_name" : "Jack Nicholson",
  "email" : "jacknich@example.com"
}
'

echo '
#kibana config:
elasticsearch.username: "kibana"
elasticsearch.password: "changeme"
xpack.actions.enabled: true
xpack.alerting.enabled: true
xpack.task_manager.enabled: true
xpack.triggers_actions_ui.enabled: true
'


echo '
# heartbeat config
output.elasticsearch:
  hosts: ["localhost:9200"]
  protocol: https
  username: heartbeat
  password: changeme
  ssl:
    certificate_authorities: ${HOME}/projects/kibana/packages/kbn-dev-utils/certs/ca.crt
    certificate: ${HOME}/projects/kibana/packages/kbn-dev-utils/certs/elasticsearch.crt
    key: ${HOME}/projects/kibana/packages/kbn-dev-utils/certs/elasticsearch.key
'
