document.addEventListener("DOMContentLoaded", () => {
  fetchToGetMyTour();
});

async function fetchToGetMyTour() {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/booking", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = response.json();
}

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

      const data = response.json();

      if (data.ok) {
        console.log("刪除成功");
      } else {
        console.log(data.message);
      }
    } catch (err) {
      console.log(err);
    }
  });
