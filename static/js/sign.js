const bookingBtnNav = document.querySelector("#nav-booking-btn");
const signStatusBtn = document.querySelector("#sign-status-btn");
const signInModal = document.querySelector("#sign-in-modal");

// 頁面加載中先隱藏登入狀態的按鈕，以免在文字在登入和登出間反覆切換
signStatusBtn.style.visibility = "hidden";

document.addEventListener("DOMContentLoaded", () => {
  checkSignStatus();
});

// 檢查登入狀態
async function checkSignStatus() {
  const token = localStorage.getItem("token");
  if (!token) {
    updateUIForSignedOutUser();
  }

  try {
    const response = await fetch("/api/user/auth", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        // 在 Authorization header 中攜帶 Bearer Token
      },
    });

    const data = await response.json();

    if (data.data) {
      // 已登入，更新 UI
      updateUIForSignedInUser();
    } else {
      // 未登入，更新 UI
      updateUIForSignedOutUser();
    }
  } catch (err) {
    console.error("檢查登入狀態時發生問題:", err);
  }
  // 驗證完畢後，顯示登入狀態按鈕的文字
  signStatusBtn.style.visibility = "visible";
}

signStatusBtn.addEventListener("click", () => {
  if (localStorage.getItem("token")) {
    // 若已登入，點擊按鈕執行登出
    updateUIForSignedOutUser();
    localStorage.removeItem("token");
    window.location.reload();
  } else {
    // 若未登入，顯示登入彈出視窗
    signInModal.style.display = "block";
  }
});

bookingBtnNav.addEventListener("click", () => {
  if (localStorage.getItem("token")) {
    window.location.href = "/booking";
  } else {
    signInModal.style.display = "block";
  }
});

// 切換成註冊視窗
const signUpModal = document.querySelector("#sign-up-modal");
const spanToSignUp = document.querySelector("#toSign-up-Modal");
spanToSignUp.addEventListener("click", () => {
  signInModal.style.display = "none";
  signUpModal.style.display = "block";
});

// 切換成登入視窗
const spanToSignIn = document.querySelector("#toSign-in-modal");
spanToSignIn.addEventListener("click", () => {
  signUpModal.style.display = "none";
  signInModal.style.display = "block";
});

// 關閉註冊視窗
const closeSignUpModal = document.querySelector("#sign-up__close-icon");
closeSignUpModal.addEventListener("click", () => {
  signUpModal.style.display = "none";
});

// 關閉登入視窗
const closeSignInModal = document.querySelector("#sign-in__close-icon");
closeSignInModal.addEventListener("click", () => {
  signInModal.style.display = "none";
});

// 送出註冊資料
document.querySelector("#sign-up-btn").addEventListener("click", async () => {
  const inputName = document.querySelector("#sign-up-name").value;
  const inputEmail = document.querySelector("#sign-up-email").value;
  const inputPassword = document.querySelector("#sign-up-password").value;
  const signUpMsg = document.querySelector("#sign-up-msg");

  if (!inputName || !inputEmail || !inputPassword) {
    alert("請確認姓名、電子信箱和密碼都已填寫");
    return;
  }

  try {
    const response = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: inputName,
        email: inputEmail,
        password: inputPassword,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      signUpMsg.textContent = "註冊成功，請登入系統";
      signUpMsg.style.color = "green";
      signUpMsg.className = "sign__item__margin";
    } else if (data.error) {
      signUpMsg.textContent = "Email已經註冊帳戶";
      signUpMsg.style.color = "red";
      signUpMsg.className = "sign__item__margin";
    } else {
      signUpMsg.textContent = "發生未知錯誤，請稍後再試";
      signUpMsg.className = "sign__item__margin";
    }
  } catch (err) {
    console.error("送出註冊資料時發生問題:", err);
  }
});

// 送出登入資料
document.querySelector("#sign-in-btn").addEventListener("click", async () => {
  const inputEmail = document.querySelector("#sign-in-email").value;
  const inputPassword = document.querySelector("#sign-in-password").value;
  const signInMsg = document.querySelector("#sign-in-msg");

  if (!inputEmail || !inputPassword) {
    alert("請確認電子信箱和密碼都已填寫");
    return;
  }

  try {
    const response = await fetch("/api/user/auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inputEmail,
        password: inputPassword,
      }),
    });

    const data = await response.json();

    if (data.error) {
      signInMsg.textContent = data.message;
      signInMsg.style.color = "red";
      signInMsg.className = "sign__item__margin";
    } else {
      signInMsg.textContent = "登入成功";
      signInMsg.style.color = "green";
      signInMsg.className = "sign__item__margin";
      localStorage.setItem("token", data.token);
      window.location.reload();
      checkSignStatus();
    }
  } catch (err) {
    console.error("送出登入資料時發生問題:", err);
  }
});

function updateUIForSignedInUser() {
  signStatusBtn.textContent = "登出系統";
}

function updateUIForSignedOutUser() {
  signStatusBtn.textContent = "登入／註冊";
}
