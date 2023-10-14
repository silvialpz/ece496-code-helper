"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBuddyProvider = void 0;
const openai_1 = require("openai");
class CodeBuddyProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.openAITest();
        console.log("in constructor");
    }
    getTreeItem(element) {
        this.openAITest();
        console.log("in getTreeItem");
        return element;
    }
    getChildren(element) {
        return Promise.resolve([]);
    }
    async openAITest() {
        const openai = new openai_1.default({
            apiKey: this.apiKey,
        });
        console.log("Contacting ChatGPT.");
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Say this is a test' }],
        });
        console.log(completion.choices[0].message.content);
    }
}
exports.CodeBuddyProvider = CodeBuddyProvider;
//# sourceMappingURL=codeBuddy.js.map