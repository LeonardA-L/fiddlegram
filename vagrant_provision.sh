#!/bin/bash

# Update
sudo apt-get update -y
sudo apt-get upgrade -y
# Install required packages
sudo apt-get install npm curl -y

sudo npm install -g npm
sudo ln -s /usr/bin/nodejs /usr/bin/node

# Install shells
sudo apt-get install php5-cli -y

cd /vagrant
npm install

# Docker
curl -fsSL https://get.docker.com/ | sh
sudo usermod -aG docker vagrant

