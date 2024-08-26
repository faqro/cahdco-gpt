import path from 'path'
import fs from 'fs'
import express from 'express'
import 'express-async-errors'
const app = express()
import cors from 'cors'
import 'dotenv/config'

import { RAGApplicationBuilder, DocxLoader, OpenAi, PdfLoader, ExcelLoader, PptLoader } from '@llm-tools/embedjs'
import { LanceDb } from '@llm-tools/embedjs/vectorDb/lance'

app.use(cors())
app.use(express.json())

const DOCUMENT_DIRECTORY = "docs"

let ragApplication = null
new RAGApplicationBuilder()
    .setModel(new OpenAi({ modelName: 'gpt-4o-mini' }))
    .setVectorDb(new LanceDb({ path: path.resolve('lancedb') }))
    .setSearchResultCount(5)
    .build()
    .then(async(result) => {
        const filesToLoop = addLoadersRecursive(DOCUMENT_DIRECTORY)
        let unmappedFiles = []

        filesToLoop.forEach(({fileDir, fileType}) => {
            if(fileType === "docx") {
                result.addLoader(new DocxLoader({filePathOrUrl: fileDir}))
            } else if(fileType === "pdf") {
                result.addLoader(new PdfLoader({filePathOrUrl: fileDir}))
            } else if(fileType === "xlsx") {
                result.addLoader(new ExcelLoader({filePathOrUrl: fileDir}))
            } else if(fileType === "pptx") {
                result.addLoader(new PptLoader({filePathOrUrl: fileDir}))
            } else {
                unmappedFiles = unmappedFiles.concat(fileDir)
            }
        })

        console.log(`Mapped ${filesToLoop.length - unmappedFiles.length} files`)
        console.log(`${unmappedFiles.length} unmapped files`, unmappedFiles)

        ragApplication = result
    })

const addLoadersRecursive = (dir) => {
    let files = []
    fs.readdirSync(dir).forEach(File => {
        const Absolute = path.join(dir, File)
        if (fs.statSync(Absolute).isDirectory()) return addLoadersRecursive(Absolute)
        else return files.push(Absolute)
    })
    return files.map(fileDir => ({fileDir, fileType: fileDir.split('.').pop().toLowerCase() }))
}


app.get('/rag', async(req, res) => {
    if(ragApplication == null) {
        return res.sendStatus(425)
    }

    try {
        const response = await ragApplication.query(req.body.message)

        return res.status(200).json(response)
    } catch (err) {
        return res.status(500).json(err)
    }
})

export {app}