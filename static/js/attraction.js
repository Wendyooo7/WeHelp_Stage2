document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  fetchAttractionID();
});

async function fetchAttractionID() {
  const pathName = window.location.pathname;
  //   console.log(pathName); /attraction/7
  const pathParts = pathName.split("/");
  //   console.log(pathParts); Array(3) [ "", "attraction", "7" ]
  const attractionId = pathParts[pathParts.length - 1]; // 取得url最後一部分作為 attractionId
  const url = `/api/attraction/${attractionId}`;

  try {
    const response = await fetch(url);
    // const response = await fetch("/api/attraction/{attractionId}");
    const responseJSON = await response.json();
    const data = responseJSON.data;
    // console.log(data);
    renderAttraction(data); // 將 data 作為參數傳遞給 renderAttraction
  } catch (err) {
    console.log(err);
  }
}

let imgs;

function renderAttraction(data) {
  // 接受 data 參數
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

  renderImgs(); // 初始顯示第一張圖片和初始化點點
}

// 圖片輪播
const dots = document.querySelector("#attraction__top__pic__dots");
const imgPic = document.querySelector("#attraction__top__pic");
let i = 0;

function renderImgs() {
  imgPic.src = imgs[i];
  renderDots();
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
    renderImgs();
  } else {
    i = 0;
    renderImgs();
  }
});

prevBtn.addEventListener("click", () => {
  if (i > 0) {
    i--;
    renderImgs();
  } else {
    i = imgs.length - 1;
    renderImgs();
  }
});

// 根據使用者選擇的導覽時間，切換到對應的導覽費用
const allRadios = document.querySelectorAll("input[name='booking-time']");
const spanPrice = document.querySelector("#booking-price");
const morningPrice = "新台幣 2000 元";
const afternoonPrice = "新台幣 2500 元";

allRadios.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    if (event.target.value === "morning") {
      spanPrice.textContent = morningPrice;
    } else {
      spanPrice.textContent = afternoonPrice;
    }
  });
});
