// js/simulation.js

document.addEventListener("DOMContentLoaded", function() {
  // 初期値
  const initialBalance = 1000;
  let cbsLedger = { A: initialBalance, B: initialBalance };
  let tokenLedger = { A: initialBalance, B: initialBalance };

  // DOM 要素の取得
  const cbsAEl = document.getElementById("cbs-a");
  const cbsBEl = document.getElementById("cbs-b");
  const tokenAEl = document.getElementById("token-a");
  const tokenBEl = document.getElementById("token-b");
  const amountInput = document.getElementById("amount");
  const transferBtn = document.getElementById("transfer-btn");
  const resetBtn = document.getElementById("reset-btn");
  const logList = document.getElementById("log-list");
  const modelRadios = document.getElementsByName("model");
  const sourceSelect = document.getElementById("source");
  const destinationSelect = document.getElementById("destination");

  // 現在のモード："backed" または "native"
  let currentMode = "backed";
  let hasTransferred = false; // 送金後はモデル変更をロック

  // 各台帳の表示を更新する関数
  function updateDisplays() {
    cbsAEl.textContent = cbsLedger.A.toFixed(2);
    cbsBEl.textContent = cbsLedger.B.toFixed(2);
    tokenAEl.textContent = tokenLedger.A.toFixed(2);
    tokenBEl.textContent = tokenLedger.B.toFixed(2);
  }

  // ログにメッセージを追加する関数
  function appendLog(message) {
    const li = document.createElement("li");
    li.textContent = message;
    logList.appendChild(li);
  }

  // シミュレーションのリセット
  function resetSimulation() {
    cbsLedger = { A: initialBalance, B: initialBalance };
    tokenLedger = { A: initialBalance, B: initialBalance };
    updateDisplays();
    logList.innerHTML = "";
    appendLog("Simulation reset to initial state.");
    hasTransferred = false;
    // モード選択を有効化し、デフォルトはBackedに戻す
    modelRadios.forEach(radio => {
      radio.disabled = false;
      if (radio.value === "backed") {
        radio.checked = true;
        currentMode = "backed";
      }
    });
    // 送金元と送金先の選択を初期値に戻す
    sourceSelect.value = "A";
    destinationSelect.value = "B";
    appendLog("Current Mode: " + currentMode);
  }

  // モード切替処理（送金前のみ変更可能）
  modelRadios.forEach(radio => {
    radio.addEventListener("change", function() {
      if (hasTransferred) {
        // すでに送金済みの場合、変更を許可しない
        this.checked = (this.value === currentMode);
        appendLog("Mode change not allowed after first transfer. Please Reset first.");
        return;
      }
      currentMode = this.value;
      appendLog("Switched mode to: " + currentMode);
      // Native モードなら、Token LedgerはCBS Ledgerと同一になる
      if (currentMode === "native") {
        tokenLedger.A = cbsLedger.A;
        tokenLedger.B = cbsLedger.B;
        updateDisplays();
      }
    });
  });

  // 送金操作処理
  transferBtn.addEventListener("click", function() {
    let amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    // 送金元と送金先を取得
    let source = sourceSelect.value;
    let destination = destinationSelect.value;
    if (source === destination) {
      alert("Source and Destination must be different.");
      return;
    }
    // 送金元に十分な資金があるかチェック
    if (cbsLedger[source] < amount) {
      alert(`Insufficient funds in ${source} branch.`);
      return;
    }

    // 送金処理
    if (currentMode === "backed") {
      // CBS Ledger: 送金元から引き落とし、送金先へ加算
      cbsLedger[source] -= amount;
      cbsLedger[destination] += amount;
      appendLog(`CBS Ledger updated: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)}`);
      // Token Ledger: 送金元からのトークンをburnし、送金先へmint
      tokenLedger[source] -= amount;
      tokenLedger[destination] += amount;
      appendLog(`Token Ledger updated (burn & mint): ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)}`);
    } else if (currentMode === "native") {
      // Nativeモード: 単一の台帳として更新
      cbsLedger[source] -= amount;
      cbsLedger[destination] += amount;
      // Token LedgerはCBS Ledgerと同一
      tokenLedger[source] = cbsLedger[source];
      tokenLedger[destination] = cbsLedger[destination];
      appendLog(`Native Ledger updated: ${source} -$${amount.toFixed(2)}, ${destination} +$${amount.toFixed(2)}`);
    }
    updateDisplays();

    // 初回の送金後は、モード選択と分岐選択をロック
    if (!hasTransferred) {
      hasTransferred = true;
      modelRadios.forEach(r => r.disabled = true);
      sourceSelect.disabled = true;
      destinationSelect.disabled = true;
      appendLog("Model and branch selection are now locked. Use Reset to change.");
    }
  });

  // リセットボタン処理
  resetBtn.addEventListener("click", resetSimulation);

  // 初期状態の表示
  updateDisplays();
  appendLog("Current Mode: " + currentMode);
});
