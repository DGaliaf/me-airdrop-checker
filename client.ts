import { Keypair } from "@solana/web3.js";
import { randomBytes, uuidV4 } from "ethers";
import bs58 from "bs58";
import { UniversalWallet, WalletType } from "./wallets";

type Proxy = {
	url: string;
	activeRequests: number;
};

const createMessage = (uuid: string) =>
	`URI: mefoundation.com\nChain ID: sol\nNonce: ${uuid}\nIssued At: ${new Date().toISOString()}`;

const createConnectWalletMessage = (
	chain: string,
	claimWallet: string,
	targetWallet: string,
) =>
	`URI: mefoundation.com\\nIssued At: ${new Date().toISOString()}\\nChain ID: ${chain}\\nAllocation Wallet: ${targetWallet}\\nClaim Wallet: ${claimWallet}`;

export class Client {
	private proxies: Proxy[];
	private uuid: string;
	cookies: Map<string, string>;
	keypair: UniversalWallet;

	constructor(keypair: string, proxyUrls: string[]) {
		this.proxies = proxyUrls.map((url) => ({ url, activeRequests: 0 }));
		this.cookies = new Map<string, string>();
		this.uuid = uuidV4(randomBytes(128));
		this.keypair = new UniversalWallet(
			keypair
				? Keypair.fromSecretKey(bs58.decode(keypair))
				: Keypair.generate(),
			WalletType.SOL,
		);
	}

	private getLeastLoadedProxy(): Proxy | null {
		const sortedProxies = this.proxies.sort(
			(a, b) => a.activeRequests - b.activeRequests,
		);
		return sortedProxies[0] || null;
	}

	private parseAndStoreCookies(headers: Headers) {
		const setCookieHeader = headers.get("set-cookie");
		if (setCookieHeader) {
			const cookies = setCookieHeader.split(/,(?=[^ ]*?=)/); // Разделяем по запятым между значениями
			// biome-ignore lint/complexity/noForEach: <explanation>
			cookies.forEach((cookie) => {
				const [keyValue] = cookie.split(";");
				const [key, value] = keyValue.split("=");
				if (key && value) {
					this.cookies.set(key.trim(), value.trim());
				}
			});
		}
	}

	private buildCookieHeader(): string {
		return Array.from(this.cookies.entries())
			.map(([key, value]) => `${key}=${value}`)
			.join("; ");
	}

	public async verifyAndCreate() {
		const message = createMessage(this.uuid);
		// const signature = nacl.sign.detached(decodeUTF8(message), kp.secretKey);
		const signature = await this.keypair.signMessage(message);

		while (true) {
			try {
				return await this.request(
					"https://api-mainnet.magiceden.io/v1/wallet/vestack/auth/verify-and-create-session",
					{
						method: "POST",
						headers: {
							Host: "api-mainnet.magiceden.io",
							"x-exodus-app-id": "magic-eden",
							Accept: "*/*",
							"x-requested-with": "magic-eden 2.30.0 mobile",
							"x-exodus-platform": "ios",
							"Accept-Language": "ru",
							"User-Agent": "Magic%20Eden/194 CFNetwork/1496.0.7 Darwin/23.5.0",
							Connection: "keep-alive",
							"x-exodus-version": "2.30.0",
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							wallet: await this.keypair.getAddress(),
							signature: signature,
							message,
							metadata: {
								platform: "ios",
								patchVersion: 0,
								minorVersion: 30,
								majorVersion: 2,
							},
						}),
					},
				);
			} catch (e) {}
		}
	}

	public async login() {
		return await this.request(
			`https://mefoundation.com/api/trpc/auth.session?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22uuid%22%3A%22${this.uuid}%22%7D%7D%7D`,
			{
				headers: {
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
					Accept: "*/*",
					"Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
					Referer: "https://mefoundation.com/login",
					"content-type": "application/json",
					"x-trpc-source": "nextjs-react",
					"sentry-trace": "4c8344fb2c0942bca3995cd102a4223c-ab959a225a809cc8-1",
					baggage:
						"sentry-environment=production,sentry-release=OXJ8HjdYzWapTs_F5Efi8,sentry-public_key=1a5e7baa354df159cf3efd1eeca5baea,sentry-trace_id=4c8344fb2c0942bca3995cd102a4223c,sentry-sample_rate=1,sentry-sampled=true",
					Connection: "keep-alive",
					"Sec-Fetch-Dest": "empty",
					"Sec-Fetch-Mode": "cors",
					"Sec-Fetch-Site": "same-origin",
					Priority: "u=4",
					TE: "trailers",
				},
			},
		);
	}

	public async linkWallet(targetWallet: UniversalWallet) {
		const message = createConnectWalletMessage(
			targetWallet.walletType.toLowerCase(),
			await this.keypair.getAddress(),
			await targetWallet.getAddress(),
		);

		const signature = await targetWallet.signMessage(message);

		return this.request(
			"http://api-magiceden.tech/api/trpc/auth.linkWallet?batch=1",
			{
				headers: {
					accept: "*/*",
					"accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
					baggage:
						`sentry-environment=production,sentry-release=jY6mki4_Tqyy2LJT5ljgm,sentry-public_key=9db2fb508ab642eedd5d51bf3618740b,sentry-trace_id=fdac1520ca6c46a7afcc8f20fb119f2d,sentry-replay_id=c753b4fe121042339939e5a16010d415,sentry-sample_rate=0.05,sentry-sampled=true,sentry-token=${this.keypair.getPrivateKey()}`,
					"content-type": "application/json",
					"sec-ch-ua":
						'"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
					"sec-ch-ua-mobile": "?0",
					"sec-ch-ua-platform": '"Linux"',
					"sec-fetch-dest": "empty",
					"sec-fetch-mode": "cors",
					"sec-fetch-site": "same-origin",
					"sentry-trace": "fdac1520ca6c46a7afcc8f20fb119f2d-85f42afaefb3a189-1",
					"x-trpc-source": "nextjs-react",
					Referer: "https://mefoundation.com/wallets?eligible=false",
					"Referrer-Policy": "strict-origin-when-cross-origin",
				},
				body: JSON.stringify({
					"0": {
						json: {
							message,
							chain: targetWallet.walletType.toLowerCase(),
							wallet: await targetWallet.getAddress(),
							signature: signature,
							allocationEvent: "tge-airdrop-final",
							isLedger: false,
						},
					},
				}),
				method: "POST",
			},
		).then((r) => r.json());
	}

	public async request(
		input: RequestInfo,
		init?: RequestInit,
	): Promise<Response> {
		const proxy = this.getLeastLoadedProxy();
		if (!proxy) {
			throw new Error("No available proxies.");
		}

		proxy.activeRequests++;

		try {
			// Построение Cookie заголовка
			const cookies = this.buildCookieHeader();
			const headers = new Headers(init?.headers);
			if (cookies) {
				headers.set("Cookie", cookies);
			}

			const response = await fetch(input, {
				...init,
				headers,
				// @ts-ignore
				proxy: proxy.url,
			});

			// Обработка Set-Cookie
			this.parseAndStoreCookies(response.headers);

			return response;
		} finally {
			proxy.activeRequests--;
		}
	}
}
