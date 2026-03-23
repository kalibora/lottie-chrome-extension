# lottie-chrome-extension

Lottie ファイルをブラウザでプレビューするための Chrome 拡張。

## 機能

- `*.json` URL を開いたとき、Lottie JSON なら再生ビューを表示
- `Animation` / `JSON` の表示切替
- 再生・一時停止、ループON/OFF、再生速度変更
- 背景色プリセットの切替（Dark / Light / Checker）
- 表示モードと背景設定を `chrome.storage.sync` に保存

## 使い方

1. Chromeで `chrome://extensions` を開く
2. `デベロッパーモード` を ON にする
3. `パッケージ化されていない拡張機能を読み込む` でこのディレクトリを選択
4. `https://.../*.json` を開く
5. 右上の `Animation` / `JSON` ボタンで表示を切り替える

## 開発メモ

- Lottie判定は `v`, `fr`, `ip`, `op`, `layers` の存在で実施
- Lottie以外のJSONは拡張が介入せず通常表示のまま
