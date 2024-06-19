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

  console.log(data.images); // 印出一個有著所有url的array，array包一個字串元素，長度為1
  // 因為我將寫進資料庫時，將所有圖片存進同一欄中，資料型態為陣列，所以這邊要將此長度為1的陣列，用split("分割的斷點")分隔成有著多個url的一個陣列，才可以分別取出個別的url
  const imgs = data.images[0].split(",");
  console.log(imgs); // 印出一個有著所有url的array，array包多個字串元素，長度為景點包含的圖片數

  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    console.log(img);
  }

  const imgPic = document.querySelector("#attraction__top__pic");
  imgPic.src = imgs[0];

  // const divPics = document.querySelector("#attraction__top__pics");
  // divPics.style.backgroundImage = `url(${imgs[0]})`;
}

// function getImgs(imgs) {

// }

const allRadios = document.querySelectorAll("input[name='booking-time']");
const spanPrice = document.querySelector("#booking-price");
const morningPrce = "新台幣 2000 元";
const afternoonPrice = "新台幣 2500 元";

allRadios.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    if (event.target.value === "morning") {
      spanPrice.textContent = morningPrce;
    } else {
      spanPrice.textContent = afternoonPrice;
    }
  });
});
