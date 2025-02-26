let time = "morning";

document.addEventListener("DOMContentLoaded", () => {
  renderAttractionPage();
});

async function renderAttractionPage() {
  const attractionId = getAttractionIdFromURL();
  const data = await fetchAttractionData(attractionId);
  renderAttraction(data);
}

function getAttractionIdFromURL() {
  const pathName = window.location.pathname;
  const pathParts = pathName.split("/");
  const attractionId = pathParts[pathParts.length - 1];
  return attractionId;
}

async function fetchAttractionData(attractionId) {
  const url = `/api/attraction/${attractionId}`;

  try {
    const response = await fetch(url);
    const responseJSON = await response.json();
    const data = responseJSON.data;
    return data;
  } catch (err) {
    console.error("獲取景點數據失敗:", err);
  }
}

let imgs;

function renderAttraction(data) {
  const name = data.name;
  const h2Name = document.querySelector("#attraction__top__info__name");
  h2Name.textContent = name;

  const category = data.category;
  const mrt = data.mrt;
  const h3CatMrt = document.querySelector("#attraction__top__info__catAndMRT");
  h3CatMrt.textContent = `${category} at ${mrt}`;

  const description = data.description;
  const pDescription = document.querySelector(
    "#attraction__bottom__description"
  );
  pDescription.textContent = description;

  const address = data.address;
  const pAddress = document.querySelector("#attraction__bottom__address");
  pAddress.textContent = address;

  const transport = data.transport;
  const pTransport = document.querySelector("#attraction__bottom__transport");
  pTransport.textContent = transport;

  imgs = data.images[0].split(",");

  renderImgsAndDots(); // 顯示第一張圖片和第一個點點
}

// 圖片輪播
const dots = document.querySelector("#attraction__top__pic__dots");
const imgPic = document.querySelector("#attraction__top__pic");
let i = 0;

function renderImgsAndDots() {
  renderImgs();
  renderDots();
}

function renderImgs() {
  imgPic.src = imgs[i];
}

function renderDots() {
  dots.innerHTML = "";
  for (let j = 0; j < imgs.length; j++) {
    const spanDot = document.createElement("span");
    spanDot.classList.add("dot");
    dots.appendChild(spanDot);

    if (j === i) {
      const dot = document.querySelector(`.dot:nth-child(${i + 1})`);
      // 同const dot = dots.children[j];
      dot.classList.add("dot--active");
    }
  }
}

const nextBtn = document.querySelector("#attraction__top__pics__right-btn");
const prevBtn = document.querySelector("#attraction__top__pics__left-btn");

nextBtn.addEventListener("click", () => {
  if (i < imgs.length - 1) {
    i++;
    renderImgsAndDots();
  } else {
    i = 0;
    renderImgsAndDots();
  }
});

prevBtn.addEventListener("click", () => {
  if (i > 0) {
    i--;
    renderImgsAndDots();
  } else {
    i = imgs.length - 1;
    renderImgsAndDots();
  }
});

// 根據使用者選擇的導覽時間，切換到對應的導覽費用
const allRadios = document.querySelectorAll("input[name='booking-time']");
const spanPrice = document.querySelector("#booking-price");
const morningPrice = "新台幣 2000 元";
const afternoonPrice = "新台幣 2500 元";

allRadios.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    time = event.target.value;
    if (time === "morning") {
      spanPrice.textContent = morningPrice;
    } else {
      spanPrice.textContent = afternoonPrice;
    }
  });
});

// 預約行程按鈕邏輯
const bookingBtnMain = document.querySelector("#booking-btn");

bookingBtnMain.addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    signInModal.style.display = "block";
    return;
  }

  const attractionId = getAttractionIdFromURL();
  const date = document.querySelector("input[type='date']").value;
  const priceText = spanPrice.textContent;
  const priceTextSplit = priceText.split(" ");
  const pricePart = priceTextSplit[1];

  try {
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
    if (data.ok) {
      window.location.href = "/booking";
    } else {
      alert("請確認所有欄位均已填寫");
      console.error("預約行程失敗: ", data.message);
    }
  } catch (err) {
    console.error("預約行程請求錯誤: ", err);
  }
});
