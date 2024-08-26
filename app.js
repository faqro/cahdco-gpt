import path from 'path'
import fs from 'fs'
import express from 'express'
import 'express-async-errors'
const app = express()
import cors from 'cors'
import 'dotenv/config'

import { RAGApplicationBuilder, DocxLoader, OpenAi, PdfLoader, ExcelLoader, PptLoader, CsvLoader } from '@llm-tools/embedjs'
import { DocLoader } from './customloaders/doc-loader.js'
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
            try {
                if(fileType === "docx") {
                    result.addLoader(new DocxLoader({filePathOrUrl: fileDir}))
                } else if(fileType === "doc") {
                    result.addLoader(new DocLoader({filePathOrUrl: fileDir}))
                } else if(fileType === "pdf") {
                    result.addLoader(new PdfLoader({filePathOrUrl: fileDir}))
                } else if(fileType === "xlsx") {
                    result.addLoader(new ExcelLoader({filePathOrUrl: fileDir}))
                } else if(fileType === "pptx") {
                    result.addLoader(new PptLoader({filePathOrUrl: fileDir}))
                } else if(fileType === "csv") {
                    result.addLoader(new CsvLoader({filePathOrUrl: fileDir}))
                } else {
                    unmappedFiles = unmappedFiles.concat(fileDir)
                }
            } catch(err) {
                console.log(`error on \"${fileDir}\"`, err)
                unmappedFiles = unmappedFiles.concat(fileDir)
            }

            //Add support for .JSON, .TXT, .HTML/HTM, .PPT, .RTF, .XLS, .MD
        })

        console.log(`Mapped ${filesToLoop.length - unmappedFiles.length} files`)
        console.log(`${unmappedFiles.length} unmapped files`, unmappedFiles)

        ragApplication = result
    })

const addLoadersRecursive = (dir) => {
    let files = []
    const addLoaders = (dir) => {
        fs.readdirSync(dir).forEach(File => {
            const Absolute = path.join(dir, File)
            if (fs.statSync(Absolute).isDirectory()) return addLoaders(Absolute)
            else return files.push(Absolute)
        })
        return files
    }
    const filesOut = addLoaders(dir).map(fileDir => ({fileDir, fileType: fileDir.split('.').pop().toLowerCase() }))
    return filesOut
}

app.delete('/vector', async(req, res) => {
    try {
        ragApplication.deleteAllEmbeddings(true)
        return res.sendStatus(200)
    } catch (e) {
        console.log(e)
        return res.sendStatus(500)
    }

})

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