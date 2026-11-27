const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', true);

const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.UPLOAD_PASSWORD || 'changeme';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOAD_DIR); },
  filename: function (req, file, cb) {
    var orig = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, path.basename(orig));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 200 * 1024 * 1024 } });

function shell(body) {
  return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1"><title>dicercheck</title>'
    + '<style>*{box-sizing:border-box}body{font-family:system-ui,Arial;background:#0f172a;color:#e2e8f0;'
    + 'display:flex;min-height:100vh;margin:0;align-items:center;justify-content:center;padding:16px}'
    + '.card{background:#1e293b;padding:28px;border-radius:16px;width:min(94vw,440px);box-shadow:0 10px 30px rgba(0,0,0,.4)}'
    + 'h1{margin:0 0 18px;font-size:22px}input{width:100%;padding:13px;margin:8px 0;border-radius:10px;'
    + 'border:1px solid #334155;background:#0f172a;color:#e2e8f0;font-size:15px}'
    + 'button{width:100%;padding:13px;border:0;border-radius:10px;background:#3b82f6;color:#fff;font-size:16px;cursor:pointer}'
    + 'button:disabled{opacity:.6}a{color:#60a5fa;word-break:break-all}'
    + '.out{background:#0f172a;padding:14px;border-radius:10px;margin-top:14px;display:none}'
    + '.copy{margin-top:10px;background:#334155}</style></head><body><div class="card">' + body + '</div></body></html>';
}

app.get('/', function (req, res) {
  res.send(shell(
    '<h1>\u0631\u0641\u0639 \u0645\u0644\u0641</h1>'
    + '<input id="pw" type="password" placeholder="\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0627\u0644\u0631\u0641\u0639">'
    + '<input id="file" type="file">'
    + '<button id="btn">\u0631\u0641\u0639</button>'
    + '<div class="out" id="out"></div>'
    + '<script>'
    + 'var btn=document.getElementById("btn");'
    + 'btn.onclick=async function(){'
    + ' var f=document.getElementById("file").files[0];'
    + ' var pw=document.getElementById("pw").value;'
    + ' if(!f){alert("\u0627\u062e\u062a\u0631 \u0645\u0644\u0641");return;}'
    + ' btn.disabled=true;btn.textContent="\u062c\u0627\u0631\u064a \u0627\u0644\u0631\u0641\u0639...";'
    + ' var fd=new FormData();fd.append("password",pw);fd.append("file",f);'
    + ' try{'
    + '  var r=await fetch("/upload",{method:"POST",body:fd});'
    + '  var j=await r.json();'
    + '  if(!r.ok){alert(j.error||"\u0641\u0634\u0644 \u0627\u0644\u0631\u0641\u0639");}'
    + '  else{var o=document.getElementById("out");o.style.display="block";'
    + '   o.innerHTML="\u0627\u0644\u0631\u0627\u0628\u0637:<br><a href=\\""+j.link+"\\">"+j.link+"</a>'
    + '<button class=\\"copy\\" onclick=\\"navigator.clipboard.writeText(\'"+j.link+"\')\\">\u0646\u0633\u062e \u0627\u0644\u0631\u0627\u0628\u0637</button>";}'
    + ' }catch(e){alert("\u062e\u0637\u0623 \u0628\u0627\u0644\u0627\u062a\u0635\u0627\u0644");}'
    + ' btn.disabled=false;btn.textContent="\u0631\u0641\u0639";'
    + '};'
    + '</script>'
  ));
});

app.post('/upload', upload.single('file'), function (req, res) {
  if ((req.body.password || '') !== PASSWORD) {
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
    return res.status(403).json({ error: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u062e\u0627\u0637\u0626\u0629' });
  }
  if (!req.file) return res.status(400).json({ error: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0644\u0641' });
  var name = req.file.filename;
  var proto = req.headers['x-forwarded-proto'] || req.protocol;
  res.json({ link: proto + '://' + req.get('host') + '/' + encodeURIComponent(name) });
});

app.get('/f/:name', function (req, res) {
  var name = path.basename(req.params.name);
  var fp = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(fp)) return res.status(404).send('Not found');
  res.download(fp, name);
});

app.get('/:name', function (req, res) {
  var name = path.basename(req.params.name);
  var fp = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(fp)) return res.status(404).send(shell('<h1>\u0627\u0644\u0645\u0644\u0641 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f</h1>'));
  res.send('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>dicercheck</title></head><body><script>'
    + 'var a=document.createElement("a");a.href="/f/' + encodeURIComponent(name) + '";a.download=' + JSON.stringify(name) + ';'
    + 'document.body.appendChild(a);a.click();'
    + 'setTimeout(function(){window.open("","_self");window.close();},1500);'
    + '</script></body></html>');
});

app.listen(PORT, function () { console.log('listening on ' + PORT); });
