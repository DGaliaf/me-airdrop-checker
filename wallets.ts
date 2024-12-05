import * as bitcoin from "bitcoin-sdk-js";
import type { Wallet as EvmWallet } from "ethers";
import type { Keypair as SolWallet } from "@solana/web3.js";
import bs58 from "bs58";
import { decodeUTF8 } from "tweetnacl-util";
import nacl from "tweetnacl/nacl";
import bs58check from "bs58check";

export enum WalletType {
	EVM = "EVM",
	BTC = "BTC",
	SOL = "SOL",
}

export type WalletInstance = EvmWallet | string | SolWallet; // string - btc hex_secret_key

interface IWallet {
	getAddress(): Promise<string>;
	signMessage(message: string): Promise<string>;
}

export class UniversalWallet implements IWallet {
	private wallet: WalletInstance;
	public walletType: WalletType;

	constructor(wallet: WalletInstance, walletType: WalletType) {
		this.wallet = wallet;
		this.walletType = walletType;
	}

	async getAddress(): Promise<string> {
		switch (this.walletType) {
			case WalletType.EVM:
				return (this.wallet as EvmWallet).address;

			case WalletType.BTC: {
				const publicKey = await bitcoin.wallet.getPublicKey(
					this.wallet as string,
				);
				return bitcoin.address.generateAddress(publicKey, "segwit");
			}

			case WalletType.SOL:
				return (this.wallet as SolWallet).publicKey.toBase58();

			default:
				throw new Error("Unsupported wallet type");
		}
	}

	getPrivateKey() {
		switch (this.walletType) {
			case WalletType.EVM:
				return (this.wallet as EvmWallet).privateKey;

			case WalletType.BTC: {
				return this.wallet as string;
			}

			case WalletType.SOL:
				return bs58.encode((this.wallet as SolWallet).secretKey);

			default:
				throw new Error("Unsupported wallet type");
		}
	}

	async signMessage(message: string): Promise<string> {
		switch (this.walletType) {
			case WalletType.EVM:
				return (this.wallet as EvmWallet).signMessageSync(message);

			case WalletType.BTC: {
				const address = await this.getAddress();
				return await bitcoin.crypto.signMessage(
					message,
					this.wallet as string,
					address,
				);
			}

			case WalletType.SOL:
				return bs58.encode(
					nacl.sign.detached(
						decodeUTF8(message),
						(this.wallet as SolWallet).secretKey,
					),
				);

			default:
				throw new Error("Unsupported wallet type");
		}
	}
}

export function wifToHex(wifKey: string): string {
	const decoded = bs58check.decode(wifKey);

	const privateKey = decoded.slice(
		1,
		decoded.length - (decoded.length > 33 ? 1 : 0),
	);

	const hex = Array.from(privateKey)
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");

	return hex;
}
