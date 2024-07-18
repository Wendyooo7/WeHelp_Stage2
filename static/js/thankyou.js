const token = localStorage.getItem("token");

if (!token) {
  window.location.replace("/");
}

const orderNumberDiv = document.querySelector("#main__order__number");
const orderNumber = sessionStorage.getItem("orderNumber");

orderNumberDiv.textContent = `您的訂單編號為：${orderNumber}`;

const paymentResultDiv = document.querySelector("#main__order__result");
const paymentStatus = sessionStorage.getItem("paymentStatus");

if (paymentStatus === "0") {
  paymentResultDiv.textContent =
    "感謝您預定行程並成功付款，預祝您有趟美好旅程！";
} else {
  paymentResultDiv.textContent =
    "感謝您預定行程！由於付款尚未成功，請至會員中心查詢歷史訂單。";
}
