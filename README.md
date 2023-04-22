# dbdev-langchain-test

「第 41 回 PostgreSQL アンカンファレンス @ オンライン」 LT 発表用のサンプルです。

[dbdev](https://database.dev/) より、[embedding_search](https://database.dev/langchain/embedding_search) を試してみます。

## Supabase プロジェクト

SQL Editor で実行します。

### dbdev 準備

- https://database.dev/installer

```SQL(1)
create extension if not exists http with schema extensions;
create extension if not exists pg_tle;
select pgtle.uninstall_extension_if_exists('supabase-dbdev');
drop extension if exists "supabase-dbdev";
select
    pgtle.install_extension(
        'supabase-dbdev',
        resp.contents ->> 'version',
        'PostgreSQL package manager',
        resp.contents ->> 'sql'
    )
from http(
    (
        'GET',
        'https://api.database.dev/rest/v1/'
        || 'package_versions?select=sql,version'
        || '&package_name=eq.supabase-dbdev'
        || '&order=version.desc'
        || '&limit=1',
        array[
            ('apiKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s')::http_header
        ],
        null,
        null
    )
) x,
lateral (
    select
        ((row_to_json(x) -> 'content') #>> '{}')::json -> 0
) resp(contents);
create extension "supabase-dbdev";
select dbdev.install('supabase-dbdev');
drop extension if exists "supabase-dbdev";
create extension "supabase-dbdev";
```

### pgvector 有効化

```SQL(2)
create extension if not exists vector;
```

### embedding_search 有効化

- https://database.dev/langchain/embedding_search

```SQL(3)
select dbdev.install('langchain-embedding_search');
create extension "langchain-embedding_search"
    version '1.0.0';
```

- ここで`documents`というテーブル（vector store）と`match_documents`というストアドファンクションが生成される
- `documents`テーブルは RLS 無効状態で生成されるので注意（それにあわせて、このサンプルでは anon key で Supabase に接続している）

### URL と anon key を確認

API Setting で確認しておきます。

## OpenAI API key を取得

OpenAI の API key を発行し、確認します。

- https://platform.openai.com/account/api-keys

## サンプル Web API

`npm install`後、`.env`に Supabase のプロジェクト URL / anon key と OpenAI の API key を記述してください。

```.env
VITE_SUPABASE_URL=【SupabaseのプロジェクトURL】
VITE_SUPABASE_ANON_KEY=【Supabaseのプロジェクトanon key】
VITE_OPENAI_KEY=【OpenAIのAPI key】
```

### 検索対象ドキュメント追加

```ドキュメント追加
curl -X POST -H 'Content-Type: application/json; charset=UTF-8' http://localhost:【起動ポート番号】 -d '{"contents":【ドキュメント配列】, "metadata":【メタデータ配列】}'
```

- 入力値チェックなどは実装していないので注意（ドキュメント配列の要素数とメタデータ配列の要素数は一致させる）

### 検索


```検索
curl http://localhost:【起動ポート番号】/【検索キーワード】
```

### 参考

- https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/supabase
