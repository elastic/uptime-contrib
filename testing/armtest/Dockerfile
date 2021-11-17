FROM arm64v8/ubuntu

WORKDIR /go/src/app

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install --yes python3-appdirs python3-apt python3-attr python3-automat python3-blinker python3-certifi \
python3-cffi-backend \
python3-chardet \
python3-click \
python3-colorama \
python3-configobj \
python3-constantly \
python3-cryptography \
python3-dbus \
python3-debconf \
python3-debian \
python3-dev \
python3-distlib \
python3-distro-info \
python3-distro \
python3-distutils \
python3-entrypoints \
python3-filelock \
python3-gdbm \
python3-gi \
python3-greenlet \
python3-hamcrest \
python3-httplib2 \
python3-hyperlink \
python3-idna \
python3-importlib-metadata \
python3-incremental \
python3-jinja2 \
python3-json-pointer \
python3-jsonpatch \
python3-jsonschema \
python3-jwt \
python3-keyring \
python3-launchpadlib \
python3-lazr.restfulclient \
python3-lazr.uri \
python3-lib2to3 \
python3-markupsafe \
python3-minimal \
python3-more-itertools \
python3-msgpack \
python3-nacl \
python3-neovim \
python3-netifaces \
python3-newt \
python3-oauthlib \
python3-openssl \
python3-pexpect \
python3-pip \
python3-pkg-resources \
python3-ptyprocess \
python3-pyasn1-modules \
python3-pyasn1 \
python3-pymacaroons \
python3-pynvim \
python3-pyrsistent \
python3-requests-unixsocket \
python3-requests \
python3-secretstorage \
python3-serial \
python3-service-identity \
python3-setuptools \
python3-simplejson \
python3-six \
python3-software-properties \
python3-systemd \
python3-twisted-bin \
python3-twisted \
python3-urllib3 \
python3-venv \
python3-virtualenv \
python3-wadllib \
python3-wheel \
python3-yaml \
python3-zipp \
python3-dev

RUN apt-get install -y curl git-core libcap2-bin

ENV GOARTIFACT=go1.17.1.linux-arm64

RUN curl -L https://golang.org/dl/$GOARTIFACT.tar.gz -o $GOARTIFACT.tar.gz
RUN rm -rf /usr/local/go  && mkdir -p /usr/local/go
RUN tar -C /usr/local/ -xzf $GOARTIFACT.tar.gz
ENV GOPATH=/usr/local/go

RUN git clone https://github.com/magefile/mage 

ENV PATH=$PATH:/usr/local/go/bin/

#WORKDIR $HOME/mage
RUN cd mage && go run bootstrap.go

WORKDIR /beats
