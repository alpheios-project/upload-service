const fs = require('node:fs');

const dicts = {
  ml: { datFile: 'grc-ml-ids.dat', 
        url: 'https://repos1.alpheios.net/exist/rest/db/xq/lexi-get.xq?lx=ml&lg=grc&out=html&n='
      }
}

const parseDatFile = (rawDatFile) => {
  const vocLines = rawDatFile.split('\n')
  return vocLines.map((line => line.split('|')[1]))
}

const readDatFile = (datFile) => {
  try {
    const result = fs.readFileSync(datFile, 'utf8')
    return result
  } catch(err) {
    console.error(err);
  }
}

const httpGet = (url) => {
    return new Promise((resolve, reject) => {
      const http = require('http'),
        https = require('https');
  
      let client = http;
  
      if (url.toString().indexOf("https") === 0) {
        client = https;
      }
  
      client.get(url, (resp) => {
        let chunks = [];
  
        resp.on('data', (chunk) => {
          chunks.push(chunk);
        });
  
        resp.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
  
      }).on("error", (err) => {
        reject(err);
      });
    });
  }

const saveToFile = async (data, filename) => {
  try {
    fs.writeFileSync(filename, data, 'utf8');
    console.log('Written - ', filename)
  } catch (err) {
    console.error(err);
  }
}

const uploadFromRemote = async (index, url) => {
  const wordUrl = `${url}${index}`
  return httpGet(wordUrl)
}

const doUpload = async (vocName) => {
  const dictData = dicts[vocName]

  const rawDatFile = readDatFile(dictData.datFile)
  const vocIndexes = parseDatFile(rawDatFile)

  let i = 0
  for (let index of vocIndexes) {
    const fileName = `ml-xml\\${index.trim()}.xml`

    if (fs.existsSync(fileName)) {
      console.log('exists - ', fileName)
      continue
    }

    const buf = await uploadFromRemote(index, dictData.url)
    saveToFile(buf.toString('utf-8'), fileName)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    // if (i===5) break
    i++
  }
}

doUpload('ml')