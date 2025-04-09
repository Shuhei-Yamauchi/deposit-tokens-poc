// js/simulation.js

document.addEventListener("DOMContentLoaded", function() {
  // 初期値設定
  const initialBalance = 1000;
  // CBS Ledgerは各Branch1000、Token Ledgerは初期状態は0（FUNDで移動）
  let cbsLedger = { A: initialBalance, B: initialBalance };
  let tokenLedger = { A: 0, B: 0 };

  // DOM要素の取得
  const cbsAEl = document.getElementById("cbs-a");
  const cbsBEl = document.getElementById("cbs-b");
  const tokenAEl = document.getElementById("token-a");
  const tokenBEl = document.getElementById("token-b");

  const fundBranchEl = document.getElementById("fund-branch");
  const fundAmountEl = document.getElementById("fund-amount");
  const fundBtn = document.getElementById("fund-btn");

  const transferSourceEl = document.getElementById("transfer-source");
  const transferDestEl = document.getElementById("transfer-dest");
  const transferAmountEl = document.getElementById("transfer-amount");
  const transferBtn = document.getElementById("transfer-btn");

  const defundBranchEl = document.getElementById("defund-branch");
  const defundAmountEl = document.getElementById("defund-amount");
  const defundBtn = document.getElementById("defund-btn");

  const resetBtn = document.getElementById("reset-btn");
  const logList = document.getElementById("log-list");

  const modelRadios = document.getElementsByName("model");

  // 現在のモデル："backed" or "native"
  let currentModel = "backed";
  let modeLocked = false; // 初回操作後にモデル選択をロック

  // 各台帳の表示更新
  function updateDisplays() {
    cbsAEl.textContent = cbsLedger.A.toFixed(2);
    cbsBEl.textContent = cbsLedger.B.toFixed(2);
    tokenAEl.textContent = tokenLedger.A.toFixed(2);
    tokenBEl.textContent = tokenLedger.B.toFixed(2);
  }

  // ログ出力
  function appendLog(message) {
    const li = document.createElement("li");
    li.textContent = message;
    logList.appendChild(li);
  }

  // 台帳ごとの総計ログを出力（両台帳は別表現なので、合算しない）
  function logTotals() {
    const totalCBS = cbsLedger.A + cbsLedger.B;
    const totalToken = tokenLedger.A + tokenLedger.B;
    appendLog(`Total in CBS Ledger: $${totalCBS.toFixed(2)} | Total in Token Ledger: $${totalToken.toFixed(2)}`);
  }

  // 初回操作でモデルロック
  function lockModelIfNeeded() {
    if (!modeLocked) {
      modeLocked = true;
      Array.from(modelRadios).forEach(r => (r.disabled = true));
      appendLog("First operation executed. Model is now locked.");
    }
  }

  // FUND操作: CBS → Token
  fundBtn.addEventListener("click", () => {
    const branch = fundBranchEl.value; // "A" or "B"
    const amount = parseFloat(fundAmountEl.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Fund.");
      return;
    }
    if (cbsLedger[branch] < amount) {
      alert(`Insufficient CBS balance in branch ${branch}.`);
      return;
    }
    lockModelIfNeeded();

    // CBSからTokenへ移動：CBS減少、Token増加
    cbsLedger[branch] -= amount;
    tokenLedger[branch] += amount;
    appendLog(`[Fund] Moved $${amount.toFixed(2)} from CBS(${branch}) to Token(${branch}). (Model: ${currentModel})`);
    updateDisplays();
    logTotals();
  });

  // TRANSFER操作: Token上で送金（バックド型はCBSも更新、Native型はTokenのみ更新）
  transferBtn.addEventListener("click", () => {
    const amount = parseFloat(transferAmountEl.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Transfer.");
      return;
    }
    const source = transferSourceEl.value;
    const destination = transferDestEl.value;
    if (source === destination) {
      alert("Source and Destination must be different.");
      return;
    }
    if (tokenLedger[source] < amount) {
      alert(`Insufficient token balance in branch ${source}.`);
      return;
    }
    lockModelIfNeeded();

    if (currentModel === "backed") {
      // Backed モード：Token台帳でBurn/Mint、さらにCBS台帳の更新も反映
      // CBS台帳更新
      cbsLedger[source] -= amount;
      cbsLedger[destination] += amount;
      appendLog(`CBS Ledger updated: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)}`);

      // Token台帳更新：Burn操作
      tokenLedger[source] -= amount;
      appendLog(`Token Ledger: Burn executed on ${source} for $${amount.toFixed(2)}`);
      // Token台帳更新：Mint操作
      tokenLedger[destination] += amount;
      appendLog(`Token Ledger: Mint executed for ${destination} for $${amount.toFixed(2)}`);
    } else if (currentModel === "native") {
      // Native モード：Token台帳のみ更新（CBS台帳は変更しない）
      tokenLedger[source] -= amount;
      tokenLedger[destination] += amount;
      appendLog(`Native Transfer executed: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)} (CBS Ledger remains unchanged)`);
    }

    updateDisplays();
    logTotals();
  });

  // DEFUND操作: Token → CBS
  defundBtn.addEventListener("click", () => {
    const branch = document.getElementById("defund-branch").value;
    const amount = parseFloat(document.getElementById("defund-amount").value);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount for Defund.");
      return;
    }
    if (tokenLedger[branch] < amount) {
      alert(`Insufficient token balance in branch ${branch}.`);
      return;
    }
    lockModelIfNeeded();

    // Token台帳から資金を減らし、CBS台帳に加算
    tokenLedger[branch] -= amount;
    cbsLedger[branch] += amount;
    appendLog(`[Defund] Moved $${amount.toFixed(2)} from Token(${branch}) to CBS(${branch}). (Model: ${currentModel})`);
    updateDisplays();
    logTotals();
  });

  // モデル変更処理（送金前のみ可能）
  Array.from(modelRadios).forEach(radio => {
    radio.addEventListener("change", function() {
      if (modeLocked) {
        this.checked = (this.value === currentModel);
        appendLog("Model change not allowed after first operation. Please Reset first.");
        return;
      }
      currentModel = this.value;
      appendLog(`Model changed to: ${currentModel}`);
      if (currentModel === "native") {
        // Native モード：Token台帳は現在のCBS台帳と同一（FUND等が実施されている場合）
        tokenLedger.A = cbsLedger.A;
        tokenLedger.B = cbsLedger.B;
        updateDisplays();
      }
    });
  });

  // RESET操作
  resetBtn.addEventListener("click", () => {
    // Reset各台帳
    cbsLedger = { A: initialBalance, B: initialBalance };
    tokenLedger = { A: 0, B: 0 }; // Token台帳はリセット時は0
    updateDisplays();
    logList.innerHTML = "";
    appendLog("Simulation reset to initial state.");
    modeLocked = false;
    // モデル選択を有効化（デフォルトは backed）
    Array.from(modelRadios).forEach(radio => {
      radio.disabled = false;
      if (radio.value === "backed") {
        radio.checked = true;
        currentModel = "backed";
      }
    });
    // 各操作入力の初期値もリセット
    fundBranchEl.value = "A";
    fundAmountEl.value = 100;
    transferSourceEl.value = "A";
    transferDestEl.value = "B";
    transferAmountEl.value = 50;
    document.getElementById("defund-branch").value = "A";
    document.getElementById("defund-amount").value = 50;
    appendLog("Current Model: " + currentModel);
    logTotals();
  });

  // 初期表示
  updateDisplays();
  appendLog(`Current Model: ${currentModel} (changeable until first operation)`);
  logTotals();
});
