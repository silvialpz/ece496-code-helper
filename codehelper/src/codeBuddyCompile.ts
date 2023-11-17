import * as vscode from 'vscode';
import { exec, execFile } from 'child_process';

export class CError {
    public line: number;
    public charindex: number;
    public func: string;
    public errormsg: string;

    constructor(line: number, charindex: number, func:string, errormsg: string) {
        this.line = line;
        this.charindex = charindex;
        this.func = func;
        this.errormsg = errormsg;
    }
}

function cParse(data: string, filePath: string) {
    // Some error checking
    if(!data) {
        return {type: 0, message: "errorempty", content: null};
    }
    if(!filePath) {
        return {type: 0, message: "errorpathnotpassed", content: null};
    }

    let lines: string[] = data.split("\n");
    if(lines.length === 1) {
        return {type: 0, message: "erroroneline", content: null};
    }

    // The first line isn't from gcc output, so we don't need it
    lines = lines.slice(1);

    let linesIndex = 0;
    let currline: string;
    let line: number = -1;
    let charindex: number = -1;
    let func: string = "";
    let errormsg: string = "";

    // Find the "in function 'function name'" line
    if(lines[linesIndex].includes(filePath)) {
        currline = lines[linesIndex].slice(filePath.length);
        if(currline.includes("function")) {
            let currlinesplit = currline.split("'");
            if(currlinesplit.length < 3) {
                console.log("oh no!");
                return {type: 0, message: "errorcantfindfunc", content: null};
            }
            func = currlinesplit[1];
            linesIndex++;
        }
    }
    // Get the line and character reported by gcc
    // Also get the error message if its on this line
    if(lines[linesIndex].includes(filePath)) {
        currline = lines[linesIndex].slice(filePath.length);
        let currlinesplit = currline.split(":");
        line = parseInt(currlinesplit[1]);
        charindex = parseInt(currlinesplit[2]);

        let index = currline.indexOf("error:");
        if(index === -1) {
            console.log("noo!");
            return {type: 0, message: "errorcantfinderror", content: null};
        }
        currline = currline.slice(index + 6).trim();
        errormsg = currline;
    }

    // ARID: please change this so that it returns a list of the errors you find.
    return [new CError(line, charindex, func, errormsg)];
}

export function cCompile(compilePath: string, inPath: string, outPath: string) {
    let cwd: string = "";
    let currentFile: string = "";
    let out: string = "";

    // gcc args like -Wall, -g -O0, etc.
    let args: string[] = ["-Wall", "-Werror"];

    // Get the path of root folder of the currently open project
    // Produce an error if no folder is open
    if(vscode.workspace.workspaceFolders) {
        cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    else {
        vscode.window.showErrorMessage("ERROR: No folders detected in workspace.");
        return {type: 0, message: "nofolder", content: null};
    }

    // Get the path of the currently open file, which we will compile
    // Produce an error if no file is open
    if(vscode.window.activeTextEditor?.document.uri.fsPath) {
        currentFile = vscode.window.activeTextEditor.document.uri.fsPath;
    }
    else {
        vscode.window.showErrorMessage("ERROR: No file is currently open.");
        return {type: 0, message: "nofileopen", content: null};
    }

    // If compilation succeeds, output will be root_folder\out.exe
    out = cwd.concat("\\out.exe");

    // console.log(`currentFile: ${currentFile}`);
    // console.log(`cwd: ${cwd}`);

    let parserData: any = 1;

    // Compile with -Wall, we will get back stdout and stderr from the spawned child process
    let prom: Promise<{ type: number, message: string, content: CError }> = new Promise((resolve) => {
        execFile("gcc", [...args, "-o", out, currentFile], (error, stdout, stderr) => {
        if(error) {
            // If we get an error, compilation failed
            // Can perform parsing
            parserData = {type: 1, message: "compilefail", content: cParse(error.message, currentFile)};
            resolve(parserData);
        }
        /*
        console.log("stdout:");
        console.log(stdout);
        console.log("stderr:");
        console.log(stderr);
        */
        });
    });

    return prom;
}