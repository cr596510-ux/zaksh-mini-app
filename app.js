<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  >

  <title>ZAKSH Mining</title>

  <script src="https://telegram.org/js/telegram-web-app.js"></script>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Arial, sans-serif;
      background: #0b0f17;
      color: #ffffff;
      min-height: 100vh;
      padding-bottom: 90px;
    }

    button {
      font: inherit;
    }

    .app {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
      padding: 18px 16px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
    }

    .brand {
      font-size: 22px;
      font-weight: 800;
    }

    .status {
      font-size: 12px;
      padding: 6px 10px;
      border-radius: 20px;
      background: #182130;
      color: #8fa3bd;
    }

    .section {
      display: none;
    }

    .section.active {
      display: block;
    }

    .balance-card,
    .mining-card,
    .card,
    .task {
      background: #121927;
      border: 1px solid #202b3c;
    }

    .balance-card {
      border-radius: 20px;
      padding: 22px;
      margin-bottom: 16px;
    }

    .balance-label {
      color: #8fa3bd;
      font-size: 13px;
      margin-bottom: 8px;
    }

    .balance {
      font-size: 36px;
      font-weight: 800;
    }

    .token {
      color: #8fa3bd;
      font-size: 14px;
      margin-top: 5px;
    }

    .mining-card {
      border-radius: 20px;
      padding: 22px;
      margin-bottom: 16px;
      text-align: center;
    }

    .mining-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .mining-info {
      color: #8fa3bd;
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 18px;
    }

    .mine-button {
      width: 100%;
      border: 0;
      border-radius: 14px;
      padding: 15px;
      background: #ffffff;
      color: #0b0f17;
      font-weight: 800;
      cursor: pointer;
    }

    .mine-button:disabled,
    .task-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .card {
      border-radius: 18px;
      padding: 18px;
    }

    .clickable {
      cursor: pointer;
    }

    .card-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 7px;
    }

    .card-text {
      color: #8fa3bd;
      font-size: 12px;
      line-height: 1.4;
    }

    .section-title {
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .task {
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .task-name {
      font-weight: 700;
    }

    .task-reward {
      font-size: 12px;
      color: #8fa3bd;
      white-space: nowrap;
    }

    .task-description {
      color: #8fa3bd;
      font-size: 12px;
      margin: 8px 0 14px;
    }

    .task-button {
      width: 100%;
      border: 0;
      border-radius: 11px;
      padding: 11px;
      background: #202b3c;
      color: #ffffff;
      cursor: pointer;
    }

    .message {
      margin-top: 16px;
      padding: 13px;
      border-radius: 12px;
      background: #121927;
      color: #8fa3bd;
      font-size: 13px;
      display: none;
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 72px;
      background: #0e141f;
      border-top: 1px solid #202b3c;
      display: flex;
      justify-content: center;
      z-index: 10;
    }

    .nav-inner {
      width: 100%;
      max-width: 520px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }

    .nav-button {
      border: 0;
      background: transparent;
      color: #718198;
      cursor: pointer;
      font-size: 11px;
      padding: 8px 2px;
    }

    .nav-button.active {
      color: #ffffff;
    }

    .nav-icon {
      display: block;
      font-size: 20px;
      margin-bottom: 4px;
    }
  </style>
</head>

<body>

  <main class="app">

    <header class="header">
      <div class="brand">ZAKSH Mining</div>

      <div
        class="status"
        id="connectionStatus"
      >
        Connecting...
      </div>
    </header>

    <!-- HOME / MINING -->

    <section
      id="homeSection"
      class="section active"
    >

      <div class="balance-card">
        <div class="balance-label">
          Your Balance
        </div>

        <div
          class="balance"
          id="balance"
        >
          0
        </div>

        <div class="token">
          ZKO
        </div>
      </div>

      <div class="mining-card">

        <div class="mining-title">
          ZKO Mining
        </div>

        <div class="mining-info">
          Start a mining session and earn ZKO rewards.
        </div>

        <button
          id="mineButton"
          class="mine-button"
          type="button"
        >
          Start Mining
        </button>

      </div>

      <div class="grid">

        <div
          class="card clickable"
          data-section="tasksSection"
        >
          <div class="card-title">
            📋 Tasks
          </div>

          <div class="card-text">
            Complete tasks and earn ZKO.
          </div>
        </div>

        <div
          class="card clickable"
          data-section="referralSection"
        >
          <div class="card-title">
            👥 Referral
          </div>

          <div class="card-text">
            Invite friends and earn rewards.
          </div>
        </div>

        <div
          class="card clickable"
          data-section="walletSection"
        >
          <div class="card-title">
            💰 Wallet
          </div>

          <div class="card-text">
            View your ZKO balance.
          </div>
        </div>

        <div
          class="card clickable"
          data-section="profileSection"
        >
          <div class="card-title">
            👤 Profile
          </div>

          <div class="card-text">
            View your account.
          </div>
        </div>

      </div>

      <div
        id="message"
        class="message"
      ></div>

    </section>

    <!-- TASKS -->

    <section
      id="tasksSection"
      class="section"
    >

      <div class="section-title">
        Tasks
      </div>

      <div id="tasksList">
        <div class="task">
          Loading tasks...
        </div>
      </div>

    </section>

    <!-- REFERRAL -->

    <section
      id="referralSection"
      class="section"
    >

      <div class="section-title">
        Referral
      </div>

      <div class="balance-card">

        <div class="balance-label">
          Invited Users
        </div>

        <div
          class="balance"
          id="referralCount"
        >
          0
        </div>

        <div class="token">
          Invite friends and earn ZKO.
        </div>

      </div>

    </section>

    <!-- WALLET -->

    <section
      id="walletSection"
      class="section"
    >

      <div class="section-title">
        Wallet
      </div>

      <div class="balance-card">

        <div class="balance-label">
          Available Balance
        </div>

        <div
          class="balance"
          id="walletBalance"
        >
          0
        </div>

        <div class="token">
          ZKO
        </div>

      </div>

      <div class="card">

        <div class="card-title">
          Withdrawals
        </div>

        <div class="card-text">
          Withdrawals are locked until
          5 January 2027.
        </div>

      </div>

    </section>

    <!-- PROFILE -->

    <section
      id="profileSection"
      class="section"
    >

      <div class="section-title">
        Profile
      </div>

      <div class="balance-card">

        <div class="balance-label">
          Telegram User
        </div>

        <div
          class="balance"
          id="profileName"
          style="font-size:24px;"
        >
          Loading...
        </div>

        <div
          class="token"
          id="profileUsername"
        ></div>

      </div>

    </section>

  </main>

  <!-- BOTTOM NAVIGATION -->

  <nav class="bottom-nav">

    <div class="nav-inner">

      <button
        class="nav-button active"
        type="button"
        data-section="homeSection"
      >
        <span class="nav-icon">⛏️</span>
        Mining
      </button>

      <button
        class="nav-button"
        type="button"
        data-section="tasksSection"
      >
        <span class="nav-icon">📋</span>
        Tasks
      </button>

      <button
        class="nav-button"
        type="button"
        data-section="walletSection"
      >
        <span class="nav-icon">💰</span>
        Wallet
      </button>

      <button
        class="nav-button"
        type="button"
        data-section="profileSection"
      >
        <span class="nav-icon">👤</span>
        Profile
      </button>

    </div>

  </nav>

  <!-- Mini App logic -->
  <script src="./app.js"></script>

  <script>
    function showSection(sectionId) {
      document
        .querySelectorAll(".section")
        .forEach(section => {
          section.classList.remove("active");
        });

      const section =
        document.getElementById(sectionId);

      if (section) {
        section.classList.add("active");
      }

      document
        .querySelectorAll(".nav-button")
        .forEach(button => {
          button.classList.toggle(
            "active",
            button.dataset.section === sectionId
          );
        });
    }

    document
      .querySelectorAll("[data-section]")
      .forEach(element => {
        element.addEventListener("click", () => {
          showSection(element.dataset.section);
        });
      });
  </script>

</body>
</html>
