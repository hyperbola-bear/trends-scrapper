const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

//const PCR = require("puppeteer-chromium-resolver");

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const baseURL = `https://trends.google.com`;
const countryCode = "SG";
const { executablePath } = require("puppeteer");

app.get("/trends", async (req, res) => {
  //const stats = await PCR();

  //process.env.PUPPETEER_EXECUTABLE_PATH = stats.executablePath;
  async function fillTrendsDataFromPage(page) {
    let count = 0;
    while (count < 5) {
      const isNextPage = await page.$(".feed-load-more-button");
      if (!isNextPage) break;
      await page.click(".feed-load-more-button");
      await page.waitForTimeout(2000);
      count++;
    }
    const dataFromPage = await page.evaluate((baseURL) => {
      return Array.from(document.querySelectorAll(".feed-list-wrapper")).map(
        (el) => ({
          date: el.querySelector(".content-header-title").textContent.trim(),
          data: Array.from(el.querySelector("feed-item")).map((el) => ({
            index: el.querySelector(".index")?.textContent.trim(),
            title: el.querySelector(".title a")?.textContent.trim(),
            //   titleLink: `${baseURL}${el
            //     .querySelector(".title a")
            //     ?.getAttribute("href")}`,
            //   subtitle: el.querySelector(".summary-text a")?.textContent.trim(),
            //   subtitleLink: el
            //     .querySelector(".summary-text a")
            //     ?.getAttribute("href"),
            //   source: el
            //     .querySelector(".source-and-time span:first-child")
            //     ?.textContent.trim(),
            //   published: el
            //     .querySelector(".source-and-time span:last-child")
            //     ?.textContent.trim(),
            searches: el
              .querySelector(".search-count-title")
              ?.textContent.trim(),
            //thumbnail: el.getAttribute("image-url"),
          })),
        })
      );
    }, baseURL);
    return dataFromPage;
  }

  async function getGoogleTrendsDailyResults() {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        //  "--disable-setuid-sandbox",
        //   "--window-size=1200,700",
      ],
      executablePath: executablePath(),
    });
    const page = await browser.newPage();
    //page.setViewport({ width: 1200, height: 700 });

    const URL = `${baseURL}/trends/trendingsearches/daily?geo=${countryCode}&hl=en`;

    await page.setDefaultNavigationTimeout(60000);
    await page.goto(URL);

    await page.waitForSelector(".feed-item");

    const dailyResults = await fillTrendsDataFromPage(page);

    await browser.close();

    return dailyResults;
  }
  getGoogleTrendsDailyResults().then((result) => res.json(result).status(200));
});

app.get("/", (req, res) => {
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Example app listening on PORT ${PORT}`);
});
