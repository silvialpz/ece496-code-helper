import * as vscode from 'vscode';
import { exec, execFile } from 'child_process';

export class CError {
    public line: number;
    public charindex: number;
    public func: string;
    public errormsg: string;
    public linetext: string;

    constructor(line: number, charindex: number, func:string, errormsg: string, linetext: string) {
        this.line = line;
        this.charindex = charindex;
        this.func = func;
        this.errormsg = errormsg;
        this.linetext = linetext;
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

    let errors: CError[] = [];
    let linesIndex = 0;
    let currline: string;
    let line: number = -1;
    let charindex: number = -1;
    let func: string = "";
    let errormsg: string = "";
    let linetext: string = "";

    while(linesIndex < lines.length) {
        // Find the "in function 'function name'" line
        while((!lines[linesIndex].includes(filePath) ||
               lines[linesIndex].includes("note:")) &&
              (!lines[linesIndex].includes("function") ||
               !lines[linesIndex].includes("error:"))) {
            linesIndex++;
            if(linesIndex >= lines.length) { return errors; }
        }
        if(linesIndex >= lines.length) { return errors; }

        // Get rid of the file path at start of line
        currline = lines[linesIndex].slice(filePath.length);
        if(currline.includes("function") &&
           !currline.includes("error:") &&
           !currline.includes("note:")) {
            // Function name is contained in single quotations
            // Use split to pick it out
            let currlinesplit = currline.split("'");
            if(currlinesplit.length < 3) {
                // Should be at least 3 elements after the split
                // since at least 2 single quotation marks are expected
                console.log("oh no!");
                return {type: 0, message: "errorcantfindfunc", content: null};
            }

            // Function name after the first single quotation
            func = currlinesplit[1];
            linesIndex++;
        }
        else if (!currline.includes("error:")) {
            console.log("cond 1");
            continue;
        }

        if(linesIndex >= lines.length) { return errors; }

        // Get the line and character reported by gcc
        // Also get the error message if its on this line
        if(lines[linesIndex].includes(filePath)) {
            // Get rid of the file path at start of line
            currline = lines[linesIndex].slice(filePath.length);

            // Error line and charindex separated by :
            let currlinesplit = currline.split(":");
            line = parseInt(currlinesplit[1]);
            charindex = parseInt(currlinesplit[2]);

            // Locate error text by anchoring to "error:"
            let index = currline.indexOf("error:");
            if(index === -1) {
                console.log("cond 2");
                continue;
            }
            currline = currline.slice(index + 6).trim();
            errormsg = currline;
            linesIndex++;
        }
        else {
            console.log("cond 3");
            continue;
        }


        if(linesIndex >= lines.length) { return errors; }

        // Get text of offending line
        if(lines[linesIndex].includes("|")) {
            let index = lines[linesIndex].indexOf("|");
            currline = lines[linesIndex].slice(index + 1);
            linetext = currline.trim();
            linesIndex++;
        }
        else {
            console.log("cond 4");
            console.log(lines[linesIndex]);
            continue;
        }
        
        // Create new CError and append to errors list
        errors.push(new CError(line, charindex, func, errormsg, linetext));
    }

    return errors;
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
    let prom: Promise<{ type: number, message: string, content: CError[] }> = new Promise((resolve) => {
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