import puppeteer, { Browser, Page } from "puppeteer";

class Puppeteer {
  private static instance: Puppeteer;
  private browser: Browser | null = null;
  private page: Page | null = null;

  private constructor() {}

  public static getInstance(): Puppeteer {
    if (!Puppeteer.instance) {
      Puppeteer.instance = new Puppeteer();
    }
    return Puppeteer.instance;
  }

  public async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
      });
      this.page = await this.browser.newPage();
    }
  }

  public getBrowser(): Browser | null {
    return this.browser;
  }

  public getPage(): Page | null {
    return this.page;
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
const client = Puppeteer.getInstance();
await client.init();
const page = client.getPage();

if (!page) throw new Error("Page could not be initialized");

const getURLs = async (query: string) => {
  const url = new URL("https://www.google.com/search");
  url.searchParams.append("q", query);
  url.searchParams.append("sourceid", "chrome");
  url.searchParams.append("ie", "UTF-8");

  await page.goto(url.toString());
  const elements = await page.$$("a");
  if (!elements) {
    throw new Error("No elements found");
  }
  let links: string[] = [];
  const maxLinks = 5;

  // Use `Promise.all` to wait for all asynchronous operations to complete
  const promises = elements.map(async (element) => {
    const href = await element.getProperty("href");
    const data = await href.jsonValue();

    if (
      links.length < maxLinks &&
      !data.includes("google.com") &&
      data.length > 1
    ) {
      links.push(data);
    }
  });
  // Wait for all promises to complete
  await Promise.allSettled(promises);
  return links;
};

const scrapeURL = (url: string) => {
  page.goto(url);
};

export default Puppeteer;
