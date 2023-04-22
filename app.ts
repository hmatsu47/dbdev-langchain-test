import express from "express";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createClient } from "@supabase/supabase-js";
import { Embeddings } from "langchain/dist/embeddings/base";

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseKey) throw new Error(`VITE_SUPABASE_ANON_KEYが見つかりません`);
const url = import.meta.env.VITE_SUPABASE_URL;
if (!url) throw new Error(`VITE_SUPABASE_URLが見つかりません`);

const supabaseClient = createClient(url, supabaseKey);

// 検索
const search = async (keyword: string, count: number) => {
  const vectorStore = await SupabaseVectorStore.fromExistingIndex(
    new OpenAIEmbeddings({
      openAIApiKey: import.meta.env.VITE_OPENAI_KEY,
    }),
    {
      client: supabaseClient,
      tableName: "documents",
      queryName: "match_documents",
    }
  );
  const results = await vectorStore.similaritySearch(keyword, count);
  return results;
};

// ドキュメント追加
const postDocuments = async (body: { contents: string[]; metadata: Embeddings; }) => {
  await SupabaseVectorStore.fromTexts(
    body.contents,
    body.metadata,
    new OpenAIEmbeddings({
      openAIApiKey: import.meta.env.VITE_OPENAI_KEY,
    }),
    {
      client: supabaseClient,
      tableName: "documents",
      queryName: "match_documents",
    }
  );
  const results = {
    message: "OK"
  }
  return results;
}

// Express で Web API を起動
const app = express();

app.use(express.json());

app.get("/:keyword/:count", async (req, res) => {
  res.json(await search(req.params.keyword, Number(req.params.count)));
});

app.post("/", async (req, res) => {
  const body = req.body;
  const results = await postDocuments(body);
  res.json(results);
});

export const viteNodeApp = app;