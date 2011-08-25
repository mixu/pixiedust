#!/bin/bash
cat ./lib/basicauth.js ./lib/client.jquery.js ./lib/search.js ./lib/collection.js | uglifyjs --no-copyright --output pixiedust.min.js
