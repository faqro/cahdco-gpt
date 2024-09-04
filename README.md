# CahdcoGPT
 
RAG LLM processing tool for enterprise documentation
Designed for cahdco.org

Simple question/answering from a limited dataset

Built by Faiz Jan and Faraaz Jan

Using LanceDB and EmbedJS

Frontend @ https://github.com/faqro/cahdco-gpt-frontend

NOTE: An OpenAI API key is needed for this project. This can be done for free at openai.com

NOTE: Node.JS is required for this project.

## Instructions
1. Run `npm install` from the main directory
2. Create a file called `.env` in the main directory with `OPENAI_API_KEY=[insert api key]` (you can get the key from https://platform.openai.com/)
3. Place relevant documents to add to RAG in a `docs` folder in the main directory (These are the .pdf, .docx, .doc, .xlsx, .pptx, etc documents that you want to use for Q/A)
4. Set "FORCE_REEMBED" to "TRUE" (This is only necessary on the first run + when updating the documents in the `docs` folder, and should be turned off after you've done this once for the given documents)
5. Put OpenAI API Key in `.env` file in main directory
6. Run `npm start`
7. To access CahdcoGPT, go to http://localhost:3001 in your browser. Note that on the first run, you will have to wait a couple minutes for document RAG embedding. Trying to use Q/A before embedding is completed will lead to a "an error occurred" message.

## Known Issues
- Some files fail to embed, even after multiple attempts. This is likely an issue with the vector database used (LanceDB), and can most likely be fixed by switching to a hosted database such as MongoDB. This is sometimes fixed by deleting the `lancedb` folder in the main directory and reembedding the documents.
- CahdcoGPT doesn't have memory of past conversations. This isn't a bug, but just something that hasn't been implemeneted yet.
- "An error occurred" when talking to the LLM. This is not a bug, this occurs when talking to the LLM before it has finished reembedding (this can take a couple minutes). If this is not your first time running the LLM, you may have forgotten to change the "FORCE_REEMBED" variable back to "FALSE".

## Potential Future Changes
- Host the project on a server/on a web service to prevent unnecessary computer usage/having to embed the documents on every computer locally
- Switch to MongoDB from LanceDB
- Implement support for .txt, .csv, and .html files
