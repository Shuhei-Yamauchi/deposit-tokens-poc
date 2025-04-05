// js/simulation.js

document.addEventListener("DOMContentLoaded", () => {
  // 初期残高
  const INITIAL_BALANCE = 1000;

  // CBS Ledger（オフチェーン）の残高
  let cbs = {
    A: INITIAL_BALANCE,
    B: INITIAL_BALANCE
  };

  // Token Ledger（オンチェーン）の残高
  let token = {
    A: INITIAL_BALANCE,
    B: INITIAL_BALANCE
  };

  // 現在のモード ("backed" or "native")
  let currentMode = "backed";
  let modeLocked = false; // 一度操作したらモードはロック

  // DOM取得
  const modelRadios = document.getElementsByName("model");
  const cbsBalAEl = document.getElementById("cbs-bal-a");
  const cbsBalBEl = document.getElementById("cbs-bal-b");
  const tokenBalAEl = document.getElementById("token-bal-a");
  const tokenBalBEl = document.getElementById("token-bal-b");

  // Deposit関連
  const depositBranchEl = document.getElementById("deposit-branch");
  const depositAmountEl = document.getElementById("deposit-amount");
  const depositBtn = document.getElementById("deposit-btn");

  // Redeem関連
  const redeemBranchEl = document.getElementById("redeem-branch");
  const redeemAmountEl = document.getElementById("redeem-amount");
  const redeemBtn = document.getElementById("redeem-btn");

  // Transfer関連
  const transferSourceEl = document.getElementById("transfer-source");
  const transferDestEl = document.getElementById("transfer-dest");
  const transferAmountEl = document.getElementById("transfer-amount");
  const transferBtn = document.getElementById("transfer-btn");

  const resetBtn = document.getElementById("reset-btn");
  const operationLogEl = document.getElementById("operation-log");

  // 画面表示を更新
  function updateDisplay() {
    // Backedモードの時：CBSとTokenは別々に表示
    // Nativeモードの時：理論上はCBSがない(または同じLedger)想定なので、PoCでは同値にして可視化
    if (currentMode === "native") {
      // Nativeモードは token = official ledger. cbsは参考として同じ値を表示させる
      cbsBalAEl.textContent = token.A.toFixed(2);
      cbsBalBEl.textContent = token.B.toFixed(2);
    } else {
      // Backedモードはそれぞれ別の値を表示
      cbsBalAEl.textContent = cbs.A.toFixed(2);
      cbsBalBEl.textContent = cbs.B.toFixed(2);
    }

    tokenBalAEl.textContent = token.A.toFixed(2);
    tokenBalBEl.textContent = token.B.toFixed(2);
  }

  // ログに出力
  function log(message) {
    const li = document.createElement("li");
    li.textContent = message;
    operationLogEl.appendChild(li);
  }

  // モード選択が変更された時
  modelRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (modeLocked) {
        // ロックされてたら選択無効
        radio.checked = (radio.value === currentMode);
        log("モードは既にロックされています。リセットするまで変更不可。");
      } else {
        currentMode = radio.value;
        log("モードが " + currentMode + " に切り替わりました。");
        updateDisplay();
      }
    });
  });

  // Depositボタン押下
  depositBtn.addEventListener("click", () => {
    const branch = depositBranchEl.value; // "A" or "B"
    const amount = parseFloat(depositAmountEl.value);
    if (amount <= 0 || isNaN(amount)) {
      alert("Deposit金額が不正です");
      return;
    }
    // モードロック
    if (!modeLocked) {
      modeLocked = true;
      modelRadios.forEach(r => r.disabled = true);
      log("初回操作が行われたため、モデル選択をロックしました。");
    }

    if (currentMode === "backed") {
      // Backed:
      // 1) オフチェーン(CBS)の該当支店に預金追加（現金を受け取りロックしたとみなす）
      cbs[branch] += amount;
      // 2) 同額のTokenをMint
      token[branch] += amount;
      log(`[Backed] Deposit: Branch ${branch} に $${amount.toFixed(2)} 入金。CBSに加算 & TokenをMint。`);
    } else {
      // Native:
      // 1) 単一Ledger(token)にMint
      token[branch] += amount;
      // 2) オフチェーン(CBS)はないので参考表示のためだけに同期
      log(`[Native] Deposit: Branch ${branch} に $${amount.toFixed(2)} Mint（オフチェーン不要）。`);
    }
    updateDisplay();
  });

  // Redeemボタン押下
  redeemBtn.addEventListener("click", () => {
    const branch = redeemBranchEl.value; // "A" or "B"
    const amount = parseFloat(redeemAmountEl.value);
    if (amount <= 0 || isNaN(amount)) {
      alert("Redeem金額が不正です");
      return;
    }
    // モードロック
    if (!modeLocked) {
      modeLocked = true;
      modelRadios.forEach(r => r.disabled = true);
      log("初回操作が行われたため、モデル選択をロックしました。");
    }

    // トークン残高が足りるか
    if (token[branch] < amount) {
      alert(`Branch ${branch} のトークン残高が不足しています。`);
      return;
    }

    if (currentMode === "backed") {
      // Backed:
      // 1) Token LedgerからBurn
      token[branch] -= amount;
      // 2) オフチェーン(CBS)から預金を解放（=ユーザに現金を払い出すイメージ）
      //   PoC簡易表現：CBS[branch]をそのまま減らす
      if (cbs[branch] < amount) {
        // 実際は「担保分が別勘定にロックされていた」想定だがPoCのため単純化
        alert(`CBSのオフチェーン残高が不足。データ不整合の可能性。`);
      }
      cbs[branch] -= amount;

      log(`[Backed] Redeem: Branch ${branch} で $${amount.toFixed(2)} Burnし、CBS残高から払い戻し。`);
    } else {
      // Native:
      // 単一Ledger上からBurnするだけ
      token[branch] -= amount;
      log(`[Native] Redeem: Branch ${branch} で $${amount.toFixed(2)} Burn。`);
    }
    updateDisplay();
  });

  // Transferボタン押下
  transferBtn.addEventListener("click", () => {
    const source = transferSourceEl.value; // "A" or "B"
    const dest = transferDestEl.value;     // "A" or "B"
    const amount = parseFloat(transferAmountEl.value);
    if (amount <= 0 || isNaN(amount)) {
      alert("Transfer金額が不正です");
      return;
    }
    if (source === dest) {
      alert("同一支店への送金は不要または無効です。");
      return;
    }
    // トークン残高チェック
    if (token[source] < amount) {
      alert(`Source Branch ${source} のトークン残高が不足しています。`);
      return;
    }
    // モードロック
    if (!modeLocked) {
      modeLocked = true;
      modelRadios.forEach(r => r.disabled = true);
      log("初回操作が行われたため、モデル選択をロックしました。");
    }

    if (currentMode === "backed") {
      // BackedのTransfer: "異なる銀行(支店)"への送金は burn & mint
      // 1) SourceでトークンBurn
      token[source] -= amount;
      // 2) DestinationでトークンMint
      token[dest] += amount;

      // 3) オフチェーン(CBS)上も Source→Destへ移転
      cbs[source] -= amount;
      cbs[dest] += amount;

      log(`[Backed] Transfer: $${amount.toFixed(2)} を ${source}→${dest} に送金。` +
          `Token: Burn(${source}) & Mint(${dest})、CBSも移動。`);
    } else {
      // NativeのTransfer: 単一Ledgerで source→destへ引くだけ
      token[source] -= amount;
      token[dest] += amount;
      // CBS表示はtokenと同じにする
      log(`[Native] Transfer: $${amount.toFixed(2)} を ${source}→${dest} へ移転。 (Burn & Mint不要)`);
    }
    updateDisplay();
  });

  // Resetボタン押下
  resetBtn.addEventListener("click", () => {
    // 残高初期化
    cbs.A = INITIAL_BALANCE;
    cbs.B = INITIAL_BALANCE;
    token.A = INITIAL_BALANCE;
    token.B = INITIAL_BALANCE;

    // モード/ロック解除
    currentMode = "backed";
    modeLocked = false;
    modelRadios.forEach(radio => {
      radio.disabled = false;
      radio.checked = (radio.value === "backed"); // デフォルトbackedに
    });

    // 入力フォームも初期化
    depositBranchEl.value = "A";
    depositAmountEl.value = "100";
    redeemBranchEl.value = "A";
    redeemAmountEl.value = "50";
    transferSourceEl.value = "A";
    transferDestEl.value = "B";
    transferAmountEl.value = "100";

    // ログクリア
    operationLogEl.innerHTML = "";
    log("Simulation reset to initial state.");

    updateDisplay();
  });

  // ページ初期表示
  updateDisplay();
  log("現在のモデル: " + currentMode + "（操作するまで変更可能）");
});
