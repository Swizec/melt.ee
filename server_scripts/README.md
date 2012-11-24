# Production server install script

### First, login to https://meltee.signin.aws.amazon.com/console and create new EC2 instance and download .pem
## **Important!** -> Do not forget to allow inbound traffic to port 80 inside "Security Groups" on EC2 instance

### At your home computer, do this:
```
chmod 400 {yourcertname.pem}
```
login to ec2 instance:
```
ssh -i {yourcertname.pem} ec2-user@{amazon-ec2-public-dns-addreess.com}
```

generate private and public keys for github
```
ssh-keygen -t rsa -N '' -f ~/.ssh/id_rsa
```

copy/paste this key to https://github.com/settings/ssh which you find in `.ssh/id_rsa.pub`

###Server

```
sudo bash
yum -y update
yum -y install git
mkdir /meltee
groupadd meltee
chgrp meltee /meltee
chmod g+w /meltee
usermod -a -G meltee ec2-user
newgrp meltee
printf "Host github.com\nStrictHostKeyChecking no\nUserKnownHostsFile=/dev/null\n" >> /etc/ssh/ssh_config
exit
cd /meltee
git clone git@github.com:golobm/Melt.ee.git .
cd server_scripts
./install.sh
```