import * as vscode from 'vscode';
import * as codeBuddyCompile from './codeBuddyCompile';
import { promptChatGpt } from './configOpenAI';
import { CError } from './codeBuddyCompile';

export class CodeBuddyWebViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'code-buddy.view';

    private _view?: vscode.WebviewView;
    private currCompileErrors: CError[] = [];
    private currRuntimeErrors: CError[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri
    ) { }

    resolveWebviewView(
        webview: vscode.WebviewView,
        thiswebviewContext: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {

        webview.webview.options = { enableScripts: true };
        webview.webview.html = this._getHtmlForWebview(webview.webview);
        webview.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case "compile":
                    this.handleCompileCommand(webview);
                    break;
                case "explain-compile-error":
                    this.handleExplainCompileErrorCommand(message, webview);
                    break;
                case "runtime":
                    this.handleRuntimeCommand(webview);
                    break;
                case "explain-runtime-error":
                    this.handleExplainRuntimeErrorCommand(message, webview);
                    break;
            }
        });
    }

    private handleCompileCommand(webview: vscode.WebviewView): void {
        let compileResult = Promise.resolve(codeBuddyCompile.cCompile(
            "gcc",
            "this",
            "there"
        ));
        compileResult.then((val) => {
            switch(val.type) {
                // Cases are basically duplicate code here, we can
                // make this better by collapsing them
                case 0:
                    // Compilation succeeded
                    console.log(val);
                    webview.webview.postMessage(val);
                    break;
                case 1:
                    // Compilation failed
                    if (val.content === null) {
                        console.log("content was null");
                        return;
                    }
                    webview.webview.postMessage(val);
                    this.currCompileErrors = val.content;
                    break;
                default:
                    console.log("default case");
                    break;
            }
        });
    }

    private handleExplainCompileErrorCommand (
        message: any,
        webview: vscode.WebviewView
    ): void {
        const index = message.index;
        const errorText: string = `Error on line ${this.currCompileErrors[index].line}
        in function ${this.currCompileErrors[index].func}.
        Error message: ${this.currCompileErrors[index].errormsg}
        Code: ${this.currCompileErrors[index].linetext}`;

        const prompt: string = `Here is a C Compile Time Error: 
        ${errorText}
        Here is the format regarding how I want your response to look like:
        Act as a TA/teacher's assistant for me.
        First inform me what line and what function the error occurred in.
        Then explain to me what is wrong with my code in simple terms as I am new to programming.
        DO NOT tell me how to fix the error.
        DO NOT provide code corrections.
        DO NOT tell me what line to fix.
        Just explain the error in simple terms.`;

        promptChatGpt(prompt).then((val) => {
            const response = val.choices[0].message.content;
            if (response === null) {
                console.log("response was null");
                return;
            }
            const messageToWebview = {
                type: 2,
                index: message.index,
                message: response
            };
            webview.webview.postMessage(messageToWebview);
        });
    }

    private handleRuntimeCommand(webview: vscode.WebviewView): void {
        let runtimeCheckResult = Promise.resolve(codeBuddyCompile.cCheck());

        runtimeCheckResult.then((val) => {
            switch(val.type) {
                case 0:
                    vscode.window.showErrorMessage("ERROR: error when running cppcheck");
                    break;
                case 3:
                    if (val.content === null) {
                        console.log("content was null");
                        return;
                    }
                    console.log("test");
                    console.log(val);
                    webview.webview.postMessage(val);
                    this.currRuntimeErrors = val.content;
                    break;
                default:
                    console.log("handleRuntimeCommand default case");
                    break;
            }
        });
    }

    private handleExplainRuntimeErrorCommand(
        message: any,
        webview: vscode.WebviewView
    ): void {
        console.log("chatgpt runtime error");
        const index = message.index;
        const errorText: string = `Error on line ${this.currRuntimeErrors[index].line}.
        Error message: ${this.currRuntimeErrors[index].errormsg}
        Code: ${this.currRuntimeErrors[index].linetext}`;

        const prompt: string = `Here is a description of a C runtime error: 
        ${errorText}
        Here is the format regarding how I want your response to look like:
        Act as a TA/teacher's assistant for me.
        Then explain to me what is wrong with my code in simple terms as I am new to programming.
        DO NOT tell me how to fix the error.
        DO NOT provide code corrections.
        DO NOT tell me what line to fix.
        Just explain the error in simple terms.
        Be concise by limiting your response to one paragraph.`;

        console.log("prompting...");
        promptChatGpt(prompt).then((val) => {
            const response = val.choices[0].message.content;
            if (response === null) {
                console.log("response was null");
                return;
            }
            console.log("runtime response");
            const messageToWebview = {
                type: 4,
                index: message.index,
                message: response
            };
            webview.webview.postMessage(messageToWebview);
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
        );

        let webviewHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width initial-scale=1.0">
            <title>Get Started</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <div class="control-buttons">
                <button id="compile-button">Check Compile Errors</button>
                <button id="runtime-button">Check Runtime Errors</button>
            </div>

            <div id="compile-error-container" class="error-container"></div>
            <div id="runtime-error-container" class="error-container"></div>

            <script src="${scriptUri}"></script>
                
        </body>
        </html>`;

        return webviewHtml;
    }
}
