#!/usr/bin/env ruby

require 'yaml'
require 'fileutils'

class Transformer
  def self.run(config_path, ops_sequence)
    puts "Running on #{config_path} with ops #{ops_sequence}"
    if !config_path || !ops_sequence
      puts "Usage: hb-alter.rb op1,op2"
      puts "Valid ops: #{self.instance_methods - Object.instance_methods - [:save, :config]}"
      exit 1
    end

    t = self.new(config_path, ops_sequence)
    t.run()
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
      if op =~ /(\w+)\(([^\)]+)\)/
        op = $1
        args = $2.split(",")
      end
      print "Run: #{op}(#{args.join(', ')})..."
      puts "done\n"
      self.send(op, *args)
    end
  end

  def put_test_roles
    cmd = "/usr/bin/env sh #{File.dirname(__FILE__)}/add_test_roles.sh"
    puts "Running: #{cmd}"
    system(cmd)
  end

  def use_config(name)
    path = File.join(File.dirname(__FILE__), 'configs', name)
    FileUtils.cp(path, 'heartbeat.yml')
  end

  def to_console
    @config.delete("output.elasticsearch") rescue nil
    @config["output.console"] = nil
  end

  def to_es
    @config.delete("output.console") rescue nil
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
    @config.delete("output.console") rescue nil
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

  def print_yaml
    puts @config.to_yaml
  end

  def save()
    yaml = @config.to_yaml
    File.open(@config_path, "w") do |f|
      f.write(yaml)
    end
  end
end


Transformer.run('heartbeat.yml', ARGV[0])
