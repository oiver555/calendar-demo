import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from './firebase.js';

// now you can use Firestore like:
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
// const bookingsRef = collection(db, "bookings");
// const snapshot = await getDocs(bookingsRef);
 
document.addEventListener("DOMContentLoaded", async function () {
  let selectedDate = null;
  let selectedEl = null;

  const calendarEl = document.getElementById("calendar");
  let selectedCategory = "Category"; // default
  let selectedAdType = "Ad Type"


  async function loadFilteredBookings() {
    if (selectedCategory === "Category" || selectedAdType === "Ad Type") return;
    if (selectedEl) selectedEl.classList.remove("selected-date");
    const q = query(
      collection(db, "bookings"),
      where("category", "==", selectedCategory),
      where("adType", "==", selectedAdType)
    );

    const snapshot = await getDocs(q);

    // 🧼 Clear previous events
    calendar.getEvents().forEach(event => event.remove());

    // 🆕 Add new events
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      calendar.addEvent({
        title: `Booked a ${data.category} ${data.adType} Ad Plan`,
        start: data.start,
        end: data.end,
        allDay: true,
      });
    });
  }


  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    customButtons: {
      bookButton: {
        text: "Book Selected Date",
        click: async function () {
          if (!selectedDate) {
            alert("Please select a date first!");
            return;
          }

          const maxSpots = 4;
          const parts = selectedDate.split("-");
          const startDate = new Date(parts[0], parts[1] - 1, parts[2]);

          const bookingDays = [];
          for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            bookingDays.push(day.toISOString().split("T")[0]);
          }

          const allEvents = calendar.getEvents();
          let bookingConflict = false;

          for (let date of bookingDays) {
            let count = 0;
            const current = new Date(date);
            current.setHours(0, 0, 0, 0);

            allEvents.forEach((event) => {
              const eventStart = new Date(event.start);
              const eventEnd = new Date(event.end);
              eventStart.setHours(0, 0, 0, 0);
              eventEnd.setHours(0, 0, 0, 0);

              if (
                event.title.includes(selectedCategory) &&
                event.title.includes(selectedAdType) &&
                eventStart <= current && current < eventEnd
              ) {
                count++;
              }
            });

            if (count >= maxSpots) {
              bookingConflict = true;
              break;
            }
          }

          if (bookingConflict) {
            alert("Booking cannot be completed. The selected time range exceeds availability.");
            return;
          }

          // Save to Firestore
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);

          try {
            await addDoc(collection(db, "bookings"), {
              category: selectedCategory,
              adType: selectedAdType,
              start: startDate.toISOString().split("T")[0],
              end: endDate.toISOString().split("T")[0],
              createdAt: new Date()
            });

            // Add to calendar after saving
            let title = `Booked a ${selectedCategory} ${selectedAdType} Ad Plan for 7 Days!`;

            calendar.addEvent({
              title: title,
              start: startDate.toISOString().split("T")[0],
              end: endDate.toISOString().split("T")[0],
              allDay: true,
            });

            selectedEl.classList.remove("selected-date");
            selectedDate = null;
            selectedEl = null;

          } catch (error) {
            console.error("Error saving booking:", error);
            alert("Something went wrong while saving your booking.");
          }
        }
      },

      categoryDropdown: {
        text: "Categories ▼",
        click: null, // we'll override click with custom HTML
      },
      adTypeDropdown: {
        text: "Ad Type ▼",
        click: null,
      },
      deleteAllButton: {
        text: "Delete All Bookings",
        click: async function () {
          if (!confirm("Are you sure you want to delete ALL bookings?")) return;
    
          const snapshot = await getDocs(collection(db, "bookings"));
    
          const deletePromises = snapshot.docs.map((docSnap) =>
            deleteDoc(doc(db, "bookings", docSnap.id))
          );
    
          await Promise.all(deletePromises);
    
          alert("All bookings deleted.");
          calendar.getEvents().forEach(event => event.remove());
        },
      },
    },
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "deleteAllButton categoryDropdown adTypeDropdown bookButton",
    },
    dateClick: function (info) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const clickedDate = new Date(info.dateStr);

      if (clickedDate < today) {
        alert("You can't select a past date.");
        return;
      }

      if (selectedEl) {
        selectedEl.classList.remove("selected-date");
      }

      info.dayEl.classList.add("selected-date");
      selectedEl = info.dayEl;
      selectedDate = info.dateStr;
    },
    dayCellDidMount: function (info) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const cellDate = new Date(
        info.date.getFullYear(),
        info.date.getMonth(),
        info.date.getDate()
      );

      if (cellDate < today) {
        info.el.style.backgroundColor = "#eee"; // gray background
        info.el.style.pointerEvents = "none"; // disable clicks
        info.el.style.opacity = "0.5"; // optional dimming
      }
    },
    datesSet: function () {
      // Replace the button with a real dropdown only after calendar renders
      const dropdownBtn = document.querySelector(
        ".fc-categoryDropdown-button"
      );

      if (
        dropdownBtn &&
        !dropdownBtn.classList.contains("dropdown-initialized")
      ) {
        dropdownBtn.classList.add("dropdown-initialized");

        dropdownBtn.innerHTML = `
          <div class="dropdown category-dropdown-wrapper">
            <button class="dropdown-button">Categories ▼</button>
            <div class="dropdown-menu" style="display:none;position:absolute;background:#333;color:#fff;border-radius:4px;z-index:999;">
              <a href="#">Entertainment</a>
              <a href="#">Hot Spots</a>
              <a href="#">Food</a>
              <a href="#">Lodging</a>
              <a href="#">Attractions</a>
              <a href="#">Venues</a>
              <a href="#">Services</a>
              <a href="#">Much More</a>
            </div>
          </div>
        `;

        const dropdown = dropdownBtn.querySelector(".dropdown");
        const menu = dropdown.querySelector(".dropdown-menu");
        const button = dropdown.querySelector(".dropdown-button");

        button.addEventListener("click", (e) => {
          e.stopPropagation();
          menu.style.display =
            menu.style.display === "block" ? "none" : "block";
        });

        // Handle click on menu items
        menu.querySelectorAll("a").forEach((item) => {
          item.addEventListener("click", (e) => {
            e.preventDefault();
            selectedCategory = e.target.textContent;
            selectedCategory =
              selectedCategory.trim() === ""
                ? "Category"
                : selectedCategory;
            button.textContent = selectedCategory + " ▼";
            menu.style.display = "none";
            loadFilteredBookings();
          });
        });

        document.addEventListener("click", () => {
          menu.style.display = "none";
        });

        const adTypeBtn = document.querySelector(
          ".fc-adTypeDropdown-button"
        );

        if (
          adTypeBtn &&
          !adTypeBtn.classList.contains("dropdown-initialized")
        ) {
          adTypeBtn.classList.add("dropdown-initialized");

          adTypeBtn.innerHTML = `
<div class="dropdown">
<button class="dropdown-button">Ad Type ▼</button>
<div class="dropdown-menu" style="display:none;position:absolute;background:#333;color:#fff;border-radius:4px;z-index:999;">
  <a href="#">Banner</a>
  <a href="#">Limelight</a>
  <a href="#">High Rollers</a>
</div>
</div>
`;

          const dropdown = adTypeBtn.querySelector(".dropdown");
          const menu = dropdown.querySelector(".dropdown-menu");
          const button = dropdown.querySelector(".dropdown-button");

          button.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.style.display =
              menu.style.display === "block" ? "none" : "block";
          });

          menu.querySelectorAll("a").forEach((item) => {
            item.addEventListener("click", (e) => {
              e.preventDefault();
              selectedAdType = e.target.textContent.trim();
              button.textContent = selectedAdType + " ▼";
              menu.style.display = "none";

              // Show or hide the Categories dropdown
              const categoryWrapper = document.querySelector(
                ".category-dropdown-wrapper"
              );
              if (
                selectedAdType === "Banner" ||
                selectedAdType === "Limelight"
              ) {
                categoryWrapper?.classList.remove("hidden");
              } else {
                categoryWrapper?.classList.add("hidden");
                selectedCategory = "Category";
              }
              loadFilteredBookings();
              console.log("Selected ad type:", selectedAdType);
            });
          });

          document.addEventListener("click", () => {
            menu.style.display = "none";
          });
        }
      }
    },
  });

  calendar.render();
});

