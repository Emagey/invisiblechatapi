const express = require('express');
const Steggo = require("stegcloak");
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();

const steggo = new Steggo(true);
const UrlRegex = new RegExp(
  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/, "ig"
);

app.use(function(req, res, next) {
  res.setHeader('charset', 'utf-8')
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use("/", router);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/keepalive', (req, res) => {
  res.send("Alive");
});

app.post('/', (req, res) => {
  var type = req.body.type;
  var password = req.body.password;
  var secret = req.body.secret;
  var cover = req.body.cover;

  try {
    // Encryption
    if (type == "hide") {
      if (!password || !secret || !cover) {
        return res.status(400).json({
          status: 'error',
          error: 'password, secret and cover must be filled'
        }).end()
      }


      var result = steggo.hide(`${secret}`, `${password}`, `${cover}`);
      return res.status(200).json({ response: `${result}`, isCorrectPassword: 'true' }).end()
    }
    // Decryption
    if (type == "reveal") {
      if (!password || !secret) {
        return res.status(400).json({
          status: 'error',
          error: 'password, secret and cover must be filled'
        }).end()
      }

      var result = secret.match(/^\W/) ?
        steggo.reveal(`d ${secret}d`, `${password}`) :
        steggo.reveal(`${secret}`, `${password}`);
      var foundUrls = "";
      var isCorrect = false;
      if (result.match(UrlRegex)) {
        foundUrls = result.match(UrlRegex)[0];
      }
      if (result.endsWith('')) {
        isCorrect = true;
        result = result.replace('', '')
      }
      return res.status(200).json({ response: `${result}`, url: `${foundUrls}`, isCorrectPassword: "true" }).end();
      // Others (Error)
    } else {
      return res.status(400).json({
        status: 'error',
        error: 'you need to specify a type'
      }).end();
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({ response: `${e}` }).end()
  }
})

app.listen(3000, async () => {
  console.log('server started');
});
