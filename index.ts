import { UniversalWallet, wifToHex, WalletType } from "./wallets.ts";
import { createState } from "@persevie/statemanjs";

import { Client } from "./client.ts";

import { Wallet as EvmWallet } from "ethers";
import { Keypair as SolWallet } from "@solana/web3.js";
import ora, { oraPromise, type Ora } from "ora";
import bs58 from "bs58";
import inquirer from "inquirer";
import type { Config } from "./types";
import { chunk } from "./utils.ts";
import {
	Action,
	LoopAction,
	Menu,
	MenuPrompt,
	openMenuPrompt,
} from "./chat.ts";

async function readConfig(): Promise<Config> {
	return Bun.TOML.parse(await Bun.file("./data/config.toml").text()) as Config;
}

async function readWallets(walletsType: "sol" | "evm" | "btc_hex" | "btc_wif") {
	const wallets = Array.from(
		new Set(
			(await Bun.file(`./data/accounts/${walletsType}.txt`).text())
				.trim()
				.split("\n"),
		),
	);

	switch (walletsType) {
		case "sol": {
			return wallets.map((wallet) => {
				return new UniversalWallet(
					SolWallet.fromSecretKey(bs58.decode(wallet.trim())),
					WalletType.SOL,
				);
			});
		}
		case "evm": {
			return wallets.map((wallet) => {
				return new UniversalWallet(
					new EvmWallet(wallet.trim()),
					WalletType.EVM,
				);
			});
		}
		case "btc_hex": {
			return wallets.map((wallet) => {
				return new UniversalWallet(wallet.trim(), WalletType.BTC);
			});
		}
		case "btc_wif": {
			return wallets.map((wallet) => {
				return new UniversalWallet(wifToHex(wallet.trim()), WalletType.BTC);
			});
		}
	}
}

async function mainMenu() {
	const spinner = ora({
		text: "Reading config and making main session",
	}).start();

	const config = await readConfig();

	const client = new Client(
		config.main_solana_wallet,
		await Bun.file("./data/proxy.txt")
			.text()
			.then((r) => r.trim().split("\n")),
	);

	await client.login();
	const { success } = await client.verifyAndCreate().then((r) => r.json());

	await client.login();

	if (!success || !client.cookies.has("session_signature")) {
		spinner.fail("Failed to login into magiceden account");

		return await mainMenu();
	}

	console.log(client.cookies);

	spinner.succeed("Success logged in into magiceden account");

	const prompts = {
		menu: new MenuPrompt("Choose menu", 20, false, [
			new Action("Link wallets", async () => {
				await linkWallets(config, spinner, client);

				return "menu";
			}),
			new LoopAction("Show points", async () => {
				console.log(
					`Total points by linked wallets ${await client.fetchTokens()}`,
				);
				return "menu";
			}),
			new Action("Exit", () => process.exit(0)),
		]),
	};

	await openMenuPrompt("menu", prompts);
}

async function linkWallets(config: Config, spinner: Ora, client: Client) {
	const answers = await inquirer.prompt([
		{
			type: "list",
			name: "function",
			message: "Choose wallets type:",
			choices: [
				{ name: "Sol wallets", value: "sol" },
				{ name: "Evm wallets", value: "evm" },
				{ name: "Btc hex wallets", value: "btc_hex" },
				{ name: "Btc wif wallets", value: "btc_wif" },
			],
		},
	]);

	spinner.info(`Reading wallets for type: ${answers.function}`);

	const wallets = await readWallets(answers.function);

	if (!wallets.length) {
		spinner.fail("File with wallets is empty");

		return await mainMenu();
	}

	spinner.info(`Total wallets: ${wallets.length}`);

	const chunkSize =
		wallets.length > 200
			? Math.ceil(wallets.length / config.max_threads)
			: wallets.length;
	const chunks = chunk(wallets, chunkSize);

	const successesState = createState<UniversalWallet[]>([]);
	const checkedState = createState<UniversalWallet[]>([]);

	successesState.subscribe((state) => {
		spinner.text = `Total eligible wallets: ${state.length}, Checked wallets: ${checkedState.get().length}, Threads: ${config.max_threads}, Accounts per thread: ${Math.round(chunkSize)}`;
		spinner.render();
	});

	checkedState.subscribe((state) => {
		spinner.text = `Total eligible wallets: ${successesState.get().length}, Checked wallets: ${state.length}, Threads: ${config.max_threads}, Accounts per thread: ${Math.round(chunkSize)}`;
		spinner.render();
	});

	await Promise.all(
		chunks.map(async (chunk) => {
			for (const wallet of chunk) {
				for (let i = 0; i < 5; i++) {
					try {
						const result = await client.linkWallet(wallet).then((r) => {
							const e = r[0]?.result?.data?.json?.eligibility;

							return e?.eligibility;
						});
						if (result) {
							if (result === "eligible") {
								successesState.update((state) => {
									state.push(wallet);
								});
							}

							checkedState.update((state) => {
								state.push(wallet);
							});

							break;
						}
					} catch (e) {}
				}
			}
		}),
	);

	spinner.text = "Save all eligible wallets";
	spinner.render();

	const file = Bun.file("successes.txt").writer();
	await file.write(
		successesState
			.get()
			.map((r) => r.getPrivateKey())
			.join("\n"),
	);
	await file.flush();

	return "menu";
}

await mainMenu();
