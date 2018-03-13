const express = require('express');

const router = express.Router();
const packageInfo = require('../package.json');

router.get('/', (req, res) => {
  res.send({ version: packageInfo.version });
});

router.get('/testapi', (req, res) => {
  res.render('testapi', { version: packageInfo.version });
});

module.exports = router;
