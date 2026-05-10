'use strict';

process.env.CONFIG_FILE = 'settings-server2.json';
process.env.PORT = process.env.PORT || '8080';

require('./index.js');