import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCVEEs8VW7trSNeTLxxaPO1BQcW7ukp-g",
  authDomain: "to-do-fb901.firebaseapp.com",
  databaseURL: "https://to-do-fb901.firebaseio.com",
  projectId: "to-do-fb901",
  storageBucket: "to-do-fb901.appspot.com",
  messagingSenderId: "990229030522",
  appId: "1:990229030522:web:1a5253bcb763cc16923dc3",
  measurementId: "G-88LMHWCCZL",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

let db = firebase.firestore();

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const container = document.querySelector(".container");
const provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    let firebaseDocRefernce = db.collection("user-data").doc(user.uid);
    removeAllChildNodes(container);

    // Layout fucntions

    function setMainContainer() {
      let div = document.createElement("div");
      div.classList.add("main-container");
      div.innerHTML = `
      <div class="top-panel">
        <div class="intro">
          <h1>To-Do List</h1>
          <div class="user-name"></div>
        </div>
        <button class="logout" type="submit">Logout</button>
      </div>
      <div class="status-panel">
        <button type="button" class="pending-btn">Pending</button>
        <button type="button" class="completed-btn">Completed</button>
      </div>
      <section class="wrapper">
      </section>`;
      container.appendChild(div);
    }

    function addFormToWrapper() {
      let wrapper = document.querySelector(".wrapper");
      wrapper.innerHTML = `
      <button  type="button" class="add-event-form">+</button>
      <form class="event-form">
        <input type="text" id="event" name="event" placeholder="Event" autocomplete="off">
        <textarea type="text" id="description" name="description" placeholder="Description(Optional)"></textarea>
        <label for="priority"></label>
        <div class="in-form-wrapper">
          <div class="filler">
            <label for="priority">Priority : 
              <select name="priority" id="priority">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label for="date">Date :
              <input type="date" id="date" name="date">
            </label>
            <label for="time">Time :
              <input type="time" id="time" name="time">
            </label>
          </div>
          <button class="event-submit" type="button">Add</button>
        </div>
      </form>`;

      // Adding EventListener

      const addEvent = wrapper.querySelector(".add-event-form");
      const appendEvent = wrapper.querySelector(".event-submit");

      appendEvent.addEventListener("click", saveEventInfirebase, false);
      addEvent.addEventListener(
        "click",
        () => {
          let form = mainContainer.querySelector(".event-form");
          toggleFlexDisplay(form);
        },
        false
      );
    }

    setMainContainer();
    addFormToWrapper();

    // Constants declaration

    const mainContainer = document.querySelector(".main-container");
    const logout = mainContainer.querySelector(".logout");
    const userName = mainContainer.querySelector(".user-name");
    const wrapper = mainContainer.querySelector(".wrapper");
    const statusPanel = mainContainer.querySelector(".status-panel");
    const displayPending = statusPanel.querySelector(".pending-btn");
    const displayCompleted = statusPanel.querySelector(".completed-btn");
    let filter = "pending";
    let StatusChange = 0;

    // Event listeners

    logout.addEventListener("click", signout, false);
    displayPending.addEventListener("click", changeToPending, false);
    displayCompleted.addEventListener("click", changeToCompleted, false);

    //Initially we display the pending events
    displayPending.classList.add("status-panel-btn-focused");

    // Changing wrapper to display pending events
    function changeToPending() {
      removeAllChildNodes(wrapper);
      addFormToWrapper();
      filter = "pending";
      firebaseDocRefernce
        .get()
        .then(function (doc) {
          resetEventWrapper(doc);
        })
        .catch(function (error) {
          console.log("Error getting document:", error);
        });
      displayCompleted.classList.remove("status-panel-btn-focused");
      displayPending.classList.add("status-panel-btn-focused");
    }

    // Changing wrapper to display completed events
    function changeToCompleted() {
      removeAllChildNodes(wrapper);
      filter = "completed";
      firebaseDocRefernce
        .get()
        .then(function (doc) {
          resetEventWrapper(doc);
        })
        .catch(function (error) {
          console.log("Error getting document:", error);
        });
      displayPending.classList.remove("status-panel-btn-focused");
      displayCompleted.classList.add("status-panel-btn-focused");
      removeTheCheckbox();
    }

    function removeTheCheckbox() {
      setTimeout(() => {
        if (filter === "completed") {
          let events = wrapper.querySelectorAll(".event");
          events.forEach((event) => {
            let checkbox = event.querySelector(".state");
            checkbox.checked = true;
            checkbox.classList.add("event-fade-out");
            checkbox.addEventListener("click", (e) => {
              e.preventDefault();
            });
          });
        }
      }, 800);
    }

    // Setting the displayname

    if (user.displayName == null) {
      userName.textContent = user.email;
    } else {
      userName.textContent = user.displayName;
    }

    // Initializing the list of events

    function resetEventWrapper(doc) {
      for (let i = 1; i <= eventCountNo; i++) {
        let eventName = "Event" + i;
        let eventInfo = doc.data()[eventName];
        let Estatus;
        if (eventInfo != undefined) {
          Estatus = eventInfo.Estatus;
        }
        if (Estatus === filter) {
          appendEventToList(eventInfo, i);
        }
      }
    }

    // Set the Event count number

    let eventCountNo;
    firebaseDocRefernce
      .get()
      .then(function (doc) {
        if (doc.data() == undefined) {
          firebaseDocRefernce
            .set(
              {
                eventNumber: 0,
                userEmail: user.email,
              },
              { merge: true }
            )
            .catch(function (error) {
              console.error("Error writing document", error);
            });
          eventCountNo = 0;
        } else {
          eventCountNo = doc.data().eventNumber;
        }
      })
      .catch(function (error) {
        console.log("Error getting document:", error);
      });

    // saving event data in firebase

    function saveEventInfirebase(e) {
      e.preventDefault();
      let form = mainContainer.querySelector(".event-form");
      let formdata = new FormData(form);
      let event = formdata.get("event");
      let description = formdata.get("description");
      let priority = formdata.get("priority");
      let date = form.querySelector("#date").value;
      let time = formdata.get("time");
      if (event === "") {
        alert("Opps you forgot to mention the event");
        return;
      }

      // Factory function
      const CreateEvent = (Ename, Edesp, Epriority, Edate, Etime) => {
        const getEname = () => Ename;
        const getEdesp = () => Edesp;
        const getEpriority = () => Epriority;
        const getEdate = () => Edate;
        const getEtime = () => Etime;

        return { getEname, getEdesp, getEpriority, getEdate, getEtime };
      };
      let ToDo = CreateEvent(event, description, priority, date, time);

      eventCountNo++; // Incresing the count of events

      // Sending data to the firebase

      firebaseDocRefernce
        .set(
          {
            [`Event${eventCountNo}`]: {
              Ename: ToDo.getEname(),
              Edesp: ToDo.getEdesp(),
              Epriority: ToDo.getEpriority(),
              Edate: ToDo.getEdate(),
              Etime: ToDo.getEtime(),
              Estatus: "pending",
            },
            eventNumber: eventCountNo,
          },
          { merge: true }
        )
        .catch(function (error) {
          console.error("Error writing document", error);
        });

      // removing the form after adding the data to firestore
      form.style.display = "none";
      form.reset();
    }

    // Toggle display function

    function toggleFlexDisplay(element) {
      if (element.style.display !== "flex") {
        element.style.display = "flex";
      } else {
        element.style.display = "none";
      }
    }

    // Listening to realtime database and changing the dom

    firebaseDocRefernce.onSnapshot(function (doc) {
      if (!StatusChange) {
        let source = doc.metadata.hasPendingWrites ? "Local" : "Server";
        if (source == "Server") {
          resetEventWrapper(doc);
        } else {
          let eventName = "Event" + eventCountNo;
          let eventInfo = doc.data()[eventName];
          appendEventToList(eventInfo, eventCountNo);
        }
      } else {
        StatusChange = 0;
      }
    });

    // Updating the status of the event

    function UpdateStatus() {
      if (this.checked) {
        let event = this.parentElement;
        event.classList.add("event-fade-out");
        // this.parentElement.style.opacity = "0.1";
        setTimeout(() => {
          this.parentElement.style.display = "none";
        }, 300);
        let eventNo = event.querySelector(".event-count-no").innerHTML;
        let eventcompleted = `Event${eventNo}.Estatus`;
        firebaseDocRefernce
          .update({
            [`${eventcompleted}`]: "completed",
          })
          .catch(function (error) {
            // The document probably doesn't exist.
            console.error("Error updating document: ", error);
          });
        StatusChange = 1;
      }
    }

    // Add Event Listeners to the new Events list function

    function addListenerToEvents(newEvent) {
      // Expand on click
      newEvent.addEventListener("click", () => {
        let element = newEvent.querySelector(".full-event-info");
        toggleFlexDisplay(element);
        if (screen.width < 600) {
          let shortEventInfo = newEvent.querySelector(
            ".newEvent-display-date-time"
          );
          toggleFlexDisplay(shortEventInfo);
        }
      });

      // Collapse on mouseleave eventlistener
      // newEvent.addEventListener("mouseleave", () => {
      //   let element = newEvent.querySelector(".full-event-info");
      //   element.style.display = "none";
      //   if (screen.width < 600) {
      //     let shortEventInfo = newEvent.querySelector(".newEvent-display-date-time");
      //     shortEventInfo.style.display = "none";
      //   }
      // });

      // Status checkbox listener
      let status = newEvent.querySelector(".state");
      status.addEventListener("change", UpdateStatus, false);
    }

    // Adds the eveent to the list if events

    function appendEventToList(eventInfo, eventCountNo) {
      const eventWrapper = document.querySelector(".wrapper");
      const newEvent = document.createElement("div");
      let Ename = eventInfo.Ename;
      let Edesp = eventInfo.Edesp;
      let Epriority = eventInfo.Epriority;
      let Edate = eventInfo.Edate;
      let Etime = eventInfo.Etime;
      newEvent.classList.add("event");
      newEvent.innerHTML = `<div class="event-count-no">${eventCountNo}</div>
      <div class="event-priority-color"></div>
      <input type="checkbox" name="state" id="state" class="state" value="completed">
      <div class="event-info">
        <div class="short-event-info">
          <span class="newEvent-display-name">${Ename}</span>
          <span class="newEvent-display-date-time">
            <span>${Edate}</span> <span>${Etime}</span>
          </span>
        </div>
        <div class="full-event-info">
          <span class="event-newEvent-display-description">${Edesp}</span>
        </div>
      </div>`;
      eventWrapper.appendChild(newEvent);
      let eventPriority = newEvent.querySelector(".event-priority-color");
      eventPriority.classList.add(`event-priority-color-${Epriority}`);
      addListenerToEvents(newEvent);
    }

    // Signout function

    function signout() {
      firebase
        .auth()
        .signOut()
        .then(
          function () {
            location.reload();
          },
          function (error) {
            alert(error.message);
            console.log(error);
          }
        );
    }
  }

  // Tell user to login
  else {
    removeAllChildNodes(container);
    const loginContainer = document.createElement("div");
    loginContainer.classList.add("login-container");
    loginContainer.innerHTML = `
    <div class="login">
    <form class="login-form">
      <label for="email">Email </label>
      <input type="email" name="email" id="email"> 
      <label for="password">Password</label>
      <input type="password" name="password" id="password">
      <div class="login-error"></div>
      <button class="email-sign-in">Log in</button>
      <button class="email-sign-up">Sign up</button>
    </form>
    <button class="google-login" type="submit">
      Google
    </button>
    <button class="demo-login" type="submit">
      Demo
    </button>`;
    container.appendChild(loginContainer);
    const login = document.querySelector(".google-login");
    const form = document.querySelector(".login-form");
    const signUp = document.querySelector(".email-sign-up");
    const signIn = document.querySelector(".email-sign-in");
    const demoLogin = document.querySelector(".demo-login");
    login.addEventListener("click", loginWithGoogle, false);
    signIn.addEventListener("click", loginWithEmail, false);
    signUp.addEventListener("click", logupWithEmail, false);
    demoLogin.addEventListener("click", demoLoginEmail, false);

    function demoLoginEmail() {
      firebase
        .auth()
        .signInWithEmailAndPassword("demo@gmail.com", "admin123")
        .catch((error) => {
          alert(error.message);
          console.log(error);
        });
    }

    function loginWithGoogle() {
      firebase
        .auth()
        .signInWithPopup(provider)
        .then(function (result) {
          console.log("Logged In as : " + result);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
    function loginWithEmail(e) {
      e.preventDefault();
      let formdata = new FormData(form);
      let email = formdata.get("email");
      let password = formdata.get("password");
      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then((user) => {})
        .catch((error) => {
          let loginError = form.querySelector(".login-error");
          loginError.innerHTML =
            "!Couldn't find your Account<br> Try sign up if its your first time";
          console.log(error);
        });
    }
    function logupWithEmail(e) {
      e.preventDefault();
      let formdata = new FormData(form);
      let email = formdata.get("email");
      let password = formdata.get("password");
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((user) => {})
        .catch((error) => {
          let loginError = form.querySelector(".login-error");
          loginError.innerHTML = error.message;
          console.log(error.code);
          console.log(error.message);
        });
    }
  }
  function removeAllChildNodes(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }
});
