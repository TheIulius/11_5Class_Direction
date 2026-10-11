import { spawn } from 'child_process';
import fs from 'fs';

const user = {
  id: 'user_1790353103544',
  username: 'theiulius',
  token: 'fb3f396723bcf232eed47d9eab23896f4c78c4630b5a0d910180a4eba8ec91ea',
  managerName: 'Ilia',
  teamName: "giorgievski's tractati",
  grade: '11',
  parallel: '5',
  realName: 'Ilia Shinjiashvili',
  showRealNamePublicly: true,
  role: 'admin',
  isAdmin: true
};

async function main() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=390,844'
  ]);

  await new Promise(r => setTimeout(r, 1800));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    // Navigate to localhost
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await new Promise(r => setTimeout(r, 1200));

    // Set localStorage
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('fpl_auth_token_v1', ${JSON.stringify(user.token)});
        localStorage.setItem('fpl_auth_user_v1', JSON.stringify(${JSON.stringify(user)}));
        localStorage.setItem('fpl_active_manager_id_v1', ${JSON.stringify(user.id)});
        localStorage.setItem('kcl_seen_update_' + ${JSON.stringify(user.id)}, 'update_2026_10_10_gw1_ended_gw2_open');
        localStorage.setItem('fpl_theme', 'dark');
      `
    });

    // Reload page to pick up auth
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await new Promise(r => setTimeout(r, 2000));

    if (process.argv[3] === 'expand') {
      await send('Runtime.evaluate', {
        expression: `
          const handles = Array.from(document.querySelectorAll('div')).filter(d => d.style.touchAction === 'none' || d.textContent.includes('SUBSTITUTES'));
          if (handles[0]) handles[0].click();
        `
      });
      await new Promise(r => setTimeout(r, 800));
    }

    // Capture screenshot
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outFile = process.argv[2] || 'screenshot-current.png';
    fs.writeFileSync(outFile, buffer);
    console.log(`Saved screenshot to ${outFile}`);

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
