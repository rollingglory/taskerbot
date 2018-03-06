var express = require('express');
var router = express.Router();
var packageInfo = require('../package.json');

router.get('/', function (req, res) {
	res.send({ version: packageInfo.version });
});

router.get('/testapi', function (req, res) {
	res.render('testapi', { version: packageInfo.version });
});

module.exports = router;