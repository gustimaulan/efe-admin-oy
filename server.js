const express = require('express');
const { chromium } = require('playwright-core');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));

const BASE_URL = 'https://orderyuk.net/dashboard/';
const PAGE_IDS = [121277, 122610];

const getBrowser = async () => {
  try {
    console.log('Launching browser...');
    return await chromium.launch({ headless: true });
  } catch (error) {
    console.error('Browser launch error:', error.message);
    throw error;
  }
};

const login = async (page) => {
  console.log('Logging in...');
  await page.goto(BASE_URL);
  await page.fill('#edd_user_login', 'efeindonesia');
  await page.fill('#edd_user_pass', 'Efeindonesia2020');
  await page.click('.edd-login-submit');
  await page.waitForSelector('.orderyuk-list');
  console.log('Logged in successfully');
};

const processPage = async (page, pageId, values) => {
  const url = `${BASE_URL}?orderyuk_action=edit&orderyuk_id=${pageId}`;
  console.log(`Processing page ${pageId}...`);
  await page.goto(url);
  
  for (let i = 0; i < values.length; i++) {
    await page.fill(
      `#acf-field_5c70a04d95d75-row-${i}-field_5d3544623a28e`,
      values[i].toString()
    );
  }
  
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle');
  console.log(`Completed page ${pageId}`);
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/run', async (req, res) => {
  let browser;
  try {
    const values = req.body.values.map(val => Number(val) || 0);
    browser = await getBrowser();
    const page = await browser.newPage();
    
    await login(page);
    for (const pageId of PAGE_IDS) {
      await processPage(page, pageId, values);
    }

    res.send(`
      <h1>Done!</h1>
      <ul>${values.map(val => `<li>${val}</li>`).join('')}</ul>
      <a href="/">Back</a>
    `);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send(`Error: ${error.message} <br><a href="/">Back</a>`);
  } finally {
    console.log('Closing browser...');
    if (browser) await browser.close();
  }
});

const PORT = 3030;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));