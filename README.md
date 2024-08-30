# CahdcoGPT
 
RAG LLM processing tool for enterprise documentation
Designed for [[cahdco.org]]

Simple question/answering from a limited dataset

Built by Faiz Jan and Faraaz Jan
Using LanceDB and EmbedJS

NOTE: An OpenAI API key is needed for this project. This can be done for free at openai.com

## Instructions
1. Run `npm install`
2. Create a file called `.env` in the main directory with `OPENAI_API_KEY=[insert api key]`
3. Place relevant documents to add to RAG in a `docs` folder in the main directory
4. Set "FORCE_REEMBED" to "TRUE"
5. Put OpenAI API Key in `.env` file in main directory
6. Run `npm start`
