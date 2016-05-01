#!/bin/bash

# Update
sudo apt-get update -y
sudo apt-get upgrade -y
# Install required packages
sudo apt-get install npm curl -y

sudo npm install -g node npm

sudo rm -f /usr/bin/node
sudo ln -s /usr/bin/nodejs /usr/bin/node

cd /vagrant
npm install --no-bin-links

# Docker
curl -fsSL https://get.docker.com/ | sh
sudo usermod -aG docker vagrant

cd dockerImages/phpImage/
docker build -t dphp .
cd dockerImages/pythonImage/
docker build -t dpython .
cd dockerImages/python3Image/
docker build -t dpython3 .

cd /vagrant