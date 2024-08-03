import * as vscode from 'vscode';
import OpenAI from 'openai';

let openai: OpenAI;
let apiKey: string | undefined;
let contextStorage: vscode.ExtensionContext;

export async function initializeOpenAI(context: vscode.ExtensionContext) {

    contextStorage = context;

    apiKey = contextStorage.globalState.get<string>('openaiApiKey');

    if (!apiKey) {
        apiKey = await vscode.window.showInputBox({
            placeHolder: 'Enter your OpenAI API key',
            prompt: 'You need to provide an API key to use this extension',
            ignoreFocusOut: true,
            password: true
        });
    }

    if (apiKey) {
        await contextStorage.globalState.update('openaiApiKey', apiKey);
        console.log("apikey:",apiKey);
    } else {
        vscode.window.showErrorMessage('API key is required to use this extension.');
        return;
    }

    openai = new OpenAI({
        apiKey: apiKey,
    });
}

export async function promptChatGpt(prompt: string) {
    console.log("Sending prompt to ChatGPT");

    try{
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
        });
        return completion;
    } catch (error:any) {
        console.log(error);
        if(error.code === "invalid_api_key"){
            vscode.window.showErrorMessage('Invalid API Key has been used. Please put in a new one.');
            apiKey = undefined;
            apiKey = await vscode.window.showInputBox({
                placeHolder: 'Enter your OpenAI API key',
                prompt: 'You need to provide an API key to use this extension',
                ignoreFocusOut: true,
                password: true
            });
            if (!apiKey) {
                vscode.window.showErrorMessage('Invalid API Key. Operation cannot continue without a valid API key.');
                return;
            }
            await contextStorage.globalState.update('openaiApiKey', apiKey);
            openai = new OpenAI({
                apiKey: apiKey,
            });
        }
    }
}

export async function mainTest() {
    console.log("Contacting ChatGPT.");
    const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say this is a test' }],
    });
  
    console.log(completion.choices);
}