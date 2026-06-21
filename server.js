import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Static file serving
// Serve editor at http://localhost:5050/editor_home/
app.use('/editor_home', express.static(path.join(__dirname, 'editor_home')));
// Serve viewer at http://localhost:5050/
app.use(express.static(__dirname));

// Utility to run command line tools
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command failed: ${command}\nError: ${error.message}`);
        reject({ error: error.message, stderr, stdout });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

// 1. Get PhoneBook data
app.get('/api/phonebook', (req, res) => {
  const filePath = path.join(__dirname, 'PhoneBook.json');
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'PhoneBook.json not found.' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Save PhoneBook data
app.post('/api/phonebook', (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ success: false, error: 'Data is required.' });
  }

  const rootPath = path.join(__dirname, 'PhoneBook.json');
  const webHomeDir = path.join(__dirname, 'web_home');
  const webHomePath = path.join(webHomeDir, 'PhoneBook.json');

  try {
    const jsonString = JSON.stringify(data, null, 4);

    // Save to root
    fs.writeFileSync(rootPath, jsonString, 'utf-8');

    // Ensure web_home directory exists and save there as well
    if (!fs.existsSync(webHomeDir)) {
      fs.mkdirSync(webHomeDir, { recursive: true });
    }
    fs.writeFileSync(webHomePath, jsonString, 'utf-8');

    res.json({ success: true, message: 'PhoneBook.json saved successfully in root and web_home.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Git Commit and Deploy (Push) using gh API
app.post('/api/deploy', (req, res) => {
  const { commitMessage } = req.body;
  const message = commitMessage || 'feat: update phonebook data';
  
  const filePath = path.join(__dirname, 'PhoneBook.json');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'PhoneBook.json not found.' });
  }

  const owner = 'bcleemd';
  const repo = 'kcch-phonebook';
  const githubPath = 'PhoneBook.json';

  console.log('Retrieving file SHA from GitHub contents...');
  // 1. Get existing file SHA from GitHub (required for PUT updates)
  exec(`gh api repos/${owner}/${repo}/contents/${githubPath}`, (err, stdout, stderr) => {
    let sha = '';
    if (!err) {
      try {
        const fileInfo = JSON.parse(stdout);
        sha = fileInfo.sha;
      } catch (e) {
        // File might not exist yet, sha remains empty
      }
    }

    // 2. Read local file and encode to base64
    const content = fs.readFileSync(filePath, 'base64');

    // 3. Update file via gh api PUT
    let ghCmd = `gh api --method PUT repos/${owner}/${repo}/contents/${githubPath} \
      -f message="${message.replace(/"/g, '\\"')}" \
      -f content="${content}"`;
    if (sha) {
      ghCmd += ` -f sha="${sha}"`;
    }

    console.log(`Executing: Deploying PhoneBook.json to GitHub using gh api`);
    exec(ghCmd, (putErr, putStdout, putStderr) => {
      if (putErr) {
        console.error(`GitHub deploy error: ${putErr.message}`);
        return res.status(500).json({ success: false, error: putErr.message, stderr: putStderr });
      }
      res.json({ success: true, message: 'Successfully deployed changes to GitHub using gh api.', details: putStdout });
    });
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`KCCH PhoneBook local server running at http://127.0.0.1:${PORT}`);
  console.log(`Editor URL: http://127.0.0.1:${PORT}/editor_home/`);
});
