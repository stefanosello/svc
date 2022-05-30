#!/usr/bin/python3
import sys
import yaml
from yaml.loader import SafeLoader
import subprocess
import shlex
import requests
import os
from datetime import datetime

CONFIGURATION = {}

def print_header():
    print()
    print("   $$$$$$\  $$\    $$\  $$$$$$\      ")
    print("   $$  __$$\ $$ |   $$ |$$  __$$\    ")
    print("   $$ /  \__|$$ |   $$ |$$ /  \__|   ")
    print("   \$$$$$$\  \$$\  $$  |$$ |         ")
    print("    \____$$\  \$$\$$  / $$ |         ")
    print("   $$\   $$ |  \$$$  /  $$ |  $$\    ")
    print("   \$$$$$$  |   \$  /   \$$$$$$  |   ")
    print("    \______/     \_/     \______/    ")
    print()
    print("  SVC - Performance analysis tester  ")  
    print(" ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")                                              
    print()

def print_help():
    print("Usage: python bootstrap.py <configuration file> [TEST] [OPTIONS]")
    print("   TEST        one of test1, test2, ..., test12.")
    print("   OPTIONS     -h, --help for print this helper.")

def log(txt):
  print(f'> {txt}')

def read_yaml(config_file):
  with open(config_file) as f:
    data = yaml.load(f, Loader=SafeLoader)
    return data

def prepare_config(config_name, config_params):
  global CONFIGURATION

  log(f"Preparing configuration {config_name}...")

  ip = CONFIGURATION['tsung']['ip']
  interarrival = config_params['interarrival']
  max_jobs = config_params['max_jobs']
  
  # set ip
  with open('ip.txt', 'w+') as f:
    f.write(f'{ip}')

  # set interarrival
  with open('interarrival.txt', 'w+') as f:
    f.write(f'{interarrival}')

  # set max_jobs
  url = f'http://{ip}:8080/stats/update'
  params = { 
    'maxJobs': max_jobs, 
    'resetMaxJobs': 1 
  }
  r = requests.get(url, params = params)
  if r.status_code != 200:
    raise Exception("cannot update server stats")


def run_config(config_file, test):
  global CONFIGURATION
  
  CONFIGURATION = read_yaml(config_file)

  try:
    configuration = CONFIGURATION['tsung']['configs'][test]
  except Exception:
    print(f"Error: configuration '{test}' not found in configuration.yml")
    exit(1)
  
  prepare_config(test, configuration['params'])
  run_tsung()

def run_tsung():
  global CONFIGURATION
  
  config_file = CONFIGURATION['tsung']['config_file']
  log_dir = CONFIGURATION['tsung']['log_dir']

  now = datetime.now()
  dir_name = now.strftime("%Y%m%d-%H%M")
  
  log(f"Running Tsung...")
  cmd = f"tsung -f {config_file} -l {log_dir} start"
  process = subprocess.Popen(shlex.split(cmd))
  process.wait()
  
  log(f"Running Tsung-stats...")
  dir_path = os.path.join(log_dir, dir_name)
  os.chdir(f'./{dir_path}')
  cmd = "perl /opt/tsung-1.7.0/src/tsung_stats.pl"
  process = subprocess.Popen(shlex.split(cmd))
  process.wait()


if __name__=="__main__":
  print_header()

  if len(sys.argv) < 3:
    print_help()
    print("Error: no argument provided.")
    exit(1)
    
  config_file = sys.argv[1]
  if config_file in ("--help", "-h"):
    print_help()
    exit(0)

  test = sys.argv[2]

  run_config(config_file, test)
