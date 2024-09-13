(function() {
    const vscode = acquireVsCodeApi();

    // Add click event listener to check compile error button
    const compileButton = document.getElementById("compile-button");
    compileButton.addEventListener("click", compile);

    // Add click event listener to check runtime error button
    const runtimeButton = document.getElementById("runtime-button");
    runtimeButton.addEventListener("click", checkRuntime);

    // Callbacks when check compile/runtime buttons clicked
    function compile() {
        vscode.postMessage({ command: "compile" });
    }
    function checkRuntime() {
        vscode.postMessage({ command: "runtime" });
    }

    window.addEventListener('message', handleMessages);

    function handleMessages(event) {
        let data = event.data;
        let msgtype = parseInt(data.type);

        switch(msgtype) {
            case 0:
                // Other cases like errors or compilation succeeded will fall here
                handleOther(data);
                break;
            case 1:
                // Message Type 1: Compilation results (BIG CHECK COMPILE ERRORS BUTTON)
                handleCompileErrors(data);
                break;
            case 2:
                // Message Type 2: ChatGPT response (Little '?' button)
                handleChatGptResponseCompile(data);
                break;
            case 3:
                handleRuntimeErrors(data);
                break;
            case 4:
                handleChatGptResponseRuntime(data);
                break;
            case 5:
                handleChatGptLogicResponse(data);
                break;
            default:
                handleDefaultError();
                break;
        }
    }

    function handleOther(data) {
        switch(data.message) {
            case "compilesuccess":
                // 0: compilation succeeded
                const d = document.getElementById("compile-error-container");
                const msg = document.createElement("p");
                msg.innerText = "No compilation errors.";
                d.innerHTML = "";
                d.append(msg);
                break;
            case "runtimesuccess":
                const r = document.getElementById("runtime-error-container");
                const rmsg = document.createElement("p");
                rmsg.innerText = "No runtime errors.";
                r.innerHTML = "";
                r.append(rmsg);
                break;
            default:
                break;
        }
    }

    function createErrorItem(error, index, container, type) {
        // Type == 0 for compile, 1 for runtime
        const errorItemContainer = document.createElement("div");
        const errorItemContainerInner = document.createElement("div");
        const errorItemContent = document.createElement("p");
        const button = document.createElement("button");
        const spinner = document.createElement("div");

        errorItemContainer.className = "compile-error-item";
        errorItemContainerInner.className = "compile-error-item-inner";
        // Give it a unique id so its addressable later
        errorItemContainer.id = type ? `runtime-error-id-${index}` : `compile-error-id-${index}`;

        errorItemContent.innerText = `${error.errormsg}\n\n(Occured on line ${error.line})`;
        button.innerText = "?";
        button.addEventListener("click", () => {
            document.getElementById(`loadingSpinner-${index}`).style.display = "block";
            vscode.postMessage({
                command: type ? "explain-runtime-error" : "explain-compile-error",
                index: index
            });
        });
        spinner.className = "loading-spinner";
        spinner.id = `loadingSpinner-${index}`;
        spinner.style = "display: none;";
        errorItemContainerInner.append(errorItemContent);
        errorItemContainerInner.append(button);
        errorItemContainer.append(errorItemContainerInner);
        errorItemContainer.append(spinner);
        container.append(errorItemContainer);
    }

    function handleCompileErrors(data) {
        // We are handling compile time errors so clear the runtime
        // error container
        const runtimeContainer = document.getElementById("runtime-error-container");
        runtimeContainer.innerHTML = "";

        const d = document.getElementById("compile-error-container");
        // Remove all children
        d.innerHTML = "";

        if(data.content.length === 0) {
            // There were no compile time errors
            // Can print a compile succeeded message probably
            return;
        }

        const compileHeader = document.createElement("h1");
        compileHeader.className = "section-header";
        compileHeader.innerText = "Compile Errors";
        d.append(compileHeader);

        const errorCount = document.createElement("p");
        errorCount.innerText = `Found ${data.content.length} compile time errors.`;
        d.append(errorCount);

        data.content.forEach((error, index) => {
            createErrorItem(error, index, d, 0);
            // Stop at third error
            if (index === 2) { return; }
        });

        //document.body.append(d);
    }

    function handleChatGptResponseCompile(data) {
        // Get the selection from the error container using data.index
        const selection = document.getElementById(`compile-error-id-${data.index}`);
        
        // Hide the button 
        selection.querySelector("button").style.display = "none";

        // hide the spinner 
        document.getElementById(`loadingSpinner-${data.index}`).style.display = "none";

        selection.classList.add("answered");

        const chatResponse = document.createElement("p");
        chatResponse.className = "ai-explanation";
        chatResponse.innerText = data.message;
        
        selection.appendChild(chatResponse);
    }

    function handleRuntimeErrors(data) {
        const d = document.getElementById("runtime-error-container");
        // Clear
        d.innerHTML = "";

        const runtimeHeader = document.createElement("h1");
        runtimeHeader.className = "section-header";
        runtimeHeader.innerText = "Runtime Errors";
        d.append(runtimeHeader);

        const errorCount = document.createElement("p");
        errorCount.innerText = `Found ${data.content.length} potential runtime errors.`;
        d.append(errorCount);

        // const test = document.createElement("p");
        // test.innerText = `${data.message}`;
        // d.append(test);

        data.content.forEach((error, index) => {
            createErrorItem(error, index, d, 1);
            if(index === 2) { return; }
        });
    }

    function handleChatGptResponseRuntime(data) {
        // Get the selection from the error container using data.index
        const selection = document.getElementById(`runtime-error-id-${data.index}`);
        
        // Hide the button 
        selection.querySelector("button").style.display = "none";

        // remove all of the other childern in the container
        // ^ Why??
        // const container = document.getElementById("compile-error-container");
        // container.innerHTML = "";

        const chatResponse = document.createElement("p");
        chatResponse.innerText = data.message;
        
        selection.appendChild(chatResponse);
    }

    function handleChatGptLogicResponse(data) {
        const d = document.getElementById("logic-error-container");
        d.innerHTML = "";

        const logicHeader = document.createElement("h1");
        logicHeader.className = "section-header";
        logicHeader.innerText = "Logic Errors";
        d.append(logicHeader);

        const logicContent = document.createElement("p");
        logicContent.innerHTML = `${data.message}`;

        d.append(logicContent);
    }
 
    function handleDefaultError() {
        const q = document.createElement("p");
        q.innerText = "ERROR: hit default statement in main.js";
        document.body.append(q);
    }
}());
