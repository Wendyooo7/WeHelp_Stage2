// 登入用彈出視窗
const signBtn = document.querySelector("#before-sign");
const signInModal = document.querySelector("#sign-in-modal");
signBtn.addEventListener("click", () => {
  signInModal.style.display = "block";
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
    console.log(data); // 註冊成功會得到：{ok: true}
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
    console.log(data); // 註冊成功會得到：{ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwibmFtZSI6Ilx1NWMwZlx1ODI3ZSIsImVtYWlsIjoibG92ZUBnbWFpbC5jb20iLCJleHAiOjE3MTk5MzY3Mjd9.QSzpuoVriQZ6Drx5e3ZN2bvYG2qAb2wm_UlzGNGr7RM" }
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
      console.log(data);

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
}

const unSigned = document.querySelector("#before-sign");
const Signed = document.querySelector("#after-sign");
function updateUIForSignedInUser() {
  unSigned.textContent = "登出系統";
  unSigned.id = "#after-sign";
}

Signed.addEventListener("click", () => {
  updateUIForSignedOutUser();
  localStorage.removeItem("token");
});

function updateUIForSignedOutUser() {
  Signed.textContent = "登入／註冊";
  unSigned.id = "#before-sign";
}

// 以上寫完要複製一份到attraction.js，這樣才景點頁也才能套用

const divAttractions = document.querySelector("#attractions");
let nextPage;
let lastAttraction;
let keyword;

document.addEventListener("DOMContentLoaded", () => {
  loadAttractions();
  loadMRTlist();
});

// lastAttractionObserver需要定義在全域
const lastAttractionObserver = new IntersectionObserver(
  (entries) => {
    const lastAttractionEntry = entries[0];
    // console.log(lastAttractionEntry);　// 跟視窗交接兩次，所以會一個實體兩次
    if (!lastAttractionEntry.isIntersecting) return;
    // 若實體不在視窗內，就不偵測
    lastAttractionObserver.unobserve(lastAttractionEntry.target);
    // 偵測完就移除偵測，避免重複觸發
    console.log(lastAttractionEntry.target.textContent);
    loadMoreAttraction();
  },
  {
    // root: divAttractions, 若將預設root: body 改成root: divAttractions，代表divAttractions一出現就會觸發，一次會fetch全部的API
    // rootMargin: "0px", // 修改為 0px 以便完全進入視口時觸發
    threshold: 1, // 只有當元素完全進入視窗時才觸發回調函數，預設是0，即元素一進到視窗就觸發回調函數開始載入更多內容
  }
);

async function loadAttractions() {
  try {
    const response = await fetch("/api/attractions");
    const data = await response.json();
    nextPage = data.nextPage;
    const data2 = data.data;

    for (let i = 0; i < data2.length; i++) {
      const id = data2[i].id;
      const name = data2[i].name;
      const category = data2[i].category;
      const mrt = data2[i].mrt;
      const img = data2[i].images[0];
      // console.log(img);

      const divAttraction = document.createElement("div"); // 創建一個新的div元素
      divAttraction.classList.add("attraction"); // 給新元素添加類別
      divAttractions.appendChild(divAttraction); // 將新元素添加到容器中

      // 添加a標籤
      const aTag = document.createElement("a");
      aTag.href = `/attraction/${id}`;
      // 注意！backtick``符號位在鍵盤最左的位置，而非數字4的鍵位
      divAttraction.appendChild(aTag);

      const divImgName = document.createElement("div");
      divImgName.classList.add("attraction-img-name-container");
      aTag.appendChild(divImgName);
      // 為了要讓點擊此區塊時可以跳轉至景點個別頁面，改成上行：divAttraction.appendChild(divImgName);

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
      // divAttraction.appendChild(divInfo);

      const infoMRT = document.createElement("div");
      infoMRT.classList.add("attraction__info__MRT");
      infoMRT.textContent = mrt;
      divInfo.appendChild(infoMRT);

      const infoCAT = document.createElement("div");
      infoCAT.classList.add("attraction__info__CAT");
      infoCAT.textContent = category;
      divInfo.appendChild(infoCAT);

      lastAttraction = divAttraction;
    }
  } catch (err) {
    console.log(err);
  }

  // 要放在上面迴圈結束之後，不然會重複偵測，對同個API發出多次請求
  lastAttractionObserver.observe(lastAttraction);
}

async function loadMoreAttraction() {
  keyword = document.querySelector("#banner__search__keyword").value;

  try {
    if (nextPage === null) return;
    // 這樣page=最後一頁時就會自動跳出此函式了

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

    const data = await response.json();
    nextPage = data.nextPage;
    const data2 = data.data;

    for (let i = 0; i < data2.length; i++) {
      const id = data2[i].id;
      const name = data2[i].name;
      const category = data2[i].category;
      const mrt = data2[i].mrt;
      const img = data2[i].images[0];

      const divAttraction = document.createElement("div"); // 創建一個新的div元素
      divAttraction.classList.add("attraction"); // 給新元素添加類別
      divAttractions.appendChild(divAttraction); // 將新元素添加到容器中

      // 添加a標籤
      const aTag = document.createElement("a");
      aTag.href = `/attraction/${id}`;
      // 注意！backtick``符號位在鍵盤最左的位置，而非數字4的鍵位
      divAttraction.appendChild(aTag);

      const divImgName = document.createElement("div");
      divImgName.classList.add("attraction-img-name-container");
      aTag.appendChild(divImgName);
      // 為了要讓點擊此區塊時可以跳轉至景點個別頁面，改成上行：divAttraction.appendChild(divImgName);

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
      // divAttraction.appendChild(divInfo);

      const infoMRT = document.createElement("div");
      infoMRT.classList.add("attraction__info__MRT");
      infoMRT.textContent = mrt;
      divInfo.appendChild(infoMRT);

      const infoCAT = document.createElement("div");
      infoCAT.classList.add("attraction__info__CAT");
      infoCAT.textContent = category;
      divInfo.appendChild(infoCAT);

      lastAttraction = divAttraction;
    }

    // 如果還有新的div產生，就把它列入觀察對象
    if (lastAttraction) {
      lastAttractionObserver.observe(lastAttraction);
    }
  } catch (err) {
    console.log(err);
  }
}

document
  .querySelector("#banner__search__btn")
  .addEventListener("click", async () => {
    keyword = document.querySelector("#banner__search__keyword").value;

    try {
      const response = await fetch(
        `/api/attractions?keyword=${encodeURIComponent(keyword)}`
      );

      const data = await response.json();
      nextPage = data.nextPage;
      const data2 = data.data;

      divAttractions.innerHTML = "";

      for (let i = 0; i < data2.length; i++) {
        const id = data2[i].id;
        const name = data2[i].name;
        const category = data2[i].category;
        const mrt = data2[i].mrt;
        const img = data2[i].images[0];

        const divAttraction = document.createElement("div"); // 創建一個新的div元素
        divAttraction.classList.add("attraction"); // 給新元素添加類別
        divAttractions.appendChild(divAttraction); // 將新元素添加到容器中

        // 添加a標籤
        const aTag = document.createElement("a");
        aTag.href = `/attraction/${id}`;
        // 注意！backtick``符號位在鍵盤最左的位置，而非數字4的鍵位
        divAttraction.appendChild(aTag);

        const divImgName = document.createElement("div");
        divImgName.classList.add("attraction-img-name-container");
        aTag.appendChild(divImgName);
        // 為了要讓點擊此區塊時可以跳轉至景點個別頁面，改成上行：divAttraction.appendChild(divImgName);

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
        // divAttraction.appendChild(divInfo);

        const infoMRT = document.createElement("div");
        infoMRT.classList.add("attraction__info__MRT");
        infoMRT.textContent = mrt;
        divInfo.appendChild(infoMRT);

        const infoCAT = document.createElement("div");
        infoCAT.classList.add("attraction__info__CAT");
        infoCAT.textContent = category;
        divInfo.appendChild(infoCAT);

        lastAttraction = divAttraction;
      }

      // 如果還有新的div產生，就把它列入觀察對象
      if (lastAttraction) {
        lastAttractionObserver.observe(lastAttraction);
      }
    } catch (err) {
      console.log(err);
    }
  });

async function loadMRTlist() {
  try {
    const response = await fetch("/api/mrts");
    const data = await response.json();
    const data2 = data.data;

    // console.log(data2);
    // 裝32個捷運站名稱的陣列
    const ulMRT = document.querySelector("ul");

    for (let i = 0; i < data2.length; i++) {
      const mrt = data2[i];
      const liMRT = document.createElement("li"); // 創建一個新的li元素
      liMRT.classList.add("mrt"); // 給新元素添加類別
      liMRT.textContent = mrt;

      // liMRT.onclick = sendKeyword;
      ulMRT.appendChild(liMRT); // 將新元素添加到容器中
    }

    // 事件監聽器
    const MRTlis = document.querySelectorAll(".mrt");
    MRTlis.forEach((li) => {
      li.addEventListener("click", async (event) => {
        const clickedLi = event.target;
        keyword = clickedLi.textContent;
        const input = document.querySelector("#banner__search__keyword");
        input.value = clickedLi.textContent;

        try {
          const response = await fetch(
            `/api/attractions?keyword=${encodeURIComponent(keyword)}`
          );

          const data = await response.json();
          nextPage = data.nextPage;
          const data2 = data.data;

          divAttractions.innerHTML = "";

          for (let i = 0; i < data2.length; i++) {
            const id = data2[i].id;
            const name = data2[i].name;
            const category = data2[i].category;
            const mrt = data2[i].mrt;
            const img = data2[i].images[0];

            const divAttraction = document.createElement("div"); // 創建一個新的div元素
            divAttraction.classList.add("attraction"); // 給新元素添加類別
            divAttractions.appendChild(divAttraction); // 將新元素添加到容器中

            // 添加a標籤
            const aTag = document.createElement("a");
            aTag.href = `/attraction/${id}`;
            // 注意！backtick``符號位在鍵盤最左的位置，而非數字4的鍵位
            divAttraction.appendChild(aTag);

            const divImgName = document.createElement("div");
            divImgName.classList.add("attraction-img-name-container");
            aTag.appendChild(divImgName);
            // 為了要讓點擊此區塊時可以跳轉至景點個別頁面，改成上行：divAttraction.appendChild(divImgName);

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
            // divAttraction.appendChild(divInfo);

            const infoMRT = document.createElement("div");
            infoMRT.classList.add("attraction__info__MRT");
            infoMRT.textContent = mrt;
            divInfo.appendChild(infoMRT);

            const infoCAT = document.createElement("div");
            infoCAT.classList.add("attraction__info__CAT");
            infoCAT.textContent = category;
            divInfo.appendChild(infoCAT);

            lastAttraction = divAttraction;
          }

          // 如果還有新的div產生，就把它列入觀察對象
          if (lastAttraction) {
            lastAttractionObserver.observe(lastAttraction);
          }
        } catch (err) {
          console.log(err);
        }
      });
    });
  } catch (err) {
    console.log(err);
  }
}

// onclick屬性
const clickedLi = document.querySelector(".mrt");
async function sendKeyword() {
  keyword = clickedLi.textContent;
  console.log("keyword: ", keyword);

  try {
    const response = await fetch(
      `/api/attractions?keyword=${encodeURIComponent(keyword)}`
    );

    const data = await response.json();
    nextPage = data.nextPage;
    const data2 = data.data;

    divAttractions.innerHTML = "";

    for (let i = 0; i < data2.length; i++) {
      const id = data2[i].id;
      const name = data2[i].name;
      const category = data2[i].category;
      const mrt = data2[i].mrt;
      const img = data2[i].images[0];

      const divAttraction = document.createElement("div"); // 創建一個新的div元素
      divAttraction.classList.add("attraction"); // 給新元素添加類別
      divAttractions.appendChild(divAttraction); // 將新元素添加到容器中

      // 添加a標籤
      const aTag = document.createElement("a");
      aTag.href = `/attraction/${id}`;
      // 注意！backtick``符號位在鍵盤最左的位置，而非數字4的鍵位
      divAttraction.appendChild(aTag);

      const divImgName = document.createElement("div");
      divImgName.classList.add("attraction-img-name-container");
      aTag.appendChild(divImgName);
      // 為了要讓點擊此區塊時可以跳轉至景點個別頁面，改成上行：divAttraction.appendChild(divImgName);

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
      // divAttraction.appendChild(divInfo);

      const infoMRT = document.createElement("div");
      infoMRT.classList.add("attraction__info__MRT");
      infoMRT.textContent = mrt;
      divInfo.appendChild(infoMRT);

      const infoCAT = document.createElement("div");
      infoCAT.classList.add("attraction__info__CAT");
      infoCAT.textContent = category;
      divInfo.appendChild(infoCAT);

      lastAttraction = divAttraction;
    }

    // 如果還有新的div產生，就把它列入觀察對象
    if (lastAttraction) {
      lastAttractionObserver.observe(lastAttraction);
    }
  } catch (err) {
    console.log(err);
  }
}

const ulElement = document.querySelector("#mrt-bar__ul-container");

// GPT & Phild
function scrollToLeft() {
  console.log("往左");
  ulElement.scrollBy({ left: -400, behavior: "smooth" });
}

function scrollRight() {
  console.log("往右");
  ulElement.scrollBy({ left: 400, behavior: "smooth" });
}

// 在全域使用window.addEventListener可以選取全部的li標籤，但使用li.addEventListener不行，怪哉
// window.addEventListener("click", () => {
//   const MRTlis = document.querySelectorAll(".mrt");
//   console.log("MRTlis: ", MRTlis);
// });

// 以下程式碼待整理
// 2-3的code
// console.log(nextPage);
// 這邊undefined了

// // 目前都把Observer和loadMore()都放進window.onload中，發現有抓到第一頁最後一個div行天宮，但一直偵測它，看來是沒有成功移除偵測
// const divAttractions = document.querySelector("#attractions");
// let nextPage;
// let lastAttraction;

// window.onload = async function () {
//   try {
//     const response = await fetch("http://127.0.0.1:8000/api/attractions");
//     const data = await response.json();
//     // let nextPage = data.nextPage;
//     // nextPage = nextPage;
//     // 上行將資料賦值給全域變數
//     nextPage = data.nextPage;
//     console.log(nextPage);
//     const data2 = data.data;

//     for (let i = 0; i < data2.length; i++) {
//       const name = data2[i].name;
//       const category = data2[i].category;
//       const mrt = data2[i].mrt;
//       const img = data2[i].images[0];

//       const divAttraction = document.createElement("div"); // 創建一個新的div元素
//       divAttraction.classList.add("attraction"); // 給新元素添加類別
//       divAttractions.appendChild(divAttraction); // 將新元素添加到容器中

//       const divImgName = document.createElement("div");
//       divImgName.classList.add("attraction-img-name-container");
//       divAttraction.appendChild(divImgName);

//       const imgAttraction = document.createElement("img");
//       // 之前寫錯的:attractionImg.src.add("img");
//       imgAttraction.classList.add("img0");
//       imgAttraction.src = img;
//       divImgName.appendChild(imgAttraction);

//       // 從這邊開始嘗試CSS用BEM命名
//       const divName = document.createElement("div");
//       divName.classList.add("attraction__info__name");
//       divName.textContent = name;
//       divImgName.appendChild(divName);

//       const divInfo = document.createElement("div");
//       divInfo.classList.add("attraction__info");
//       divAttraction.appendChild(divInfo);

//       const infoMRT = document.createElement("div");
//       infoMRT.classList.add("attraction__info__MRT");
//       infoMRT.textContent = mrt;
//       divInfo.appendChild(infoMRT);

//       const infoCAT = document.createElement("div");
//       infoCAT.classList.add("attraction__info__CAT");
//       infoCAT.textContent = category;
//       divInfo.appendChild(infoCAT);
//       // return nextPage;

//       lastAttraction = document.querySelector(".attraction:last-child");
//     }
//   } catch (err) {
//     console.log(err);
//   }
//   console.log(lastAttraction);
//   console.log(typeof lastAttraction);

//   // 放在異步函式外
//   if (lastAttraction) {
//     // 偵測最後一個.attraction
//     const lastAttractionObserver = new IntersectionObserver(
//       (entries) => {
//         const lastAttractionEntries = entries[0];
//         console.log(lastAttractionEntries);
//         if (!lastAttractionEntries.isIntersecting) return loadMoreAttraction();
//         // 這邊考慮把下面的loadMoreAttraction()宣告移上來，因為下面lastAttractionObserver.observe(".attraction:last-child");又抓不到了
//         lastAttractionObserver.unobserve(lastAttractionEntries.target);
//         // console.log(lastAttractionEntries.target);
//         lastAttractionObserver.observe(lastAttraction);
//       },
//       { rootMargin: "100px" }
//     );

//     lastAttractionObserver.observe(lastAttraction);
//   }

//   async function loadMoreAttraction() {
//     try {
//       const response = await fetch(
//         `http://127.0.0.1:8000/api/attractions?page=${encodeURIComponent(
//           nextPage
//         )}`
//       );
//       const data = await response.json();
//       nextPage = data.nextPage;
//       const data2 = data.data;

//       for (let i = 0; i < data2.length; i++) {
//         const name = data2[i].name;
//         const category = data2[i].category;
//         const mrt = data2[i].mrt;
//         const img = data2[i].images[0];

//         const divAttraction = document.createElement("div"); // 創建一個新的div元素
//         divAttraction.classList.add("attraction"); // 給新元素添加類別
//         divAttractions.appendChild(divAttraction); // 將新元素添加到容器中
//         lastAttractionObserver.observe(divAttraction);

//         const divImgName = document.createElement("div");
//         divImgName.classList.add("attraction-img-name-container");
//         divAttraction.appendChild(divImgName);

//         const imgAttraction = document.createElement("img");
//         // 之前寫錯的:attractionImg.src.add("img");
//         imgAttraction.classList.add("img0");
//         imgAttraction.src = img;
//         divImgName.appendChild(imgAttraction);

//         // 從這邊開始嘗試CSS用BEM命名
//         const divName = document.createElement("div");
//         divName.classList.add("attraction__info__name");
//         divName.textContent = name;
//         divImgName.appendChild(divName);

//         const divInfo = document.createElement("div");
//         divInfo.classList.add("attraction__info");
//         divAttraction.appendChild(divInfo);

//         const infoMRT = document.createElement("div");
//         infoMRT.classList.add("attraction__info__MRT");
//         infoMRT.textContent = mrt;
//         divInfo.appendChild(infoMRT);

//         const infoCAT = document.createElement("div");
//         infoCAT.classList.add("attraction__info__CAT");
//         infoCAT.textContent = category;
//         divInfo.appendChild(infoCAT);
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   }
// };

// // 偵測全部
// // 選取要偵測的元素
// const divAttraction = document.querySelectorAll(".attraction");

// // 創建偵測者
// const observer = new IntersectionObserver((entries) => {
//   entries.forEach((entry) => {
//     console.log(entry, entry.isIntersecting);
//   });
// });

// // // 偵測者.偵測(要偵測的元素)
// divAttraction.forEach((attraction) => {
//   observer.observe(attraction);
// });
// _________________________________________________________________
// // 放在異步函式外
// if (lastAttraction) {
//   // 偵測最後一個.attraction
//   const lastAttractionObserver = new IntersectionObserver(
//     (entries) => {
//       const lastAttractionEntries = entries[0];
//       console.log(lastAttractionEntries);
//       if (!lastAttractionEntries.isIntersecting) return loadMoreAttraction();
//       // 這邊考慮把下面的loadMoreAttraction()宣告移上來，因為下面lastAttractionObserver.observe(".attraction:last-child");又抓不到了
//       lastAttractionObserver.unobserve(lastAttractionEntries.target);
//       console.log(lastAttractionEntries.target);
//       lastAttractionObserver.observe(lastAttraction);
//     },
//     { rootMargin: "100px" }
//   );

//   lastAttractionObserver.observe(lastAttraction);
// }

// async function loadMoreAttraction() {
//   try {
//     const response = await fetch(
//       `http://127.0.0.1:8000/api/attractions?page=${encodeURIComponent(
//         nextPage
//       )}`
//     );
//     const data = await response.json();
//     nextPage = data.nextPage;
//     const data2 = data.data;

//     for (let i = 0; i < data2.length; i++) {
//       const name = data2[i].name;
//       const category = data2[i].category;
//       const mrt = data2[i].mrt;
//       const img = data2[i].images[0];

//       const divAttraction = document.createElement("div"); // 創建一個新的div元素
//       divAttraction.classList.add("attraction"); // 給新元素添加類別
//       divAttractions.appendChild(divAttraction); // 將新元素添加到容器中
//       lastAttractionObserver.observe(divAttraction);

//       const divImgName = document.createElement("div");
//       divImgName.classList.add("attraction-img-name-container");
//       divAttraction.appendChild(divImgName);

//       const imgAttraction = document.createElement("img");
//       // 之前寫錯的:attractionImg.src.add("img");
//       imgAttraction.classList.add("img0");
//       imgAttraction.src = img;
//       divImgName.appendChild(imgAttraction);

//       // 從這邊開始嘗試CSS用BEM命名
//       const divName = document.createElement("div");
//       divName.classList.add("attraction__info__name");
//       divName.textContent = name;
//       divImgName.appendChild(divName);

//       const divInfo = document.createElement("div");
//       divInfo.classList.add("attraction__info");
//       divAttraction.appendChild(divInfo);

//       const infoMRT = document.createElement("div");
//       infoMRT.classList.add("attraction__info__MRT");
//       infoMRT.textContent = mrt;
//       divInfo.appendChild(infoMRT);

//       const infoCAT = document.createElement("div");
//       infoCAT.classList.add("attraction__info__CAT");
//       infoCAT.textContent = category;
//       divInfo.appendChild(infoCAT);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// }

// ___________________________________________________________________

// 偵測#attractions
// // 選取要偵測的元素
// const divAttractions = document.querySelector("#attractions");

// // 創建偵測者
// const observer = new IntersectionObserver((entries) => {
//   console.log(entries);
// });

// // 偵測者.偵測(要偵測的元素)
// observer.observe(divAttractions);
// // Uncaught TypeError: IntersectionObserver.observe: Argument 1 is not an object.
