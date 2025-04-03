import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from './firebase.js';

// now you can use Firestore like:
import { collection, getDocs, addDoc } from 'firebase/firestore';
// const bookingsRef = collection(db, "bookings");
// const snapshot = await getDocs(bookingsRef);


document.addEventListener("DOMContentLoaded", function () {
  let selectedDate = null;
  let selectedEl = null;

  const calendarEl = document.getElementById("calendar");
  let selectedCategory = "Category"; // default
  let selectedAdType = "Banner"

  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    customButtons: {
      bookButton: {
        text: "Book Selected Date",
        click: function () {
          if (!selectedDate) {
            alert("Please select a date first!");
            return;
          }

          // Check for double booking conflicts
          const maxSpots = 4;
          const parts = selectedDate.split("-"); // ["2025", "04", "03"]
          const startDate = new Date(parts[0], parts[1] - 1, parts[2]); // YYYY, MM (0-based), DD

          const bookingDays = [];

          // Generate 7-day span
          for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            bookingDays.push(day.toISOString().split("T")[0]); // format: YYYY-MM-DD
          }

          // Get all current events
          const allEvents = calendar.getEvents();

          // Count overlaps per day
          let bookingConflict = false;

          for (let date of bookingDays) {
            let count = 0;

            allEvents.forEach((event) => {
              const allEventsParts = date.split("-"); // ["2025", "04", "10"]
              const allEventscurrent = new Date(allEventsParts[0], allEventsParts[1] - 1, allEventsParts[2]); // Year, Month (0-based), Day
              allEventscurrent.setHours(0, 0, 0, 0);

              const eventStart = new Date(event.start);
              eventStart.setHours(0, 0, 0, 0);

              const eventEnd = new Date(event.end);
              eventEnd.setHours(0, 0, 0, 0);

              // Is this date within the event's range?
              if (
                event.title.includes(selectedCategory) &&
                event.title.includes(selectedAdType)
              ) {
                if (eventStart <= allEventscurrent && allEventscurrent < eventEnd) {
                  count++;
                }
              }
            });

            if (count >= maxSpots) {
              bookingConflict = true;
              break;
            }
          }

          if (bookingConflict) {
            alert(
              "Booking cannot be completed. The selected time range exceeds availability."
            );
            return;
          }

          const start = new Date(selectedDate);
          const end = new Date(start);
          end.setDate(end.getDate() + 7);

          let title = `Booked an Ad Plan for 7 Days!`;

          // Include both if valid
          if (selectedAdType !== "Ad Type") {
            title = `Booked a ${selectedCategory} ${selectedAdType} Ad Plan for 7 Days!`;
          }

          calendar.addEvent({
            title: title,
            start: start.toISOString().split("T")[0],
            end: end.toISOString().split("T")[0],
            allDay: true,
          });

          selectedEl.classList.remove("selected-date");
          selectedDate = null;
          selectedEl = null;
        },
      },
      categoryDropdown: {
        text: "Categories ▼",
        click: null, // we'll override click with custom HTML
      },
      adTypeDropdown: {
        text: "Ad Type ▼",
        click: null,
      },
    },
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "categoryDropdown adTypeDropdown bookButton",
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

            // Optional: trigger event filtering logic here
            console.log("Selected category:", selectedCategory);
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
