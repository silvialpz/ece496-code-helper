import * as vscode from 'vscode';
import * as codeBuddyCompile from './codeBuddyCompile';
import { promptChatGpt } from './configOpenAI';
import { CError } from './codeBuddyCompile';
import * as fs from 'fs';

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

        this._view = webview;
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

    private runtimeScript(): void {
        let cwd: string;
        let cwd2: string;
        let filePath: string;
        let cnt: number = 0;
        if(vscode.workspace.workspaceFolders) {
            cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
            console.log(vscode.workspace.textDocuments.length);
            fs.readdirSync(cwd).forEach(folder => {
                if(folder !== "out.exe") {
                    cwd2 = cwd + "\\" + folder;
                    fs.readdirSync(cwd2).forEach(folder2 => {
                        filePath = cwd2 + "\\" + folder2;
                        Promise.resolve(codeBuddyCompile.cCheck(filePath)).then((val) => {
                            if(val.content && val.content.length > 0) {
                                val.content.forEach((err, i) => {
                                    const errorText: string = `Error on line ${err.line}.
                                    Error message: ${err.errormsg}
                                    Code: ${err.linetext}`;

                                    const prompt: string = `Here is a description of a C runtime error: 
                                    ${errorText}
                                    Here is the format regarding how I want your response to look like:
                                    Act as a TA/teacher's assistant for me.
                                    Then explain to me what is wrong with my code in simple terms as I am new to programming.
                                    DO NOT tell me how to fix the error.
                                    DO NOT provide code corrections.
                                    Just explain the error in simple terms.
                                    Be concise by limiting your response to two paragraphs or less.`;

                                    promptChatGpt(prompt).then((resp) => {
                                        const response = resp.choices[0].message.content;
                                        fs.appendFileSync("C:\\Users\\aricl\\Documents\\Code\\ece496-code-helper\\log2.txt",
                                                            val.message + "\nError " + i.toString() + "\n---\n" + response + "\n---\n\n");
                                    });
                                    
                                });
                            }
                        });
                    });
                }
            });
        }
    }

    private handleRuntimeCommand(webview: vscode.WebviewView): void {
        // Code in if(0) is the script used for automation in the milestone 2
        // testing to collect the ChatGPT results of all test cases at once
        // into a txt file
        if(0) {
            this.runtimeScript();
            return;
        }

        let runtimeCheckResult = Promise.resolve(codeBuddyCompile.cCheck(null));

        runtimeCheckResult.then((val) => {
            switch(val.type) {
                case 0:
                    // No runtime errors detected
                    webview.webview.postMessage(val);
                    console.log(val);
                    break;
                case 1:
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

    handleLogicCommand(): void {
        if(vscode.window.activeTextEditor) {
            // Get user highlighted text
            const selection: vscode.Selection = vscode.window.activeTextEditor.selection;
            const range: vscode.Range = new vscode.Range(
                selection.start.line, selection.start.character, selection.end.line, selection.end.character
            );
            const highlightedText: string = vscode.window.activeTextEditor.document.getText(range);
            console.log(highlightedText);
            
            const prompt: string = `Here is some C code: 
            \`\`\`${highlightedText}\`\`\`
            I want your response to look as follows:
            Act as a TA/teacher's assistant for me.
            DO NOT provide code corrections.
            DO NOT tell me what line to fix.
            Identify if there are any logic errors or inconsistencies in the code provided.
            If you do not see any potential logical errors, then tell me.
            Just help me identify any logical errors.
            Be concise.
            If there are any logical errors, please ask me relevant questions to help me understand the issue.
            I am not unable to respond to you so I cannot provide further input.
            Dont ask me to respond to you in any type of way.`;

            promptChatGpt(prompt).then((val) => {
                const response = val.choices[0].message.content;
                console.log(response);
                if (response === null) {
                    console.log("response was null");
                    return;
                }
                console.log("runtime response");
                const messageToWebview = {
                    type: 5,
                    message: response
                };
                if(this._view) {
                    this._view.webview.postMessage(messageToWebview);
                }
                else {
                    console.log("Cannot find webview.");
                }
            });
        }
        else {
            console.log("Cannot find editor.");
        }
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
            <div id="logic-error-container" class="error-container"></div>

            <script src="${scriptUri}"></script>
                
        </body>
        </html>`;

        return webviewHtml;
    }
}
