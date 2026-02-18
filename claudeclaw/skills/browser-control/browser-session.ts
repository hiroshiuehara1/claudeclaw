export class BrowserSession {
  private browser: any = null;
  private page: any = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private headless: boolean;
  private timeout: number;

  constructor(headless = true, timeout = 30000) {
    this.headless = headless;
    this.timeout = timeout;
  }

  async getPage(): Promise<any> {
    if (!this.browser) {
      const { chromium } = await import("playwright");
      this.browser = await chromium.launch({ headless: this.headless });
      this.page = await this.browser.newPage();
    }
    this.resetIdleTimer();
    return this.page;
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.close(), this.timeout);
  }

  async close(): Promise<void> {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    await this.browser?.close();
    this.browser = null;
    this.page = null;
  }

  isActive(): boolean {
    return this.browser !== null;
  }
}
