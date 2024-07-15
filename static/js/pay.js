let prime;
// SetupSDK
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

// TPDirect.card.getTappayFieldsStatus()以下等同
const submitButton = document.querySelector("#main-booking-btn");
TPDirect.card.onUpdate(function (update) {
  // update.canGetPrime === true
  // --> you can call TPDirect.card.getPrime()
  if (update.canGetPrime) {
    // Enable submit Button to get prime.
    submitButton.removeAttribute("disabled");
  } else {
    // Disable submit Button to get prime.
    submitButton.setAttribute("disabled", true);
  }

  // // number 欄位是錯誤的
  // if (update.status.number === 2) {
  //   setNumberFormGroupToError();
  // } else if (update.status.number === 0) {
  //   setNumberFormGroupToSuccess();
  // } else {
  //   setNumberFormGroupToNormal();
  // }

  // if (update.status.expiry === 2) {
  //   setNumberFormGroupToError();
  // } else if (update.status.expiry === 0) {
  //   setNumberFormGroupToSuccess();
  // } else {
  //   setNumberFormGroupToNormal();
  // }

  // if (update.status.ccv === 2) {
  //   setNumberFormGroupToError();
  // } else if (update.status.ccv === 0) {
  //   setNumberFormGroupToSuccess();
  // } else {
  //   setNumberFormGroupToNormal();
  // }
});

// TPDirect.card.getPrime(callback);

submitButton.addEventListener("click", (event) => {
  event.preventDefault();

  // 取得 TapPay Fields 的 status
  const tappayStatus = TPDirect.card.getTappayFieldsStatus();
  console.log(tappayStatus);
  // 確認是否可以 getPrime
  if (tappayStatus.canGetPrime === false) {
    alert("can not get prime");
    return;
  }

  // Get prime
  TPDirect.card.getPrime((result) => {
    if (result.status !== 0) {
      alert("get prime error " + result.msg);
      return;
    }
    alert("get prime 成功，prime: " + result.card.prime);
    prime = result.card.prime;
    console.log(prime);
    localStorage.setItem("prime", prime);
    // send prime to your server, to pay with Pay by Prime API .
    // Pay By Prime Docs: https://docs.tappaysdk.com/tutorial/zh/back.html#pay-by-prime-api
  });
});

// export { prime };
// console.log(prime); undefined
