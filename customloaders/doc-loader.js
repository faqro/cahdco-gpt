import { BaseLoader } from '@llm-tools/embedjs';
import WordExtractor from 'word-extractor'
import md5 from 'md5'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
const extractor = new WordExtractor()

function cleanString(text) {
    text = text.replace(/\\/g, '');
    text = text.replace(/#/g, ' ');
    text = text.replace(/\. \./g, '.');
    text = text.replace(/\s\s+/g, ' ');
    text = text.replace(/(\r\n|\n|\r)/gm, ' ');

    return text.trim();
}

export class DocLoader extends BaseLoader {
    constructor({
        filePathOrUrl,
        chunkOverlap,
        chunkSize,
    }) {
        super(`DocLoader_${md5(filePathOrUrl)}`, { filePathOrUrl }, chunkSize ?? 1000, chunkOverlap ?? 0);

        this.filePathOrUrl = filePathOrUrl;
        this.isUrl = false;
    }

    async *getChunks() {
        const chunker = new RecursiveCharacterTextSplitter({
            chunkSize: this.chunkSize,
            chunkOverlap: this.chunkOverlap,
        });

        const doc = await extractor.extract(this.filePathOrUrl)

        let docText = cleanString(doc.getBody())
        if(doc.getFootnotes()) docText = `${docText}\n${cleanString(doc.getFootnotes())}`
        if(doc.getEndnotes()) docText = `${docText}\n${cleanString(doc.getEndnotes())}`
        if(doc.getHeaders()) docText = `${cleanString(doc.getHeaders())}\n${docText}`
        if(doc.getFooters()) docText = `${docText}\n${cleanString(doc.getFooters())}`

        const chunks = await chunker.splitText(docText)
        
        for (const chunk of chunks) {
            yield {
                pageContent: chunk,
                metadata: {
                    type: 'DocLoader',
                    source: this.filePathOrUrl
                }
            }
        }
    }
}