// const express = require("express");

// const puppeteer = require("puppeteer");

// const app = express();

// const port = 3000;

// Selectors = {
//   name: ".summary-text",

//   price: ".search-count-title",
// };

// let productDetail = {
//   name: "",

//   price: "",
// };

// async function run() {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(
//     "https://trends.google.com/trends/trendingsearches/daily?geo=SG"
//   );

//   //await page.screenshot({ path: "example.png", fullPage: true });
//   //const html = await page.content();
//   const text = await page.evaluate(() => {
//     document.body.innerText;
//   });
//   console.log(text);

//   await browser.close();
// }

// app.get("/product", async (req, res) => {
//   const browser = await puppeteer.launch();

//   const page = await browser.newPage();

//   await page.goto(
//     "https://trends.google.com/trends/trendingsearches/daily?geo=SG"
//   );

//   productDetail.name = await page.$eval(Selectors.name, (el) => el.textContent);

//   price_ = await page.$eval(Selectors.price, (el) => el.textContent);

//   let t = 0;

//   price_ = price_.replace(/,/g, (match) => (++t === 2 ? "." : match));

//   productDetail.price = price_;

//   await browser.close();

//   res.json(productDetail);
// });

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });

// run();

const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

const PCR = require("puppeteer-chromium-resolver");

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const baseURL = `https://trends.google.com`;
const countryCode = "SG";
const { executablePath } = require("puppeteer");

// async function fillTrendsDataFromPage(page) {
//   while (true) {
//     const isNextPage = await page.$(".feed-load-more-button");
//     if (!isNextPage) break;
//     await page.click(".feed-load-more-button");
//     await page.waitForTimeout(2000);
//   }
//   const dataFromPage = await page.evaluate((baseURL) => {
//     return Array.from(document.querySelectorAll(".feed-list-wrapper")).map(
//       (el) => ({
//         [el.querySelector(".content-header-title").textContent.trim()]:
//           Array.from(el.querySelectorAll("feed-item")).map((el) => ({
//             index: el.querySelector(".index")?.textContent.trim(),
//             title: el.querySelector(".title a")?.textContent.trim(),
//             titleLink: `${baseURL}${el
//               .querySelector(".title a")
//               ?.getAttribute("href")}`,
//             subtitle: el.querySelector(".summary-text a")?.textContent.trim(),
//             subtitleLink: el
//               .querySelector(".summary-text a")
//               ?.getAttribute("href"),
//             source: el
//               .querySelector(".source-and-time span:first-child")
//               ?.textContent.trim(),
//             published: el
//               .querySelector(".source-and-time span:last-child")
//               ?.textContent.trim(),
//             searches: el
//               .querySelector(".search-count-title")
//               ?.textContent.trim(),
//             thumbnail: el.getAttribute("image-url"),
//           })),
//       })
//     );
//   }, baseURL);
//   return dataFromPage;
// }

// async function getGoogleTrendsDailyResults() {
//   const browser = await puppeteer.launch({
//     headless: false,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--window-size=1200,700",
//     ],
//     executablePath: executablePath(),
//   });
//   const page = await browser.newPage();
//   page.setViewport({ width: 1200, height: 700 });

//   const URL = `${baseURL}/trends/trendingsearches/daily?geo=${countryCode}&hl=en`;

//   await page.setDefaultNavigationTimeout(60000);
//   await page.goto(URL);

//   await page.waitForSelector(".feed-item");

//   const dailyResults = await fillTrendsDataFromPage(page);

//   await browser.close();

//   return dailyResults;
// }

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
          data: Array.from(el.querySelectorAll("feed-item")).map((el) => ({
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
        "--disable-setuid-sandbox",
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
