const divAttractions = document.querySelector("#attractions");
let nextPage;
let lastAttraction;
let keyword;

document.addEventListener("DOMContentLoaded", () => {
  loadInitialAttractions();
  loadMRTlist();
});

// IntersectionObserver 需要定義在全域
const lastAttractionObserver = new IntersectionObserver(
  (entries) => {
    const lastAttractionEntry = entries[0];
    if (!lastAttractionEntry.isIntersecting) return;
    // 若實體不在視窗內，就不偵測
    lastAttractionObserver.unobserve(lastAttractionEntry.target);
    // 偵測完就移除偵測，避免重複觸發
    loadMoreAttractions();
  },
  { threshold: 0.5 }
);

async function fetchInitialAttractions() {
  try {
    const response = await fetch("/api/attractions");
    const data = await response.json();
    nextPage = data.nextPage;
    const data2 = data.data;
    return data2;
  } catch (err) {
    console.error("fetch 初始景點失敗: ", err);
  }
}

async function fetchMoreAttractions() {
  if (nextPage === null) return;
  // 這樣 page === 最後一頁時就會自動跳出此函式了
  keyword = document.querySelector("#banner__search__keyword").value;
  let response;

  if (keyword) {
    response = await fetch(
      `/api/attractions?page=${encodeURIComponent(
        nextPage
      )}&keyword=${encodeURIComponent(keyword)}`
    );
  } else {
    response = await fetch(
      `/api/attractions?page=${encodeURIComponent(nextPage)}`
    );
  }

  try {
    const data = await response.json();
    nextPage = data.nextPage;
    const data2 = data.data;
    return data2;
  } catch (err) {
    console.error("fetch 更多景點失敗: ", err);
  }
}

function createDivAttraction(id, name, category, mrt, img) {
  const divAttraction = document.createElement("div");
  divAttraction.classList.add("attraction");

  const aTag = document.createElement("a");
  aTag.href = `/attraction/${id}`;
  divAttraction.appendChild(aTag);

  const divImgName = document.createElement("div");
  divImgName.classList.add("attraction-img-name-container");
  aTag.appendChild(divImgName);

  const imgAttraction = document.createElement("img");
  imgAttraction.classList.add("img0");
  imgAttraction.src = img;
  divImgName.appendChild(imgAttraction);

  const divName = document.createElement("div");
  divName.classList.add("attraction__info__name");
  divName.textContent = name;
  divImgName.appendChild(divName);

  const divInfo = document.createElement("div");
  divInfo.classList.add("attraction__info");
  aTag.appendChild(divInfo);

  const infoMRT = document.createElement("div");
  infoMRT.classList.add("attraction__info__MRT");
  infoMRT.textContent = mrt;
  divInfo.appendChild(infoMRT);

  const infoCAT = document.createElement("div");
  infoCAT.classList.add("attraction__info__CAT");
  infoCAT.textContent = category;
  divInfo.appendChild(infoCAT);

  return divAttraction;
}

async function loadInitialAttractions() {
  const data2 = await fetchInitialAttractions();
  for (let i = 0; i < data2.length; i++) {
    const id = data2[i].id;
    const name = data2[i].name;
    const category = data2[i].category;
    const mrt = data2[i].mrt;
    const img = data2[i].images[0];

    const divAttraction = createDivAttraction(id, name, category, mrt, img);
    divAttractions.appendChild(divAttraction);
    lastAttraction = divAttraction;
  }

  // 要放在上面迴圈結束之後，不然將會重複偵測，然後對同個API發出多次請求
  lastAttractionObserver.observe(lastAttraction);
}

async function loadMoreAttractions() {
  const data2 = await fetchMoreAttractions();

  for (let i = 0; i < data2.length; i++) {
    const id = data2[i].id;
    const name = data2[i].name;
    const category = data2[i].category;
    const mrt = data2[i].mrt;
    const img = data2[i].images[0];

    const divAttraction = createDivAttraction(id, name, category, mrt, img);
    divAttractions.appendChild(divAttraction);
    lastAttraction = divAttraction;
  }

  // 如果還有新的div產生，就把它列入觀察對象
  if (lastAttraction) {
    lastAttractionObserver.observe(lastAttraction);
  }
}

async function fetchKeywordAttractions(keyword) {
  try {
    const response = await fetch(
      `/api/attractions?keyword=${encodeURIComponent(keyword)}`
    );

    const data = await response.json();
    nextPage = data.nextPage;
    const data2 = data.data;
    return data2;
  } catch (err) {
    console.error("fetch 關鍵字景點失敗: ", err);
  }
}

const noSearchResult = document.querySelector("#no-search-result");

document
  .querySelector("#banner__search__btn")
  .addEventListener("click", async () => {
    noSearchResult.style.display = "none";

    keyword = document.querySelector("#banner__search__keyword").value;
    if (!keyword) return;

    divAttractions.innerHTML = "";
    const data2 = await fetchKeywordAttractions(keyword);
    if (data2.length === 0) {
      noSearchResult.style.display = "block";
      noSearchResult.textContent = "查無內容";
      return;
    }

    for (let i = 0; i < data2.length; i++) {
      const id = data2[i].id;
      const name = data2[i].name;
      const category = data2[i].category;
      const mrt = data2[i].mrt;
      const img = data2[i].images[0];

      const divAttraction = createDivAttraction(id, name, category, mrt, img);
      divAttractions.appendChild(divAttraction);
      lastAttraction = divAttraction;
    }

    if (lastAttraction) {
      lastAttractionObserver.observe(lastAttraction);
    }
  });

async function loadMRTlist() {
  try {
    const response = await fetch("/api/mrts");
    const data = await response.json();
    const data2 = data.data;

    const ulMRT = document.querySelector("ul");

    for (let i = 0; i < data2.length; i++) {
      const mrt = data2[i];
      const liMRT = document.createElement("li");
      liMRT.classList.add("mrt");
      liMRT.textContent = mrt;
      ulMRT.appendChild(liMRT);
    }

    const MRTlis = document.querySelectorAll(".mrt");
    MRTlis.forEach((li) => {
      li.addEventListener("click", async (event) => {
        noSearchResult.style.display = "none";

        const clickedLi = event.target;
        keyword = clickedLi.textContent;
        const input = document.querySelector("#banner__search__keyword");
        input.value = clickedLi.textContent;

        const data2 = await fetchKeywordAttractions(keyword);
        divAttractions.innerHTML = "";

        for (let i = 0; i < data2.length; i++) {
          const id = data2[i].id;
          const name = data2[i].name;
          const category = data2[i].category;
          const mrt = data2[i].mrt;
          const img = data2[i].images[0];

          const divAttraction = createDivAttraction(
            id,
            name,
            category,
            mrt,
            img
          );
          divAttractions.appendChild(divAttraction);
          lastAttraction = divAttraction;
        }

        if (lastAttraction) {
          lastAttractionObserver.observe(lastAttraction);
        }
      });
    });
  } catch (err) {
    console.error("無法渲染捷運列表:", err);
  }
}

// MRT bar 的左右滑動效果
const ulElement = document.querySelector("#mrt-bar__ul-container");

function scrollToLeft() {
  ulElement.scrollBy({ left: -400, behavior: "smooth" });
}

// 以下函式不能命名為 scrollToRight，因為此函式掛在 onClick 屬性上，會和既有的 HTML 屬性名稱相撞，將不能正常運作
function scrollRight() {
  ulElement.scrollBy({ left: 400, behavior: "smooth" });
}
