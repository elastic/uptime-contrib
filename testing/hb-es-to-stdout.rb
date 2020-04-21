#!/usr/bin/env ruby

require 'yaml'


class Transformer
  def self.run(config_path, ops_sequence)
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
      self.send(op)
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

  def save()
    yaml = @config.to_yaml
    File.open(@config_path, "w") do |f|
      f.write(yaml)
    end
  end
end


Transformer.run(ARGV[0], ARGV[1])
