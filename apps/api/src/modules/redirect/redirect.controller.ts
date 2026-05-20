import { Controller, Get, Headers, Inject, Ip, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { RedirectService } from "./redirect.service";

@Controller()
export class RedirectController {
  constructor(@Inject(RedirectService) private readonly redirectService: RedirectService) {}

  @Get("r/:code")
  async resolveQr(
    @Param("code") code: string,
    @Headers("user-agent") userAgent: string | undefined,
    @Headers("referer") referrer: string | undefined,
    @Ip() ip: string,
    @Res() response: Response
  ) {
    const result = await this.redirectService.resolveQr(code, { userAgent, referrer, ip });
    return this.sendResult(response, result);
  }

  @Get("n/:code")
  async resolveNfc(
    @Param("code") code: string,
    @Headers("user-agent") userAgent: string | undefined,
    @Headers("referer") referrer: string | undefined,
    @Ip() ip: string,
    @Res() response: Response
  ) {
    const result = await this.redirectService.resolveNfc(code, { userAgent, referrer, ip });
    return this.sendResult(response, result);
  }

  private sendResult(
    response: Response,
    result: Awaited<ReturnType<RedirectService["resolveQr"]>>
  ) {
    if (result.status === "REDIRECT" && result.targetUrl) {
      return response.redirect(302, result.targetUrl);
    }

    return response.status(200).send(this.renderFallback(result.message));
  }

  private renderFallback(message: string) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ShopWise</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #f7f5ef; color: #111827; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 24px; text-align: center; }
      section { max-width: 460px; }
      p { color: #5b6472; line-height: 1.5; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>ShopWise</h1>
        <p>${this.escapeHtml(message)}</p>
      </section>
    </main>
  </body>
</html>`;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

