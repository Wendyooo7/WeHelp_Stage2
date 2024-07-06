const bookingBtnNav = document.querySelector("#nav-booking-btn");
const bookingBtnMain = document.querySelector("#booking-btn");
const signStatusBtn = document.querySelector("#sign-status-btn");
const signInModal = document.querySelector("#sign-in-modal");

// 在頁面加載時隱藏按鈕
signStatusBtn.style.visibility = "hidden";

document.addEventListener("DOMContentLoaded", () => {
  // 初始化檢查登入狀態
  checkSignStatus();

  signStatusBtn.addEventListener("click", () => {
    if (localStorage.getItem("token")) {
      // 若已登入，點擊按鈕執行登出
      updateUIForSignedOutUser();
      localStorage.removeItem("token");
    } else {
      // 若未登入，顯示登入彈出視窗
      signInModal.style.display = "block";
    }
  });

  bookingBtnNav.addEventListener("click", () => {
    if (localStorage.getItem("token")) {
      window.location.href = "http://127.0.0.1:8000/booking";
    } else {
      signInModal.style.display = "block";
    }
  });

  bookingBtnMain.addEventListener("click", async () => {
    if (localStorage.getItem("token")) {
      const date = document.querySelector("input[type='date']").value;
      const priceText = spanPrice.textContent;
      const priceTextSplit = priceText.split(" ");
      const pricePart = priceTextSplit[1];

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attractionId: Number(attractionId),
            date: date,
            time: time,
            price: Number(pricePart),
          }),
        });

        const data = await response.json();
      } catch (err) {
        console.log("fetch err: ", err);
      }
      window.location.href = "http://127.0.0.1:8000/booking";
    } else {
      signInModal.style.display = "block";
    }
  });
});

const closeSignInModal = document.querySelector("#sign-in__close-icon");
closeSignInModal.addEventListener("click", () => {
  signInModal.style.display = "none";
});

// 註冊用彈出視窗
const signUpModal = document.querySelector("#sign-up-modal");
const spanToSignUp = document.querySelector("#toSign-up-Modal");
spanToSignUp.addEventListener("click", () => {
  signInModal.style.display = "none";
  signUpModal.style.display = "block";
});

const spanToSignIn = document.querySelector("#toSign-in-modal");
spanToSignIn.addEventListener("click", () => {
  signUpModal.style.display = "none";
  signInModal.style.display = "block";
});

const closeSignUpModal = document.querySelector("#sign-up__close-icon");
closeSignUpModal.addEventListener("click", () => {
  signUpModal.style.display = "none";
});

// 送出註冊資料
document.querySelector("#sign-up-btn").addEventListener("click", async () => {
  const inputName = document.querySelector("#sign-up-name").value;
  const inputEmail = document.querySelector("#sign-up-email").value;
  const inputPassword = document.querySelector("#sign-up-password").value;
  const signUpMsg = document.querySelector("#sign-up-msg");

  if (!inputName || !inputEmail || !inputPassword) {
    alert("請確認姓名、電子信箱和密碼都已填寫");
    return; // 立即返回，阻止後續的fetch請求
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
    // console.log(data); // 註冊成功會得到：{ok: true}
    // 註冊失敗會得到：{error: true, message: 'Email已經註冊帳戶'}

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
    console.log("fetch err: ", err);
  }
});

// 送出登入資料
document.querySelector("#sign-in-btn").addEventListener("click", async () => {
  const inputEmail = document.querySelector("#sign-in-email").value;
  const inputPassword = document.querySelector("#sign-in-password").value;
  const signInMsg = document.querySelector("#sign-in-msg");

  if (!inputEmail || !inputPassword) {
    alert("請確認電子信箱和密碼都已填寫");
    return; // 立即返回，阻止後續的fetch請求
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
    // console.log(data); // 註冊成功會得到：{ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwibmFtZSI6Ilx1NWMwZlx1ODI3ZSIsImVtYWlsIjoibG92ZUBnbWFpbC5jb20iLCJleHAiOjE3MTk5MzY3Mjd9.QSzpuoVriQZ6Drx5e3ZN2bvYG2qAb2wm_UlzGNGr7RM" }
    // 登入失敗會得到：{error: true, message: '電子信箱或密碼輸入錯誤'}

    if (data.error) {
      signInMsg.textContent = data.message;
      signInMsg.style.color = "red";
      signInMsg.className = "sign__item__margin";
    } else {
      signInMsg.textContent = "登入成功";
      signInMsg.style.color = "green";
      signInMsg.className = "sign__item__margin";
      localStorage.setItem("token", data.token);
      checkSignStatus();
    }
  } catch (err) {
    console.log("fetch err: ", err);
  }
});

async function checkSignStatus() {
  const token = localStorage.getItem("token");
  if (token) {
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
      console.log("fetch err: ", err);
    }
  }
  // 驗證完畢後顯示按鈕
  signStatusBtn.style.visibility = "visible";
}

function updateUIForSignedInUser() {
  signStatusBtn.textContent = "登出系統";
}

function updateUIForSignedOutUser() {
  signStatusBtn.textContent = "登入／註冊";
}
