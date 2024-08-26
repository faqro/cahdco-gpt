

const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')

const officeParser = require('officeparser')

const { OpenAI } = require('openai')
const openai = new OpenAI({ apiKey: openAiKey })

app.use(cors())
app.use(express.json())



app.get('/main', async(req, res) => {
    const parsedDocument = await officeParser.parseOfficeAsync('docs/document.docx')
    console.log(`Parsed ${parsedDocument.length} characters in document`)

    console.log('Generating response')
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                "role": "system",
                "content": `answer the user's questions using the information below:\n${parsedDocument}`
            },
            {
                "role": "user",
                "content": req.body.message
            }
        ]
    })
    console.log('Returned LLM response')

    return res.status(200).json(completion.choices[0].message)
})

module.exports = app