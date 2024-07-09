let loginName;
let loginEmail;

const token = localStorage.getItem("token");

if (!token) {
  window.location.replace("/");
} else {
  document.addEventListener("DOMContentLoaded", () => {
    getNameAndEmail();
    fetchToGetMyTour();
  });
}

async function getNameAndEmail() {
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
      loginName = data.data.name;
      loginEmail = data.data.email;
    }
  } catch (err) {
    console.log("fetch err: ", err);
  }
}

const sayHiToOrderer = document.querySelector("#main__greeting");
const tourName = document.querySelector(
  "#main__booking__info__attraction-name"
);
const tourDate = document.querySelector("#main__booking__info__date");
const tourTime = document.querySelector("#main__booking__info__time");
const tourFee = document.querySelector("#main__booking__info__fee");
const tourAddress = document.querySelector("#main__booking__info__address");
const tourImg = document.querySelector("#main__booking__info__img");
const ordererName = document.querySelector("#order-info__name");
const ordererEmail = document.querySelector("#order-info__email");
const submitPrice = document.querySelector("#price-submit__price");

async function fetchToGetMyTour() {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/booking", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!data.data) {
    main.innerHTML = `<div id="main__greeting">您好，${loginName}，待預定的行程如下：</div>
       <div id="main__no-booking-data">目前沒有任何待預定的行程</div>`;
  } else {
    const dataImg = data["data"]["attraction"]["image"];
    const dataName = data["data"]["attraction"]["name"];
    const dataDate = data["data"]["date"];
    const dataTime = data["data"]["time"];
    const dataFee = data["data"]["price"];
    const dataAddress = data["data"]["attraction"]["address"];

    sayHiToOrderer.textContent = `您好，${loginName}，待預定的行程如下：`;
    tourImg.src = dataImg;
    tourName.textContent = `台北一日遊：${dataName}`;
    tourDate.innerHTML = `<strong>日期：</strong>${dataDate}`;
    renderTourTimeContent(dataTime);
    renderTourFeeContent(dataFee);
    tourAddress.innerHTML = `<strong>地點：</strong>${dataAddress}`;
    ordererName.value = loginName;
    ordererEmail.value = loginEmail;
  }
  main.style.display = "flex";
}

function renderTourTimeContent(dataTime) {
  if (dataTime === "morning") {
    tourTime.innerHTML = "<strong>時間：</strong>上午 9 點到中午 12 點";
  } else {
    tourTime.innerHTML = "<strong>時間：</strong>下午 2 點到下午 5 點";
  }
}

function renderTourFeeContent(dataFee) {
  if (dataFee === 2000) {
    tourFee.innerHTML = "<strong>費用：</strong>新台幣 2000 元";
    submitPrice.innerHTML = "<strong>總價：新台幣 2000 元</strong>";
  } else {
    tourFee.innerHTML = "<strong>費用：</strong>新台幣 2500 元";
    submitPrice.innerHTML = "<strong>總價：新台幣 2500 元</strong>";
  }
}

const bookingBtnNav = document.querySelector("#nav-booking-btn");
const signStatusBtn = document.querySelector("#sign-status-btn");
const main = document.querySelector("#booking-main");

bookingBtnNav.addEventListener("click", () => {
  window.location.reload();
});

signStatusBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  signStatusBtn.textContent = "登入／註冊";
  window.location.href = "/";
});

document
  .querySelector("#main__booking__info__delete")
  .addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/booking", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.ok) {
        console.log("刪除成功");
        window.location.reload();
      } else {
        console.log(data.message);
      }
    } catch (err) {
      console.log(err);
    }
  });
