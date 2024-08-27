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
const FORCE_REEMBED = false

let ragApplication = null
new RAGApplicationBuilder()
    .setModel(new OpenAi({ modelName: 'gpt-4o-mini' }))
    .setVectorDb(new LanceDb({ path: path.resolve('lancedb') }))
    .setSearchResultCount(5)
    .build()
    .then(async(result) => {
        if(!FORCE_REEMBED) {
            ragApplication = result
            console.log('Started RAG without re-embed')
            return null
        }
        
        const filesToLoop = addLoadersRecursive(DOCUMENT_DIRECTORY)
        let unmappedFiles = []

        
        console.log(`Created ${Math.ceil(filesToLoop.length/100)} file blocks`)
        for(let i=0; i<Math.ceil(filesToLoop.length/100); i++) {
            const fileGroup = filesToLoop.slice(i*100, Math.min(((i+1)*100), filesToLoop.length))
            console.log(`Embedding file group ${i}`)

            await Promise.all(fileGroup.map(async({fileType, fileDir}) => {

                try {
                    if(fileType === "docx") {
                        await result.addLoader(new DocxLoader({filePathOrUrl: fileDir}))
                    } else if(fileType === "doc") {
                        await result.addLoader(new DocLoader({filePathOrUrl: fileDir}))
                    } else if(fileType === "pdf") {
                        await result.addLoader(new PdfLoader({filePathOrUrl: fileDir}))
                    } else if(fileType === "xlsx") {
                        await result.addLoader(new ExcelLoader({filePathOrUrl: fileDir}))
                    } else if(fileType === "pptx") {
                        await result.addLoader(new PptLoader({filePathOrUrl: fileDir}))
                    } else if(fileType === "csv") {
                        await result.addLoader(new CsvLoader({filePathOrUrl: fileDir}))
                    } else {
                        unmappedFiles = unmappedFiles.concat(fileDir)
                    }
                } catch(err) {
                    console.log(`\n\nError on \"${fileDir}\":\n${err}`)
                    unmappedFiles = unmappedFiles.concat(fileDir)
                }

                //Add support for .JSON, .TXT, .HTML/HTM, .PPT, .RTF, .XLS, .MD
            }))
        }

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

const getDirRelative = (dir) => {
    let currentDir = path.dirname(dir)
    let relativeDir = path.basename(dir)

    while (path.relative(currentDir, DOCUMENT_DIRECTORY) !== '' && currentDir !== '.' && currentDir !== '') {
        relativeDir = `${path.basename(currentDir)}\\${relativeDir}`
        currentDir = path.dirname(currentDir)
    }
    return relativeDir
}

app.get('/files', (req, res) => {
    if(req.query && req.query.item) {
        const fileLocation = path.join(path.resolve(DOCUMENT_DIRECTORY), req.query.item)

        try {
            let fileIsDir = fs.lstatSync(fileLocation).isDirectory()

            if(fileIsDir) {
                return res.sendStatus(400)
            } else {
                return res.sendFile(path.resolve(fileLocation))
            }
        } catch(e) {
            if(e.code == 'ENOENT') {
                return res.sendStatus(404)
            } else {
                console.log(e)
                return res.sendStatus(500)
            }
        }
    } else {
        return res.sendStatus(404)
    }
})

app.post('/rag', async(req, res) => {
    if(ragApplication == null) {
        return res.sendStatus(425)
    }

    if(!(req.body && req.body.message && req.body.message.length>2)) {
        return res.sendStatus(400)
    }

    try {
        const response = await ragApplication.query(req.body.message)

        return res.status(200).json({
            message: response.content,
            referenceDocs: response.sources.map(sourceDoc => getDirRelative(sourceDoc.source))
        })
    } catch (err) {
        return res.status(500).json(err)
    }
})

app.use(express.static('static'))

export {app}