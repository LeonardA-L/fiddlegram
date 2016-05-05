#!/bin/bash

# Update
sudo apt-get update -y
sudo apt-get upgrade -y
# Install required packages
sudo apt-get install npm curl -y

sudo npm install -g node npm

sudo rm -f /usr/bin/node
sudo ln -s /usr/bin/nodejs /usr/bin/node

# Dependencies
npm install # This is where you get problems with pty.js, good luck

# Docker
curl -fsSL https://get.docker.com/ | sh
sudo usermod -aG docker $USER

# You have to logout and log back in as of now for the docker changes to take effet. Sorry :/

cd dockerImages/phpImage/
docker build -t dphp .
cd ../../
cd dockerImages/pythonImage/
docker build -t dpython .
cd ../../
cd dockerImages/python3Image/
docker build -t dpython3 .
cd ../../
cd dockerImages/erlangImage/
docker build -t derlang .
cd ../../
cd dockerImages/javascriptImage/
docker build -t djs .
cd ../../
cd dockerImages/rubyImage/
docker build -t druby .
cd ../../
