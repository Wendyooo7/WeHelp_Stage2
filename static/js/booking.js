// SetupSDK
let prime;

const APP_ID = 152092;
const appKey =
  "app_HUVYg88ZYWQ2wsxAuJWLBfGhhVPATfVq0xrzE0e2hliTBq6BZHR2HTrbLfLt";
TPDirect.setupSDK(APP_ID, appKey, "sandbox");

let fields = {
  number: {
    // css selector
    element: "#card-number",
    placeholder: "**** **** **** ****",
  },
  expirationDate: {
    // DOM object
    element: document.getElementById("card-expiration-date"),
    placeholder: "MM / YY",
  },
  ccv: {
    element: "#card-ccv",
    placeholder: "CCV",
  },
};

TPDirect.card.setup({
  fields: fields,
  styles: {
    // Styling ccv field
    "input.ccv": {
      "font-size": "16px",
    },
    // Styling expiration-date field
    "input.expiration-date": {
      "font-size": "16px",
    },
    // Styling card-number field
    "input.card-number": {
      "font-size": "16px",
    },
    // style focus state
    ":focus": {
      color: "black",
    },
    // style valid state
    ".valid": {
      color: "green",
    },
    // style invalid state
    ".invalid": {
      color: "red",
    },
    // Media queries
    // Note that these apply to the iframe, not the root window.
    "@media screen and (max-width: 400px)": {
      input: {
        color: "orange",
      },
    },
  },
  // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
  isMaskCreditCardNumber: true,
  maskCreditCardNumberRange: {
    beginIndex: 6,
    endIndex: 11,
  },
});

const bookingBtnMain = document.querySelector("#main-booking-btn");

// TPDirect.card.getPrime(callback);
// TPDirect.card.getTappayFieldsStatus()等同以下
bookingBtnMain.addEventListener("click", (event) => {
  event.preventDefault();

  // 取得 TapPay Fields 的 status
  const tappayStatus = TPDirect.card.getTappayFieldsStatus();

  // 確認是否可以 getPrime
  if (tappayStatus.canGetPrime === false) {
    console.log("can not get prime");
    alert("請檢查信用卡資訊欄位是否都完整輸入，以及是否輸入正確");
    return;
  }

  // Get prime
  TPDirect.card.getPrime((result) => {
    if (result.status !== 0) {
      alert("get prime error " + result.msg);
      return;
    }
    // console.log("get prime 成功，prime: " + result.card.prime);
    prime = result.card.prime;
    // localStorage.setItem("prime", prime);

    orderMyTour();
  });
});

async function orderMyTour() {
  try {
    const token = localStorage.getItem("token");
    // const prime = localStorage.getItem("prime");
    const phoneNumber = document.querySelector("#phone-number").value;
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prime: prime,
        order: {
          price: dataFee,
          trip: {
            attraction: {
              id: dataAttractionId,
              name: dataName,
              address: dataAddress,
              image: dataImg,
            },
            date: dataDate,
            time: dataTime,
          },
          contact: {
            name: loginName,
            email: loginEmail,
            phone: phoneNumber,
          },
        },
      }),
    });

    const data = await response.json();

    if (data.data.number) {
      let orderNumber = data.data.number;
      sessionStorage.setItem("orderNumber", orderNumber);

      let paymentStatus = data.data.payment.status;
      sessionStorage.setItem("paymentStatus", paymentStatus);

      let redirectUrl = `/thankyou?number=${orderNumber}`;
      window.location.href = redirectUrl;
    } else {
      console.log(data.message);
    }
  } catch (err) {
    console.log("fetch err: ", err);
  }
}
// export { prime };
// console.log(prime); undefined

// import { prime } from "./pay.js";

let loginName;
let loginEmail;

const token = localStorage.getItem("token");

if (!token) {
  window.location.replace("/");
} else {
  getNameAndEmail();
  fetchToGetMyTour();
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

let dataFee;
let dataAttractionId;
let dataName;
let dataAddress;
let dataImg;
let dataDate;
let dataTime;

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
    dataImg = data["data"]["attraction"]["image"];
    dataName = data["data"]["attraction"]["name"];
    dataDate = data["data"]["date"];
    dataTime = data["data"]["time"];
    dataFee = data["data"]["price"];
    dataAddress = data["data"]["attraction"]["address"];
    dataAttractionId = data["data"]["attraction"]["id"];

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
