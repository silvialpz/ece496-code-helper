"use strict";
// import { Configuration, OpenAIApi } from "openai";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainTest = void 0;
// const configuration = new Configuration({
// 	organization: "org-oDtDeqiXBOuyvDSjIV0FJUFt",
// 	apiKey: "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",
// });
// const openai = new OpenAIApi(configuration);
// const response = await openai.listEngines();
const openai_1 = require("openai");
const openai = new openai_1.default({
    apiKey: "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",
});
async function mainTest() {
    console.log("Contacting ChatGPT.");
    const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say this is a test' }],
    });
    console.log(completion.choices);
}
exports.mainTest = mainTest;
//# sourceMappingURL=openai_config.js.map