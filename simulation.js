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
  
    // 現在のモード："backed" または "native"
    let currentMode = "backed";
  
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
    }
  
    // モード切替処理
    modelRadios.forEach(radio => {
      radio.addEventListener("change", function() {
        currentMode = this.value;
        appendLog("Switched mode to: " + currentMode);
        // Native モードの場合、両台帳は常に同一となる
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
      // A 拠点に十分な資金があるかチェック
      if (cbsLedger.A < amount) {
        alert("Insufficient funds in A branch.");
        return;
      }
  
      if (currentMode === "backed") {
        // CBS 台帳の更新：A から引き落とし、B に加算
        cbsLedger.A -= amount;
        cbsLedger.B += amount;
        appendLog("CBS Ledger updated: A -$" + amount.toFixed(2) + ", B +$" + amount.toFixed(2));
        // Token 台帳：A からのトークンが burn、B へのトークンが mint される
        tokenLedger.A -= amount;
        tokenLedger.B += amount;
        appendLog("Token Ledger updated (burn & mint): A -$" + amount.toFixed(2) + ", B +$" + amount.toFixed(2));
      } else if (currentMode === "native") {
        // Native モードでは、単一の台帳として更新（両台帳は同一）
        cbsLedger.A -= amount;
        cbsLedger.B += amount;
        tokenLedger.A = cbsLedger.A;
        tokenLedger.B = cbsLedger.B;
        appendLog("Native Ledger updated: A -$" + amount.toFixed(2) + ", B +$" + amount.toFixed(2));
      }
      updateDisplays();
    });
  
    // リセットボタン処理
    resetBtn.addEventListener("click", resetSimulation);
  
    // 初期状態の表示
    updateDisplays();
  });
  