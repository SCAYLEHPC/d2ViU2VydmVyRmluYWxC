const https = require('https');
const fs0 = require('fs');
const fs = require('fs').promises;
const request = require('request');
const blockchainApp = require(process.env.BLOCKCHAIN_APP);

const options = {
  key: fs0.readFileSync('key.pem'),
  cert: fs0.readFileSync('cert.pem')
};

const host = process.env.SERVER_IP_ADDR;
const port = process.env.SERVER_PORT;

const requestListener = function (req, res){
  
  if(req.method === "GET") {
  	switch (req.url) {
	    case "/ficheros":
	      fs.readFile(__dirname + "/html/encrypt-decrypt.html").then(contents => {
		res.setHeader("Content-Type","text/html");
		res.writeHead(200);
		res.end(contents);
	      })
	      .catch(err => {
		res.writeHead(500);
		res.end(err);
		return;
	      });
	      break
	      
	    case "/js/encrypt-decrypt.js":
	      fs.readFile(__dirname + "/js/encrypt-decrypt.js").then(contents => {
		res.setHeader("Content-Type","text/js");
		res.writeHead(200);
		res.end(contents);
	      })
	      .catch(err => {
		res.writeHead(500);
		res.end(err);
		return;
	      });
	      break
	      
	    default:
	      res.writeHead(404);
	      res.end();
	      break;
	}
  }
  else if(req.method === "POST") {
  	switch (req.url) {
  	
	    case "/post1":
	      let datos = [];
	      req.on('data', async function(chunk) {
	      
	      	var filePath = 'fileRequest/' + req.headers['headerfilename'];
	      	
	      	//Save file to server
	      	fs0.createWriteStream(filePath).write(chunk);
	      	
	      	
	      	setTimeout(postToRep, 2000, filePath, req.headers['headerfilename']);
	      	
	      });
	      
	      
	      res.writeHead(200);
	      res.end();
	      break;
	    
	    case "/post2":
	      req.on('data', function(chunk) {
	      	
	      	var JSONdata = JSON.parse(chunk);
	      	postToBlockchain(JSONdata);
	      	
	      });
	      
	      res.writeHead(200);
	      res.end();
	      break;  
	}
  }
  
};

const server = https.createServer(options, requestListener);
server.listen(port, host, () => {
  console.log('Server is running on https: '+host+':'+port);
  blockchainApp.App.init();
});


async function postToRep(file, fileName) {
	
	const repURL = await getAlfData();
	
	var r = request.post(repURL, function callback(err, httpResponse, body) {
	    if(err || JSON.parse(body).error) {
		return console.log('Upload failed: '+body)
	    }
		console.log('Upload success')
	    })

	var form = r.form()
	form.append("name", fileName)
	form.append("nodeType", "cm:content")
	form.append("relativePath", "Sites/test-site")
	form.append("filedata",fs0.createReadStream(file))
}

async function getAlfData() {
	var complete_url = '';
	var alf_url = process.env.REP_URL;
	var alf_tck = '';
	
	alf_tck = await doRequest();
	  
	complete_url += alf_url;
	complete_url += alf_tck;
	

	return complete_url;
}

function doRequest() {
	return new Promise(function (resolve, reject) {
		const options = {
		  url: process.env.REP_TCK_URL,
		  json: true,
		  body: {
		    "userId":process.env.REP_TCK_US,
		    "password":process.env.REP_TCK_PW
		  }
		};
		
		
		request.post(options, (err, res, body) => {
		  if (err) {
		    reject(err);
		  }
		  
		  resolve(body.entry.id);
		});
	});
}

function postToBlockchain(jsonObject){
  blockchainApp.App.registrarInvestigacion(jsonObject);
}
