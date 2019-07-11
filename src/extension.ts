// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as request from 'request';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.finalUrls', () => {
		// The code you place here will be executed every time your command is executed

		const activeTextEditor = vscode.window.activeTextEditor;
		if (activeTextEditor === undefined) {
			vscode.window.showErrorMessage("Can't find any current file");
			return false;
		}

		// check if html
		if (activeTextEditor.document.languageId !== 'html') {
			vscode.window.showErrorMessage('The current file is not html');
			return false;
		}

		// Display a message box to the user
		const filepath = activeTextEditor.document.fileName;
		let data = fs.readFileSync(filepath, 'utf8');
		console.log('Got the content of the file');
		const linkRegex = /<a.*?>/gs;
		const hrefRegex = /href=["'](.*?)["']/m;
		const links = data.match(linkRegex);
		var linksAlreadyTreated: string[] = [];

		if (links === null) {
			vscode.window.showErrorMessage('There are no links in this html');
			return false;
		}

		var processTimes: number = 0;
		let linkReplaced: number = 0;

		console.log('Looping through the links');
		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			
			// if already treated
			if (linksAlreadyTreated.includes(link)) {
				linkReplaced++;
				continue;
			}
			linksAlreadyTreated.push(link);

			processTimes++;

			const hrefMatch = link.match(hrefRegex);
			if (hrefMatch === null) {
				vscode.window.showErrorMessage(`There's a link with no href attribut: ${link}`);
				return false;
			}
			const href = hrefMatch[1];

			console.log(`Processing the link ${href}`);

			request.get(href, (err: any, res: any): void => {
				if (err) {
					throw err;
				}
				let replacementUrl: string = res.request.uri.href;

				console.log(`Getting the replacement link: ${replacementUrl}`);

				// replace
				data = data.replace(
					new RegExp(`href=["']${href}["']`, 'gi'),
					`href="${href}?${replacementUrl}"`
				);
				linkReplaced++;

				if (linkReplaced === links.length) {
					console.log(`${processTimes} links processed.`);
					fs.writeFileSync(filepath, data, {
						encoding: 'utf8'
					});
					vscode.window.showInformationMessage('The hrefs are replaced');
				}
			});
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
