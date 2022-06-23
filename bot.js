"use strict";
const fs = require("fs");
const puppeteer = require("puppeteer");
const reader = require("xlsx");

const log = console.log;

(async () => {
  try {
    log("scraping https://de.linkedin.com/jobs");
    const browser = await puppeteer.launch({
      headless: true,
    });

    const url = `https://de.linkedin.com/jobs`;

    const page = await browser.newPage();
    await page.setViewport({
      width: 1024,
      height: 768,
    });

    await page.goto(url);

    await delay(3000);

    const privacy = await page.waitForSelector('[action-type="ACCEPT"]');
    if (privacy) {
      await page.click('[action-type="ACCEPT"]');
    }
    const input = await page.$('[name="location"]');
    await input.click({ clickCount: 3 });
    await input.type("Freiburg im Breisgau");
    await delay(300);

    await page.keyboard.press("Enter");

    await delay(3000);

    await autoScroll(page);

    let currentJob = 0;

    let temp = 2;

    while (true) {
      log(`scraping page ${temp}`);
      const jobs = await page.$$eval(".base-search-card__info h3", (jobs) => {
        return jobs.map((job) => job.textContent.replace(/\\n|\n| {2,}/g, ""));
      });

      if (currentJob === jobs.length || jobs.length === 1000) break;

      currentJob = jobs.length;

      await page.focus("button.infinite-scroller__show-more-button");
      await page.click("button.infinite-scroller__show-more-button");
      await delay(3000);
    }

    const jobs = await page.$$eval(".base-search-card__info h3", (jobs) => {
      return jobs.map((job) => job.textContent.replace(/\\n|\n| {2,}/g, ""));
    });

    const companyNames = await page.$$eval(
      ".base-search-card__subtitle",
      (jobs) => {
        return jobs.map((job) => job.textContent.replace(/\\n|\n| {2,}/g, ""));
      }
    );

    const jobLocations = await page.$$eval(
      ".job-search-card__location",
      (jobs) => {
        return jobs.map((job) => job.textContent.replace(/\\n|\n| {2,}/g, ""));
      }
    );

    let allJob = [];

    jobs.forEach((job, index) => {
      allJob.push({
        job,
        companyName: companyNames[index],
        jobLocation: jobLocations[index],
      });
    });

    await browser.close();

    const workbook = reader.utils.book_new();

    const worksheet = reader.utils.json_to_sheet(allJob);
    reader.utils.book_append_sheet(workbook, worksheet, "jobs");

    reader.writeFile(workbook, "./scrape data.xlsx");
  } catch (error) {
    log(error.message);
  }
})();

const delay = function (time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 500;
      var timer = setInterval(async () => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 3000);
    });
  });
}

// alsa-lib.x86_64 atk.x86_64 cups-libs.x86_64 gtk3.x86_64 ipa-gothic-fonts libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXrandr.x86_64 libXScrnSaver.x86_64 libXtst.x86_64 pango.x86_64 xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-fonts-cyrillic xorg-x11-fonts-misc xorg-x11-fonts-Type1 xorg-x11-util -y
