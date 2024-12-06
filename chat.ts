import inquirer from "inquirer";

// MAIN FUNCTION
export const openMenuPrompt = async (
	current: string,
	prompts: Dict<MenuPrompt>,
	last?: string,
): Promise<any> => {
	const answer: Answer = (await inquirer.prompt([prompts[current]])).value;
	let next = answer.execute({ current, last });

	if (next instanceof Promise) {
		next = await next;
	}

	if (!next) return;
	return await openMenuPrompt(next, prompts, current === next ? last : current);
};

// PUBLIC TYPES
export class MenuPrompt {
	type = "list";
	name = "value";
	message: string;
	pageSize: number;
	choices: Choice[];
	constructor(
		message: string,
		pageSize: number,
		isOrdinalList: boolean,
		choices: Choice[],
	) {
		this.message = message;
		this.pageSize = pageSize;
		this.choices = choices;
		if (isOrdinalList) {
			this.choices.forEach(
				(choice, i) => (choice.name = `${i + 1}: ${choice.name}`),
			);
		}
	}
}

export interface Choice {
	name: string;
	value: Answer;
}
export class Action implements Choice {
	name: string;
	value: Answer;
	constructor(name: string, execute: (context?: MenuContext) => any) {
		this.name = name;
		this.value = { execute };
	}
}
export class LoopAction implements Choice {
	name: string;
	value: Answer;
	constructor(name: string, execute: (context?: MenuContext) => any) {
		this.name = name;
		this.value = { execute: (context) => execute(context) ?? context.current };
	}
}
export class Menu implements Choice {
	name: string;
	value: Answer;
	constructor(name: string, menuKey: string) {
		this.name = name;
		this.value = { execute: () => menuKey };
	}
}

// INTERNAL TYPES
type Dict<T = any> = { [key: string]: T };

interface Answer {
	execute: (context: MenuContext) => any;
}
interface MenuContext {
	current: string;
	last: string;
}
