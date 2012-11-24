sudo yum -y groupinstall 'Development Tools'

#node
wget https://github.com/joyent/node/archive/master.zip -O nodejs.zip
unzip nodejs.zip
cd node-master
./configure
make
sudo make install

#redis
cd
wget http://redis.googlecode.com/files/redis-2.6.5.tar.gz
tar -xvzf redis-2.6.5.tar.gz
cd redis-2.6.5
make
sudo bash
mkdir /etc/redis /var/lib/redis
cp /meltee/server_scripts/redis.conf /etc/redis/redis.conf
cp /meltee/server_scripts/redis-server /etc/init.d
cp src/redis-server src/redis-cli /usr/local/bin
chmod 755 /etc/init.d/redis-server
chkconfig --add redis-server
chkconfig --level 345 redis-server on
sysctl vm.overcommit_memory=1
printf "\nvm.overcommit_memory = 1\n" >> /etc/sysctl.conf
service redis-server start

#mongodb
printf "[10gen]\nname=10gen Repository\nbaseurl=http://downloads.mongodb.org/distros/centos/5.4/os/x86_64/\ngpgcheck=0" > /etc/yum.repos.d/10gen.repo

yum -y install mongo-stable mongo-stable-server
/etc/init.d/mongod start
/usr/local/bin/npm install -g forever
exit

cd /meltee
npm install

forever start server