# CLAUDE.md — NODIA Webアプリ開発テンプレート（ソロ開発用）

> ⚠️ セッション開始時に毎回自動読み込みされます
> ⚠️ 200行以内を維持すること（コンテキスト節約のため）

---

## 1. プロジェクト概要

```
# ← ここだけプロジェクトごとに書き換える

プロジェクト名: [例: 人事段位チェック v2]
目的:         [例: リード獲得用の人事知識テストツール]
対象ユーザー: [例: 人事担当者]
公開形態:     [例: 静的HTML / Webサービス / 社内ツール]
```

---

## 2. 技術スタック

```
# 固定（変更時はここを書き換え）
言語:       HTML5 / CSS3 / Vanilla JavaScript (ES2022+)
モジュール:  ES modules（import/export）
スタイル:   CSSカスタムプロパティ（変数）を使う
外部依存:   原則なし（CDNも最小限）
```

---

## 3. フォルダ構成

```
[project-root]/
├── CLAUDE.md         # このファイル
├── SPEC.md           # 機能仕様書（実装前に必ず作成）
├── index.html        # エントリーポイント
├── css/
│   └── style.css
├── js/
│   └── main.js
├── assets/           # 画像・フォントなど
└── docs/             # 参照ドキュメント
    ├── NODIA_notation_rules.md
    ├── NODIA_ng_words.md
    └── NODIA_corporate_info.md
    └── BRAND_GUIDE.md
    └── logo.png
```

---

## 4. 必須ルール（MUST）

```
# 実装前
- MUST: 実装前にSPEC.mdを確認すること（なければ先に作る）
- MUST: 「何をどの順序で作るか」を日本語で提示してから着手すること
- MUST: 不明点は勝手に判断せず、質問すること

# 実装中
- MUST: 1機能ずつ実装 → ブラウザ確認 → 次へ、の順で進めること
- MUST: コメントを日本語で書くこと（変数名・関数名は英語）
- MUST: エラーが3回続いたら別アプローチを提案すること

# セキュリティ
- MUST NOT: APIキー・パスワードをコードに直書きしないこと
- MUST NOT: ユーザー確認なしにファイルを削除しないこと
- MUST NOT: 外部APIリクエストを確認なしに実行しないこと
```

---

## 5. コードスタイル

```
# HTML
- セマンティックタグを使う（div乱用禁止）
- 画像には必ずalt属性を付ける

# CSS
- クラス名: BEM記法（block__element--modifier）
- 色・フォントはCSS変数で管理（:root に定義）
- モバイルファースト（min-widthのメディアクエリ）

# JavaScript
- async/await を使う（callbackは使わない）
- console.logはデバッグ後に削除
- エラーは必ずtry/catchで処理
- DOMセレクタはidよりdata-*属性を優先
```

---

## 6. NODIAブランドルール（頻出のみ）

```
# 詳細は @docs/NODIA_notation_rules.md / @docs/NODIA_ng_words.md / @docs/BRAND_GUIDE.md を参照

正式表記:
  NODIA（Nodia / nodia は禁止）
  AIキャリアインタビュー（スペースなし）
  Intevia（先頭大文字のみ）
  キャリア自律（「自立」は誤字）
  AI / LLM / API（常に半角大文字）

ブランドカラー（CSSでそのまま使える）:
  --color-main:    #2C3E50;
  --color-accent:  #2D8B92;
  --color-text:    #4A4A4A;
  --color-base:    #FFFFFF;
```

---

## 7. ゼロから作るときのワークフロー

```
【STEP 1】仕様を固める（実装前に必ず）
  → 「SPEC.mdを作りたい。インタビューして」と指示する
  → 質問に答えてSPEC.mdが完成したら新セッションを開始

【STEP 2】土台を作る
  → 「SPEC.mdを読んでHTML/CSS/JSの土台を作って」
  → フォルダ構成・index.html・空のCSS/JSを生成

【STEP 3】機能を1つずつ実装
  → 「〇〇機能を実装して」と1つずつ依頼
  → ブラウザで確認 → OKなら次へ

【STEP 4】仕上げ
  → 「NODIAブランドガイドに合わせてデザインを整えて」
  → @docs/BRAND_GUIDE.md を渡して調整
```

---

## 8. よく使うClaude Codeコマンド

```
/clear      # コンテキストをリセット（長くなったら実行）
/status     # コンテキスト使用量を確認（80%超えたら/clear）
/compact    # コンテキストを圧縮
/rewind     # 直前の変更を取り消し
```

---

## 9. 重い情報は都度 @-file で渡す（CLAUDE.mdには書かない）

```
@SPEC.md                       # 機能仕様（実装時）
@docs/NODIA_corporate_info.md     # テキスト調整時
@docs/BRAND_GUIDE.md           # デザイン調整時
@docs/NODIA_notation_rules.md  # テキスト修正時
@docs/NODIA_ng_words.md        # テキスト修正時
```

---

> 📌 新プロジェクト開始時のチェックリスト
> [ ] セクション1のプロジェクト概要を書き換えた
> [ ] SPEC.mdを作った（または作成を依頼した）
> [ ] docs/フォルダにブランドファイルを配置した
> [ ] .gitignore に .env を追加した

