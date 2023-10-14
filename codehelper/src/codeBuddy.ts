import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';


export class CodeBuddyProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    constructor(private apiKey: string) {
        this.openAITest();
        console.log("in constructor");
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        this.openAITest();
        console.log("in getTreeItem");
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        return Promise.resolve([]);
    }

    private async openAITest(){
        const openai = new OpenAI({
            apiKey: this.apiKey,
        });

        console.log("Contacting ChatGPT.");
        const completion = await openai.chat.completions.create(
        {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Say this is a test' }],
        });

        console.log(completion.choices[0].message.content);
    }


}