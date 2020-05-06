#!/usr/bin/env ruby

require 'yaml'


class Transformer
  def self.run(config_path, ops_sequence)
    if !config_path || !ops_sequence
      puts "Usage: hb-alter.rb path/to/heartbeat.yml op1,op2"
      puts "Valid ops: to_console, to_es, to_secure_es, monitor_elastic_co"
      exit 1
    end

    t = self.new(config_path, ops_sequence)
    t.run()
    puts t.config.to_yaml
    t.save()
  end

  attr_reader :config

  def initialize(config_path, ops_sequence)
    @config_path = config_path
    File.open(@config_path) do |f|
      @config = YAML.load(f)
    end
    @ops_sequence = ops_sequence.split(",")
  end

  def run()
    @ops_sequence.each do |op|
      args = []
      if op =~ /\w+\(([^\)]+)\)/
        args = $1.split(",")
      end
      self.send(op, *args)
    end
  end

  def to_console
    @config.delete("output.elasticsearch")
    @config["output.console"] = nil
  end

  def to_es
    @config.delete("output.console")
    @config["output.elasticsearch"] = {
      "hosts" => "localhost:9200"
    }
  end

  def monitor_elastic_co
    @config["heartbeat.monitors"] = [{
      "type" => "http",
      "id" => "elastic-co",
      "name" => "Elastic.co",
      "urls" => [ "https://www.elastic.co" ],
      "schedule" => "@every 10s"
    }]
  end

  def ping_google
    @config["heartbeat.monitors"] = [{
      "type" => "icmp",
      "id" => "ping-google",
      "name" => "Google Ping",
      "hosts" => [ "google.com" ],
      "schedule" => "@every 10s"
    }]
  end

  def to_secure_es
    @config.delete("output.console")
    @config["output.elasticsearch"] = {
      "hosts" => ["localhost:9200"],
      "protocol" => "https",
      "username" =>  "heartbeat",
      "password" =>  "changeme",
      "ssl" => {
        "certificate_authorities" => "${HOME}/projects/kibana/packages/kbn-dev-utils/certs/ca.crt",
        "certificate" => "${HOME}/projects/kibana/packages/kbn-dev-utils/certs/elasticsearch.crt",
        "key" => "${HOME}/projects/kibana/packages/kbn-dev-utils/certs/elasticsearch.key"
      }
    }
  end


  def add_geo_mpls
    p = @config['processors'].find {|p| p.has_key?('add_observer_metadata')}
    if !p
      p = {}
      @config['processors'].push(p)
    end
    p.merge!({
      "add_observer_metadata" => {
        "geo" => {
          "name" => "minneapolis",
          "location" => "44.986656, -93.258133"
        }
      }
    })
  end

  def save()
    yaml = @config.to_yaml
    File.open(@config_path, "w") do |f|
      f.write(yaml)
    end
  end
end


Transformer.run(ARGV[0], ARGV[1])
